import { MeiliSearch } from 'meilisearch'
import { env } from './env.js'

export const meili = new MeiliSearch({ host: env.meiliHost, apiKey: env.meiliKey })

export const INDICES = {
  REFERRALS: 'referrals',
  CAMPAIGNS: 'campaigns',
  BLOGS: 'blogs',
} as const

export async function ensureIndices() {
  for (const name of Object.values(INDICES)) {
    try {
      await meili.createIndex(name, { primaryKey: 'id' })
    } catch {
      // ignore "already exists"
    }
  }
  await meili.index(INDICES.REFERRALS).updateFilterableAttributes(['status', 'brokerId', 'campaignId'])
  await meili.index(INDICES.REFERRALS).updateSearchableAttributes(['customerName', 'phone'])
  await meili.index(INDICES.CAMPAIGNS).updateSearchableAttributes(['name', 'description', 'tags'])
  await meili.index(INDICES.BLOGS).updateSearchableAttributes(['title', 'body', 'tags', 'excerpt'])
}
