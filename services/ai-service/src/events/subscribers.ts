import {
  EVENTS,
  STREAMS,
  blogPublishedSchema,
  campaignCreatedSchema,
  makeLogger,
  type EventBus,
} from '@aicrm/shared'
import { EmbeddingModel } from '../models/Embedding.js'
import { getProvider } from '../providers/index.js'

const log = makeLogger('ai-service')
const provider = getProvider()

async function safeEmbed(text: string) {
  try {
    return await provider.embed(text)
  } catch (e) {
    log.warn({ err: (e as Error).message }, 'embed failed; storing empty vector')
    return [] as number[]
  }
}

export async function startSubscribers(bus: EventBus) {
  await bus.subscribe({
    stream: STREAMS.CAMPAIGNS.name,
    durable: 'ai-on-campaign-created',
    subject: EVENTS.CAMPAIGN_CREATED,
    handler: async (raw) => {
      const evt = campaignCreatedSchema.parse(raw)
      const text = `Campaign: ${evt.name}. Reward: ${evt.totalRewardAmount} ${evt.rewardCurrency}.`
      const vector = await safeEmbed(text)
      await EmbeddingModel.updateOne(
        { type: 'campaign', refId: evt.campaignId },
        {
          $set: {
            type: 'campaign',
            refId: evt.campaignId,
            text,
            vector,
            meta: {
              name: evt.name,
              totalRewardAmount: evt.totalRewardAmount,
              rewardCurrency: evt.rewardCurrency,
            },
          },
        },
        { upsert: true },
      )
    },
  })

  await bus.subscribe({
    stream: STREAMS.CONTENT.name,
    durable: 'ai-on-blog-published',
    subject: EVENTS.CONTENT_BLOG_PUBLISHED,
    handler: async (raw) => {
      const evt = blogPublishedSchema.parse(raw)
      const text = `${evt.title}. ${evt.body.slice(0, 1500)}`
      const vector = await safeEmbed(text)
      await EmbeddingModel.updateOne(
        { type: 'blog', refId: evt.blogId },
        {
          $set: {
            type: 'blog',
            refId: evt.blogId,
            text,
            vector,
            meta: { title: evt.title, tags: evt.tags },
          },
        },
        { upsert: true },
      )
    },
  })

  log.info('ai subscribers started')
}
