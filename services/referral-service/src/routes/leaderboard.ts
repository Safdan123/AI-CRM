import { Router } from 'express'
import { z } from 'zod'
import {
  leaderboardMetricSchema,
  leaderboardPeriodSchema,
  makeRequireAuth,
  ok,
} from '@aicrm/shared'
import { env } from '../config/env.js'
import { ReferralModel } from '../models/Referral.js'

const requireAuth = makeRequireAuth(env.jwtSecret)

const querySchema = z.object({
  period: leaderboardPeriodSchema.default('all'),
  metric: leaderboardMetricSchema.default('conversions'),
  campaignId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

function periodStart(period: z.infer<typeof leaderboardPeriodSchema>) {
  const now = new Date()
  if (period === 'all') return null
  const d = new Date(now)
  if (period === 'day') d.setDate(d.getDate() - 1)
  else if (period === 'week') d.setDate(d.getDate() - 7)
  else d.setMonth(d.getMonth() - 1)
  return d
}

async function fetchBrokerNames(ids: string[]) {
  if (ids.length === 0) return new Map<string, string>()
  try {
    const res = await fetch(`${env.authServiceUrl}/api/auth/_internal/users?ids=${ids.join(',')}`, {
      headers: { 'x-internal-key': env.jwtSecret },
    })
    if (!res.ok) return new Map()
    const json = (await res.json()) as { data: Array<{ id: string; fullName: string }> }
    return new Map(json.data.map((u) => [u.id, u.fullName]))
  } catch {
    return new Map()
  }
}

export function leaderboardRouter() {
  const router = Router()

  router.get('/', requireAuth, async (req, res) => {
    const q = querySchema.parse(req.query)
    const since = periodStart(q.period)
    const match: Record<string, unknown> = {}
    if (q.campaignId) match.campaignId = q.campaignId
    if (since) match.createdAt = { $gte: since }

    if (q.metric === 'referrals') {
      const rows = await ReferralModel.aggregate<{ _id: string; score: number }>([
        { $match: match },
        { $group: { _id: '$brokerId', score: { $sum: 1 } } },
        { $sort: { score: -1 } },
        { $limit: q.limit },
      ])
      const names = await fetchBrokerNames(rows.map((r) => r._id))
      return res.json(
        ok({
          period: q.period,
          metric: q.metric,
          campaignId: q.campaignId ?? null,
          rows: rows.map((r, i) => ({
            rank: i + 1,
            brokerId: r._id,
            name: names.get(r._id) ?? `Broker ${r._id.slice(-6)}`,
            score: r.score,
          })),
        }),
      )
    }

    if (q.metric === 'conversions') {
      const convMatch = { ...match, status: 'converted' }
      const rows = await ReferralModel.aggregate<{ _id: string; score: number }>([
        { $match: convMatch },
        { $group: { _id: '$brokerId', score: { $sum: 1 } } },
        { $sort: { score: -1 } },
        { $limit: q.limit },
      ])
      const names = await fetchBrokerNames(rows.map((r) => r._id))
      return res.json(
        ok({
          period: q.period,
          metric: q.metric,
          campaignId: q.campaignId ?? null,
          rows: rows.map((r, i) => ({
            rank: i + 1,
            brokerId: r._id,
            name: names.get(r._id) ?? `Broker ${r._id.slice(-6)}`,
            score: r.score,
          })),
        }),
      )
    }

    const rows = await ReferralModel.aggregate<{ _id: string; score: number }>([
      { $match: { ...match, status: 'converted' } },
      {
        $group: {
          _id: '$brokerId',
          score: { $sum: { $ifNull: ['$rewardAmount', 0] } },
        },
      },
      { $sort: { score: -1 } },
      { $limit: q.limit },
    ])
    const names = await fetchBrokerNames(rows.map((r) => r._id))
    return res.json(
      ok({
        period: q.period,
        metric: q.metric,
        campaignId: q.campaignId ?? null,
        rows: rows.map((r, i) => ({
          rank: i + 1,
          brokerId: r._id,
          name: names.get(r._id) ?? `Broker ${r._id.slice(-6)}`,
          score: r.score,
        })),
      }),
    )
  })

  router.get('/me', requireAuth, async (req, res) => {
    const q = querySchema.parse(req.query)
    const brokerId = req.auth!.userId
    const since = periodStart(q.period)
    const base: Record<string, unknown> = { brokerId }
    if (q.campaignId) base.campaignId = q.campaignId
    if (since) base.createdAt = { $gte: since }

    const [totalReferrals, conversions, rewardsAgg, globalRank] = await Promise.all([
      ReferralModel.countDocuments(base),
      ReferralModel.countDocuments({ ...base, status: 'converted' }),
      ReferralModel.aggregate<{ total: number }>([
        { $match: { ...base, status: 'converted' } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$rewardAmount', 0] } } } },
      ]),
      ReferralModel.aggregate<{ _id: string; score: number }>([
        { $match: { ...(q.campaignId ? { campaignId: q.campaignId } : {}), ...(since ? { createdAt: { $gte: since } } : {}), status: 'converted' } },
        { $group: { _id: '$brokerId', score: { $sum: 1 } } },
        { $sort: { score: -1 } },
      ]),
    ])

    const position =
      globalRank.findIndex((r) => r._id === brokerId) >= 0
        ? globalRank.findIndex((r) => r._id === brokerId) + 1
        : globalRank.length + 1

    return res.json(
      ok({
        period: q.period,
        campaignId: q.campaignId ?? null,
        totalReferrals,
        conversions,
        rewardsEarned: rewardsAgg[0]?.total ?? 0,
        position,
        totalBrokers: globalRank.length,
      }),
    )
  })

  return router
}
