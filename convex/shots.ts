import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { all, editScene, editShot, isLoggedIn, withPermission } from './auth'
import { getManyFrom } from 'convex-helpers/server/relationships'

import { vShotStatus } from './schema'

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
      return await ctx.db.get('shots', args.id)
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
      storageId: v.id("_storage"),
      shotId: v.id('shots'),
    },
    handler: (ctx, { storageId, shotId }) => withPermission(ctx,
      all(isLoggedIn, editShot(shotId)),
      async ({ userId, shot }) => {
        const attachmentId = await ctx.db.insert('attachments', {
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
