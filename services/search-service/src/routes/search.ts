import { Router } from 'express'
import { makeRequireAuth, ok } from '@aicrm/shared'
import { env } from '../config/env.js'
import { INDICES, meili } from '../config/meili.js'

const requireAuth = makeRequireAuth(env.jwtSecret)

export function searchRouter() {
  const router = Router()

  router.get('/', requireAuth, async (req, res) => {
    const q = String(req.query.q ?? '').trim()
    if (!q) return res.json(ok({ referrals: [], campaigns: [], blogs: [] }))

    const filters = req.auth!.role === 'broker' ? `brokerId = "${req.auth!.userId}"` : undefined

    const [referrals, campaigns, blogs] = await Promise.all([
      meili
        .index(INDICES.REFERRALS)
        .search(q, { limit: 10, filter: filters })
        .catch(() => ({ hits: [] as unknown[] })),
      meili.index(INDICES.CAMPAIGNS).search(q, { limit: 10 }).catch(() => ({ hits: [] as unknown[] })),
      meili.index(INDICES.BLOGS).search(q, { limit: 10 }).catch(() => ({ hits: [] as unknown[] })),
    ])

    return res.json(ok({ referrals: referrals.hits, campaigns: campaigns.hits, blogs: blogs.hits }))
  })

  router.get('/:type', requireAuth, async (req, res) => {
    const type = req.params.type as keyof typeof INDICES
    const indexName = INDICES[type.toUpperCase() as keyof typeof INDICES]
    if (!indexName) return res.status(404).json({ message: 'Unknown index.' })
    const q = String(req.query.q ?? '').trim()
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)))
    const result = await meili.index(indexName).search(q, { limit })
    return res.json(ok(result))
  })

  return router
}
