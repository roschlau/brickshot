import {DatabaseReader} from './_generated/server'
import {getManyFrom, getOneFrom} from 'convex-helpers/server/relationships'
import {Id} from './_generated/dataModel'
import {asyncMap} from 'convex-helpers'
import {checkPresent} from '../src/lib/optionals'

const defaultLimits = Object.freeze({
  maxShotAttachmentBytes: 1024 * 1024, // 1MB
  maxTotalStorageBytes: 20 * 1024 * 1024, // 20MB
})

type LimitInfo = typeof defaultLimits & { remainingTotalStorageBytes: number }

export async function getUserLimits(db: DatabaseReader, userId: Id<'users'>): Promise<LimitInfo> {
  const userLimits = await getOneFrom(db, 'userLimits', 'by_userId', userId) ?? defaultLimits
  const attachments = await getManyFrom(db, 'attachments', 'by_owner', userId)
  const storageEntries = await asyncMap(
    attachments,
    async attachment => checkPresent(
      await db.system.get(attachment.storageId),
      () => `Storage entry ${attachment.storageId} for attachment ${attachment._id} not found`
    ),
  )
  const totalUsedBytes = storageEntries.reduce((acc, it) => acc + (it?.size ?? 0), 0)
  return {
    ...userLimits,
    remainingTotalStorageBytes: userLimits.maxTotalStorageBytes - totalUsedBytes,
  }
}
