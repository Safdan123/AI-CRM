import {
  EVENTS,
  STREAMS,
  blogPublishedSchema,
  campaignCreatedSchema,
  makeLogger,
  referralCreatedSchema,
  referralReviewedSchema,
  type EventBus,
} from '@aicrm/shared'
import { INDICES, meili } from '../config/meili.js'

const log = makeLogger('search-service')

export async function startSubscribers(bus: EventBus) {
  await bus.subscribe({
    stream: STREAMS.REFERRALS.name,
    durable: 'search-on-referral-created',
    subject: EVENTS.REFERRAL_CREATED,
    handler: async (raw) => {
      const evt = referralCreatedSchema.parse(raw)
      await meili.index(INDICES.REFERRALS).addDocuments([
        {
          id: evt.referralId,
          brokerId: evt.brokerId,
          campaignId: evt.campaignId,
          customerName: evt.customerName,
          phone: evt.phone,
          status: 'pending',
          createdAt: evt.occurredAt,
        },
      ])
    },
  })

  await bus.subscribe({
    stream: STREAMS.REFERRALS.name,
    durable: 'search-on-referral-reviewed',
    subject: EVENTS.REFERRAL_REVIEWED,
    handler: async (raw) => {
      const evt = referralReviewedSchema.parse(raw)
      await meili.index(INDICES.REFERRALS).updateDocuments([{ id: evt.referralId, status: evt.status }])
    },
  })

  await bus.subscribe({
    stream: STREAMS.CAMPAIGNS.name,
    durable: 'search-on-campaign-created',
    subject: EVENTS.CAMPAIGN_CREATED,
    handler: async (raw) => {
      const evt = campaignCreatedSchema.parse(raw)
      await meili.index(INDICES.CAMPAIGNS).addDocuments([
        {
          id: evt.campaignId,
          name: evt.name,
          totalRewardAmount: evt.totalRewardAmount,
          rewardCurrency: evt.rewardCurrency,
        },
      ])
    },
  })

  await bus.subscribe({
    stream: STREAMS.CONTENT.name,
    durable: 'search-on-blog-published',
    subject: EVENTS.CONTENT_BLOG_PUBLISHED,
    handler: async (raw) => {
      const evt = blogPublishedSchema.parse(raw)
      await meili.index(INDICES.BLOGS).addDocuments([
        { id: evt.blogId, title: evt.title, body: evt.body, tags: evt.tags, authorId: evt.authorId },
      ])
    },
  })

  log.info('search subscribers started')
}
