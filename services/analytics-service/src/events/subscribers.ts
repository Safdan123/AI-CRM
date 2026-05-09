import {
  EVENTS,
  STREAMS,
  makeLogger,
  referralConvertedSchema,
  referralCreatedSchema,
  rewardCreditedSchema,
  userRegisteredSchema,
  type EventBus,
} from '@aicrm/shared'
import { CounterModel, DailyCounterModel } from '../models/Counter.js'

const log = makeLogger('analytics-service')

async function bump(key: string, by = 1) {
  await CounterModel.updateOne({ key }, { $inc: { value: by } }, { upsert: true })
  const date = new Date().toISOString().slice(0, 10)
  await DailyCounterModel.updateOne({ key, date }, { $inc: { value: by } }, { upsert: true })
}

export async function startSubscribers(bus: EventBus) {
  await bus.subscribe({
    stream: STREAMS.USERS.name,
    durable: 'analytics-users-registered',
    subject: EVENTS.USER_REGISTERED,
    handler: async (raw) => {
      const evt = userRegisteredSchema.parse(raw)
      await bump(`users.${evt.role}`)
      await bump('users.total')
    },
  })

  await bus.subscribe({
    stream: STREAMS.REFERRALS.name,
    durable: 'analytics-referrals-created',
    subject: EVENTS.REFERRAL_CREATED,
    handler: async (raw) => {
      referralCreatedSchema.parse(raw)
      await bump('referrals.total')
      await bump('referrals.pending')
    },
  })

  await bus.subscribe({
    stream: STREAMS.REFERRALS.name,
    durable: 'analytics-referrals-converted',
    subject: EVENTS.REFERRAL_CONVERTED,
    handler: async (raw) => {
      referralConvertedSchema.parse(raw)
      await bump('referrals.converted')
      await bump('referrals.pending', -1)
    },
  })

  await bus.subscribe({
    stream: STREAMS.REWARDS.name,
    durable: 'analytics-rewards-credited',
    subject: EVENTS.REWARD_CREDITED,
    handler: async (raw) => {
      const evt = rewardCreditedSchema.parse(raw)
      await bump('rewards.credit.count')
      await bump('rewards.credit.amount.base', Math.round(evt.amount))
    },
  })

  log.info('analytics subscribers started')
}
