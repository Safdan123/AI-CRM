import { Router } from 'express'
import { z } from 'zod'
import { makeRequireAuth, ok, requireRole } from '@aicrm/shared'
import { env } from '../config/env.js'
import { SyntheticScoringEntityModel } from '../models/SyntheticScoringEntity.js'
import { ensureSyntheticScoringSeeded } from '../services/syntheticSeedRunner.js'
import { computeChurnRisk, computeLeadScore, summarizeTiers } from '../services/syntheticScores.js'

const requireAuth = makeRequireAuth(env.jwtSecret)

export function syntheticInsightsRouter() {
  const router = Router()
  router.use(requireAuth, requireRole(['admin', 'support']))

  router.get('/lead-scores', async (req, res) => {
    const tierQ = req.query.tier?.toString().toLowerCase()
    const tierParsed = z.enum(['high', 'medium', 'low']).safeParse(tierQ)
    const tier = tierParsed.success ? tierParsed.data : undefined
    const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 80)))

    await ensureSyntheticScoringSeeded()
    const docs = await SyntheticScoringEntityModel.find({ kind: 'lead' }).lean()
    if (docs.length === 0) {
      return res.json(ok({ items: [], summary: { total: 0, high: 0, medium: 0, low: 0 } }))
    }

    const items = docs.map((d) => {
      const lf = d.leadFeatures!
      const { score, tier: t, reasons } = computeLeadScore(lf)
      return {
        id: d.externalKey,
        displayName: d.displayName,
        brokerName: d.brokerName ?? '',
        region: d.region,
        stage: d.stage ?? 'pending',
        score,
        tier: t,
        reasons,
        features: lf,
      }
    })
    const summary = summarizeTiers(items)
    const filtered = tier ? items.filter((i) => i.tier === tier) : items
    filtered.sort((a, b) => b.score - a.score)
    return res.json(ok({ items: filtered.slice(0, limit), summary }))
  })

  router.get('/churn-scores', async (req, res) => {
    const tierQ = req.query.tier?.toString().toLowerCase()
    const tierParsed = z.enum(['high', 'medium', 'low']).safeParse(tierQ)
    const tier = tierParsed.success ? tierParsed.data : undefined
    const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 80)))

    await ensureSyntheticScoringSeeded()
    const docs = await SyntheticScoringEntityModel.find({ kind: 'customer' }).lean()
    if (docs.length === 0) {
      return res.json(ok({ items: [], summary: { total: 0, high: 0, medium: 0, low: 0 } }))
    }

    const items = docs.map((d) => {
      const cf = d.customerFeatures!
      const { risk, tier: t, reasons } = computeChurnRisk(cf)
      return {
        id: d.externalKey,
        displayName: d.displayName,
        region: d.region,
        risk,
        tier: t,
        reasons,
        features: cf,
      }
    })
    const summary = summarizeTiers(items)
    const filtered = tier ? items.filter((i) => i.tier === tier) : items
    filtered.sort((a, b) => b.risk - a.risk)
    return res.json(ok({ items: filtered.slice(0, limit), summary }))
  })

  return router
}
