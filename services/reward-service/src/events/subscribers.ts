import {
  EVENTS,
  STREAMS,
  makeLogger,
  referralConvertedSchema,
  type EventBus,
  type RewardCreditedEvent,
} from '@aicrm/shared'
import { env } from '../config/env.js'
import { RewardLedgerModel } from '../models/RewardLedger.js'
import { convert } from '../services/fx.js'

const log = makeLogger('reward-service')

export async function startSubscribers(bus: EventBus) {
  await bus.subscribe({
    stream: STREAMS.REFERRALS.name,
    durable: 'reward-on-converted',
    subject: EVENTS.REFERRAL_CONVERTED,
    handler: async (raw) => {
      const evt = referralConvertedSchema.parse(raw)
      const existing = await RewardLedgerModel.findOne({ referralId: evt.referralId, entryType: 'credit' })
      if (existing) return

      const { converted, rate } = await convert(evt.rewardAmount, evt.rewardCurrency, env.baseCurrency)
      const entry = await RewardLedgerModel.create({
        userId: evt.brokerId,
        referralId: evt.referralId,
        amount: evt.rewardAmount,
        currency: evt.rewardCurrency.toUpperCase(),
        amountInBase: converted,
        baseCurrency: env.baseCurrency,
        fxRate: rate,
        entryType: 'credit',
        description: `Conversion reward for ${evt.customerName}`,
      })

      const out: RewardCreditedEvent = {
        userId: entry.userId,
        amount: entry.amount,
        currency: entry.currency,
        description: entry.description,
        referralId: entry.referralId,
        occurredAt: new Date().toISOString(),
      }
      await bus.publish(EVENTS.REWARD_CREDITED, out)
      log.info({ userId: entry.userId, amount: entry.amount, currency: entry.currency }, 'reward credited')
    },
  })
}
