import { mutation, query } from './_generated/server'
import { getAuthUserId } from '@convex-dev/auth/server'
import { v } from 'convex/values'
import { editProject, isLoggedIn, withPermission } from './auth'
import { getManyFrom } from 'convex-helpers/server/relationships'
import { api } from './_generated/api'
import { ImportableProject } from '../src/data-model/project-import'
import { Id } from './_generated/dataModel'
import { byOrder } from '../src/lib/sorting'
import { zodToConvex } from 'convex-helpers/server/zod'

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []
    return await getManyFrom(ctx.db, 'projects', 'by_owner', userId)
  },
})

export const getDetails = query({
  args: { projectId: v.id('projects') },
  handler: (ctx, { projectId }) => withPermission(ctx,
    editProject(projectId),
    async ({ project }) => {
      const scenes = await getManyFrom(ctx.db, 'scenes', 'by_project', projectId)
      return {
        ...project,
        scenesCount: scenes.length,
      }
    },
  ),
})

export const create = mutation({
  args: {},
  handler: (ctx) => withPermission(ctx,
    isLoggedIn,
    async ({ userId }) => {
      const projectId = await ctx.db.insert('projects', {
        owner: userId,
        name: 'New Project',
      })
      await ctx.runMutation(api.scenes.create, { projectId })
      return projectId
    },
  ),
})

export const markOpened = mutation({
  args: {
    projectId: v.id('projects'),
  },
  handler: (ctx, { projectId }) => withPermission(ctx,
    editProject(projectId),
    async () => {
      await ctx.db.patch('projects', projectId, {
        lastOpenedTime: new Date().getTime(),
      })
    },
  ),
})

export const update = mutation({
  args: {
    projectId: v.id('projects'),
    data: v.object({ name: v.string() }),
  },
  handler: (ctx, { projectId, data }) => withPermission(ctx,
    editProject(projectId),
    async () => {
      await ctx.db.patch('projects', projectId, data)
    },
  ),
})

export const deleteProject = mutation({
  args: { projectId: v.id('projects') },
  handler: (ctx, { projectId }) => withPermission(ctx,
    editProject(projectId),
    async () => {
      const scenes = await getManyFrom(ctx.db, 'scenes', 'by_project', projectId)
      for (const scene of scenes) {
        await ctx.runMutation(api.scenes.deleteScene, { sceneId: scene._id })
      }
      await ctx.db.delete('projects', projectId)
    },
  ),
})

export const exportProject = mutation({
  args: {
    projectId: v.id('projects'),
  },
  returns: zodToConvex(ImportableProject),
  handler: (ctx, { projectId }) => withPermission(ctx,
    editProject(projectId),
    async ({ project }) => {
      const scenes = await getManyFrom(ctx.db, 'scenes', 'by_project', projectId)
      return {
        _id: project._id,
        name: project.name,
        scenes: await Promise.all(scenes.map(async scene => {
          const shots = (await getManyFrom(ctx.db, 'shots', 'by_scene', scene._id)).map(shot => ({
            _id: shot._id,
            status: shot.status,
            lockedNumber: shot.lockedNumber,
            description: shot.description,
            location: shot.location,
            notes: shot.notes,
          }))
          shots.sort(byOrder(scene.shotOrder, shot => shot._id))
          return ({
            _id: scene._id,
            lockedNumber: scene.lockedNumber,
            description: scene.description,
            shots: shots,
          })
        })),
      }
    }
  ),
})

export const importProject = mutation({
  args: {
    project: zodToConvex(ImportableProject),
  },
  returns: v.id('projects'),
  handler: (ctx, { project }) => withPermission(ctx,
    isLoggedIn,
    async ({ userId }) => {
      const projectId = await ctx.db.insert('projects', {
        owner: userId,
        name: project.name ?? 'Imported Project',
      })
      for (const scene of project.scenes) {
        const sceneId = await ctx.db.insert('scenes', {
          project: projectId,
          lockedNumber: scene.lockedNumber ?? null,
          description: scene.description,
          shotOrder: [],
        })
        const shotOrder: Id<'shots'>[] = []
        for (const shot of scene.shots) {
          shotOrder.push(await ctx.db.insert('shots', {
            scene: sceneId,
            status: shot.status,
            lockedNumber: shot.lockedNumber ?? null,
            description: shot.description,
            location: shot.location ?? '',
            notes: shot.notes,
          }))
        }
        await ctx.db.patch(sceneId, { shotOrder })
      }
      return projectId as Id<'projects'>
    }),
})
