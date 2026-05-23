import { Router } from 'express'
import { z } from 'zod'
import { makeRequireAuth, ok } from '@aicrm/shared'
import { env } from '../config/env.js'
import { EmbeddingModel } from '../models/Embedding.js'
import { getProvider } from '../providers/index.js'
import { cosine } from '../services/similarity.js'
import { syntheticInsightsRouter } from './insights.js'

const requireAuth = makeRequireAuth(env.jwtSecret)
const provider = getProvider()

async function fetchAcceptedCampaignIds(userId: string, authHeader?: string) {
  try {
    const r = await fetch(`${env.referralServiceUrl}/api/users/${userId}/accepted-campaigns`, {
      headers: authHeader ? { authorization: authHeader } : {},
    })
    if (!r.ok) return [] as string[]
    const json = (await r.json()) as { data?: Array<{ id: string }> }
    return (json.data ?? []).map((c) => c.id)
  } catch {
    return [] as string[]
  }
}

async function fetchActiveCampaigns() {
  try {
    const r = await fetch(`${env.campaignServiceUrl}/api/campaigns/_internal/by-ids`, {
      headers: { 'x-internal-key': env.jwtSecret },
    })
    if (!r.ok)
      return [] as Array<{
        id: string
        name: string
        description?: string
        rewardCurrency: string
        totalRewardAmount: number
      }>
    const json = (await r.json()) as {
      data?: Array<{
        id: string
        name: string
        description?: string
        rewardCurrency: string
        totalRewardAmount: number
      }>
    }
    return json.data ?? []
  } catch {
    return []
  }
}

export function aiRouter() {
  const root = Router()

  root.get('/recommendations/:userId', requireAuth, async (req, res) => {
    if (req.auth!.role === 'user' && req.auth!.userId !== req.params.userId) {
      return res.status(403).json({ message: 'Forbidden.' })
    }
    const accepted = await fetchAcceptedCampaignIds(req.params.userId, req.header('authorization'))
    const all = await fetchActiveCampaigns()
    const candidates = all.filter((c) => !accepted.includes(c.id))

    const acceptedEmbeds = await EmbeddingModel.find({
      type: 'campaign',
      refId: { $in: accepted },
    })
    if (acceptedEmbeds.length === 0 || candidates.length === 0) {
      return res.json(ok(candidates.slice(0, 5)))
    }

    const candEmbeds = await EmbeddingModel.find({
      type: 'campaign',
      refId: { $in: candidates.map((c) => c.id) },
    })
    const scored = candidates.map((c) => {
      const ce = candEmbeds.find((e) => e.refId === c.id)
      if (!ce || ce.vector.length === 0) return { ...c, score: 0 }
      const score = Math.max(...acceptedEmbeds.map((a) => (a.vector.length ? cosine(a.vector, ce.vector) : 0)))
      return { ...c, score }
    })
    scored.sort((a, b) => b.score - a.score)
    return res.json(ok(scored.slice(0, 5)))
  })

  const ai = Router()
  ai.post('/chat', requireAuth, async (req, res) => {
    const body = z
      .object({ prompt: z.string().min(1), system: z.string().optional() })
      .parse(req.body)
    try {
      const text = await provider.chat(
        body.prompt,
        body.system ??
          'You are an assistant for the Mabrook Rewards CRM. Be concise, helpful, and only answer using the context provided.',
      )
      return res.json(ok({ provider: provider.name, text }))
    } catch (err) {
      return res.status(503).json({
        message: `AI provider unavailable: ${(err as Error).message}`,
        provider: provider.name,
      })
    }
  })

  ai.get('/status', async (_req, res) => {
    return res.json(ok({ provider: provider.name }))
  })

  ai.use('/admin', syntheticInsightsRouter())

  root.use('/ai', ai)
  return root
}
