import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { all, editScene, editShot, isLoggedIn, withPermission } from './auth'
import {getManyFrom, getOneFrom} from 'convex-helpers/server/relationships'

import { vShotStatus } from './schema'
import {asyncMap} from 'convex-helpers'
import {isPresent} from '../src/lib/optionals'
import {displayFileSize} from '../src/lib/storage'

export const getForScene = query({
  args: {
    sceneId: v.id('scenes'),
  },
  handler: (ctx, { sceneId }) => withPermission(ctx,
    editScene(sceneId),
    async () => {
      return await getManyFrom(ctx.db, 'shots', 'by_scene', sceneId)
    },
  ),
})

export const get = query({
  args: {
    id: v.id('shots'),
  },
  handler: (ctx, args) => withPermission(ctx,
    editShot(args.id),
    async () => {
      const shot = await ctx.db.get('shots', args.id)
      if (!shot) return null
      const attachments = shot.attachments ? await asyncMap(
        shot.attachments,
        attachment => ctx.db.get('attachments', attachment),
      ) : []
      const attachmentsWithUrls = (await asyncMap(
        attachments,
        async attachment => {
          if (!attachment) return null
          const meta = await ctx.db.system.get('_storage', attachment.storageId)
          if (!meta) return null
          const url = await ctx.storage.getUrl(meta._id)
          if (!url) throw Error(`Couldn't get URL for attachment ${attachment._id}`)
          return attachment ? {
            _id: attachment._id,
            filename: attachment.filename,
            contentType: meta.contentType,
            fileSizeDisplay: displayFileSize(meta.size),
            url,
          } : null
        },
      )).filter(isPresent)
      return {
        ...shot,
        attachments: attachmentsWithUrls,
      }
    }),
})

export const create = mutation({
  args: {
    sceneId: v.id('scenes'),
    atIndex: v.optional(v.number()),
    shot: v.optional(v.object({
      location: v.optional(v.string()),
    })),
  },
  handler: (ctx, { sceneId, atIndex, shot }) => withPermission(ctx,
    editScene(sceneId),
    async () => {
      const shotId = await ctx.db.insert('shots', {
        scene: sceneId,
        description: '',
        status: 'default',
        location: shot?.location ?? '',
        notes: '',
        lockedNumber: null,
        attachments: [],
      })
      const shotOrder = (await ctx.db.get('scenes', sceneId))?.shotOrder ?? []
      shotOrder.splice(atIndex ?? shotOrder.length, 0, shotId)
      await ctx.db.patch(sceneId, { shotOrder })
      return shotId
    },
  ),
})

export const update = mutation({
  args: {
    shotId: v.id('shots'),
    data: v.object({
      status: v.optional(vShotStatus),
      lockedNumber: v.optional(v.union(v.number(), v.null())),
      description: v.optional(v.string()),
      location: v.optional(v.union(v.string(), v.null())),
      notes: v.optional(v.string()),
    }),
  },
  handler: (ctx, { shotId, data }) => withPermission(ctx,
    editShot(shotId),
    async () => {
      await ctx.db.patch(shotId, data)
    },
  ),
})

export const generateAttachmentUploadUrl = mutation({
  args: {},
  handler: (ctx) => withPermission(ctx,
    isLoggedIn,
    async () => await ctx.storage.generateUploadUrl(),
  ),
})

export const addAttachment = mutation({
    args: {
      filename: v.string(),
      storageId: v.id("_storage"),
      shotId: v.id('shots'),
    },
    handler: (ctx, { filename, storageId, shotId }) => withPermission(ctx,
      all(isLoggedIn, editShot(shotId)),
      async ({ userId, shot }) => {
        const existingAttachment = await getOneFrom(ctx.db, 'attachments', 'by_storageId', storageId)
        if (existingAttachment) {
          throw Error(`Attachment for storage Id ${storageId} already exists`)
        }
        const attachmentId = await ctx.db.insert('attachments', {
          filename,
          storageId,
          owner: userId,
        })
        await ctx.db.patch('shots', shotId, {
          attachments: (shot.attachments ?? []).concat(attachmentId)
        })
      },
    ),
  },
)

export const deleteShot = mutation({
  args: {
    shotId: v.id('shots'),
  },
  handler: (ctx, { shotId }) => withPermission(ctx,
    editShot(shotId),
    async () => {
      const shot = await ctx.db.get('shots', shotId)
      if (!shot) return
      const shotOrder = (await ctx.db.get('scenes', shot.scene))?.shotOrder
      if (shotOrder?.includes(shotId)) {
        shotOrder.splice(shotOrder.indexOf(shotId), 1)
        await ctx.db.patch(shot.scene, { shotOrder })
      }
      await ctx.db.delete(shotId)
    },
  ),
})
