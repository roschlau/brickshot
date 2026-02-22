import {cronJobs} from 'convex/server'
import {internal} from './_generated/api'

const crons = cronJobs()

crons.daily(
  'delete orphaned files',
  { hourUTC: 16, minuteUTC: 0 },
  internal.attachments.deleteOrphanedFiles,
)

export default crons
