import { Router } from 'express'
import { z } from 'zod'
import {
  EVENTS,
  makeRequireAuth,
  ok,
  requireRole,
  type EventBus,
  type RewardCreditedEvent,
} from '@aicrm/shared'
import { env } from '../config/env.js'
import { RewardLedgerModel } from '../models/RewardLedger.js'
import { convert, getRates } from '../services/fx.js'

const requireAuth = makeRequireAuth(env.jwtSecret)

const adjustmentSchema = z.object({
  userId: z.string(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  entryType: z.enum(['credit', 'debit']),
  description: z.string().min(2),
})

export function rewardsRouter(bus: EventBus | null) {
  const router = Router()

  router.get('/me', requireAuth, async (req, res) => {
    const target = req.auth!.userId
    const [entries, totals] = await Promise.all([
      RewardLedgerModel.find({ userId: target }).sort({ createdAt: -1 }).limit(200),
      RewardLedgerModel.aggregate<{ _id: string; amountInBase: number }>([
        { $match: { userId: target } },
        { $group: { _id: '$entryType', amountInBase: { $sum: '$amountInBase' } } },
      ]),
    ])
    const credit = totals.find((t) => t._id === 'credit')?.amountInBase ?? 0
    const debit = totals.find((t) => t._id === 'debit')?.amountInBase ?? 0
    return res.json(
      ok({
        balanceInBase: credit - debit,
        baseCurrency: env.baseCurrency,
        creditTotal: credit,
        debitTotal: debit,
        entries,
      }),
    )
  })

  router.get('/cashflow', requireAuth, requireRole(['admin', 'support']), async (_req, res) => {
    const totals = await RewardLedgerModel.aggregate<{ _id: string; amountInBase: number; count: number }>([
      { $group: { _id: '$entryType', amountInBase: { $sum: '$amountInBase' }, count: { $sum: 1 } } },
    ])
    const credit = totals.find((t) => t._id === 'credit')
    const debit = totals.find((t) => t._id === 'debit')
    return res.json(
      ok({
        credit: credit?.amountInBase ?? 0,
        debit: debit?.amountInBase ?? 0,
        baseCurrency: env.baseCurrency,
        creditCount: credit?.count ?? 0,
        debitCount: debit?.count ?? 0,
      }),
    )
  })

  router.post('/adjustments', requireAuth, requireRole(['admin']), async (req, res) => {
    const body = adjustmentSchema.parse(req.body)
    const { converted, rate } = await convert(body.amount, body.currency, env.baseCurrency)
    const entry = await RewardLedgerModel.create({
      userId: body.userId,
      amount: body.amount,
      currency: body.currency.toUpperCase(),
      amountInBase: converted,
      baseCurrency: env.baseCurrency,
      fxRate: rate,
      entryType: body.entryType,
      description: body.description,
    })
    if (bus && body.entryType === 'credit') {
      const evt: RewardCreditedEvent = {
        userId: entry.userId,
        amount: entry.amount,
        currency: entry.currency,
        description: entry.description,
        occurredAt: new Date().toISOString(),
      }
      await bus.publish(EVENTS.REWARD_CREDITED, evt)
    }
    return res.status(201).json(ok(entry))
  })

  router.get('/fx', async (req, res) => {
    const base = String(req.query.base ?? env.baseCurrency).toUpperCase()
    const rates = await getRates(base)
    return res.json(ok({ base, rates }))
  })

  router.get('/_internal/by-user', async (req, res) => {
    if (req.header('x-internal-key') !== env.jwtSecret) {
      return res.status(403).json({ message: 'Forbidden.' })
    }
    const userId = String(req.query.userId ?? '')
    if (!userId) return res.status(400).json({ message: 'userId required.' })
    const entries = await RewardLedgerModel.find({ userId }).sort({ createdAt: -1 }).limit(500)
    return res.json(ok(entries))
  })

  return router
}
