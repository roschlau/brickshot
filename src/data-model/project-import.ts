import { zShotStatus } from '../../convex/schema'
import { z } from 'zod'

const ImportableShot = z.object({
  _id: z.optional(z.string()),
  status: zShotStatus,
  lockedNumber: z.nullish(z.number()),
  description: z.string(),
  location: z.string().nullish(),
  notes: z.string(),
  animated: z.optional(z.boolean()),
})

const ImportableScene = z.object({
  _id: z.optional(z.string()),
  lockedNumber: z.nullish(z.number()),
  description: z.string(),
  shots: z.array(ImportableShot),
})

export const ImportableProject = z.object({
  _id: z.optional(z.string()),
  name: z.optional(z.string()),
  scenes: z.array(ImportableScene),
})

export type ImportableProject = z.infer<typeof ImportableProject>
