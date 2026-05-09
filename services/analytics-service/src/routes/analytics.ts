import { Router } from 'express'
import { makeRequireAuth, ok, requireRole } from '@aicrm/shared'
import { env } from '../config/env.js'
import { CounterModel, DailyCounterModel } from '../models/Counter.js'

const requireAuth = makeRequireAuth(env.jwtSecret)

async function counter(key: string) {
  const doc = await CounterModel.findOne({ key })
  return doc?.value ?? 0
}

export function analyticsRouter() {
  const router = Router()

  router.get('/admin/kpis', requireAuth, requireRole(['admin', 'support']), async (_req, res) => {
    const [totalCustomers, activeBrokers, totalReferrals, conversions, rewardsAmount] = await Promise.all([
      counter('users.user'),
      counter('users.broker'),
      counter('referrals.total'),
      counter('referrals.converted'),
      counter('rewards.credit.amount.base'),
    ])
    return res.json(
      ok({
        totalCustomers,
        activeBrokers,
        totalReferrals,
        conversions,
        rewardsDistributed: rewardsAmount,
      }),
    )
  })

  router.get('/summary', requireAuth, requireRole(['admin', 'support']), async (_req, res) => {
    const counters = await CounterModel.find().lean()
    const map: Record<string, number> = {}
    for (const c of counters) map[c.key] = c.value
    return res.json(
      ok({
        users: map['users.total'] ?? 0,
        blogs: map['content.blog.published.total'] ?? 0,
        notifications: map['notifications.dispatched.total'] ?? 0,
        referrals: map['referrals.total'] ?? 0,
      }),
    )
  })

  router.get('/timeseries/:key', requireAuth, requireRole(['admin', 'support']), async (req, res) => {
    const days = Math.min(180, Math.max(1, Number(req.query.days ?? 30)))
    const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString().slice(0, 10)
    const docs = await DailyCounterModel.find({ key: req.params.key, date: { $gte: since } }).sort({
      date: 1,
    })
    return res.json(ok(docs.map((d) => ({ date: d.date, value: d.value }))))
  })

  return router
}
