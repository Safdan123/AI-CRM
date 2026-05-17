import {
  EVENTS,
  STREAMS,
  blogPublishedSchema,
  makeLogger,
  referralAcceptedSchema,
  referralConvertedSchema,
  referralCreatedSchema,
  rewardCreditedSchema,
  userRegisteredSchema,
  type EventBus,
} from '@aicrm/shared'
import { NotificationModel } from '../models/Notification.js'
import { sendEmail } from '../services/mailer.js'
import { pushToUser } from '../services/realtime.js'

const log = makeLogger('notification-service')

async function dispatch(userId: string, title: string, body: string, category?: string) {
  const note = await NotificationModel.create({ userId, title, body, category })
  pushToUser(userId, 'notification:new', note.toObject())
  return note
}

export async function startSubscribers(bus: EventBus) {
  await bus.subscribe({
    stream: STREAMS.USERS.name,
    durable: 'notif-on-user-registered',
    subject: EVENTS.USER_REGISTERED,
    handler: async (raw) => {
      const evt = userRegisteredSchema.parse(raw)
      await dispatch(
        evt.userId,
        'Welcome to Mabrook Rewards',
        `Hi ${evt.fullName}, your account is ready. Explore campaigns and start earning.`,
        'welcome',
      )
      await sendEmail(
        evt.email,
        'Welcome to Mabrook Rewards',
        `<h2>Welcome, ${evt.fullName}!</h2><p>Your Mabrook Rewards account is ready.</p>`,
      )
      log.info({ userId: evt.userId }, 'welcome notification sent')
    },
  })

  await bus.subscribe({
    stream: STREAMS.REFERRALS.name,
    durable: 'notif-on-referral-created',
    subject: EVENTS.REFERRAL_CREATED,
    handler: async (raw) => {
      const evt = referralCreatedSchema.parse(raw)
      await dispatch(
        evt.brokerId,
        'Referral submitted',
        `Your referral for ${evt.customerName} is pending admin review.`,
        'referral',
      )
    },
  })

  await bus.subscribe({
    stream: STREAMS.REFERRALS.name,
    durable: 'notif-on-referral-accepted',
    subject: EVENTS.REFERRAL_ACCEPTED,
    handler: async (raw) => {
      const evt = referralAcceptedSchema.parse(raw)
      await dispatch(
        evt.brokerId,
        'Invite link used',
        'A customer joined your campaign via your personal invite link.',
        'referral',
      )
    },
  })

  await bus.subscribe({
    stream: STREAMS.REFERRALS.name,
    durable: 'notif-on-referral-converted',
    subject: EVENTS.REFERRAL_CONVERTED,
    handler: async (raw) => {
      const evt = referralConvertedSchema.parse(raw)
      await dispatch(
        evt.brokerId,
        'Referral converted',
        `${evt.customerName} converted. ${evt.rewardAmount} ${evt.rewardCurrency} credited to your wallet.`,
        'reward',
      )
    },
  })

  await bus.subscribe({
    stream: STREAMS.REWARDS.name,
    durable: 'notif-on-reward-credited',
    subject: EVENTS.REWARD_CREDITED,
    handler: async (raw) => {
      const evt = rewardCreditedSchema.parse(raw)
      await dispatch(
        evt.userId,
        'Reward credited',
        `${evt.amount} ${evt.currency} added: ${evt.description}`,
        'reward',
      )
    },
  })

  await bus.subscribe({
    stream: STREAMS.CONTENT.name,
    durable: 'notif-on-blog-published',
    subject: EVENTS.CONTENT_BLOG_PUBLISHED,
    handler: async (raw) => {
      const evt = blogPublishedSchema.parse(raw)
      log.info({ blogId: evt.blogId, title: evt.title }, 'new blog published')
    },
  })
}
