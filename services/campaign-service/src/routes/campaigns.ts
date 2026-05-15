import { Router } from 'express'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import {
  EVENTS,
  makeRequireAuth,
  ok,
  requireRole,
  type CampaignCreatedEvent,
  type EventBus,
} from '@aicrm/shared'
import { env } from '../config/env.js'
import { CampaignModel } from '../models/Campaign.js'

const requireAuth = makeRequireAuth(env.jwtSecret)

const campaignSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  startDate: z.string().min(4),
  endDate: z.string().min(4),
  totalRewardAmount: z.number().nonnegative(),
  rewardCurrency: z.string().length(3).default('USD'),
  tags: z.array(z.string()).default([]),
})

function shape(c: NonNullable<Awaited<ReturnType<typeof CampaignModel.findOne>>>) {
  return {
    id: c.id,
    name: c.name,
    description: c.description ?? '',
    startDate: c.startDate,
    endDate: c.endDate,
    totalRewardAmount: c.totalRewardAmount,
    rewardCurrency: c.rewardCurrency,
    linkCode: c.linkCode,
    tags: c.tags,
    active: c.active,
  }
}

async function uniqueLinkCode(name: string) {
  const base = name.toUpperCase().replace(/\s+/g, '-').slice(0, 20)
  for (let i = 0; i < 5; i++) {
    const code = `${base}-${nanoid(6).toUpperCase()}`
    const exists = await CampaignModel.findOne({ linkCode: code })
    if (!exists) return code
  }
  throw new Error('Could not allocate unique link code.')
}

export function campaignsRouter(bus: EventBus | null) {
  const router = Router()

  router.get('/', requireAuth, async (req, res) => {
    const onlyActive = req.query.active === 'true'
    const filter = onlyActive ? { active: true } : {}
    const campaigns = await CampaignModel.find(filter).sort({ createdAt: -1 }).limit(200)
    return res.json(ok(campaigns.map(shape)))
  })

  router.get('/:campaignId', requireAuth, async (req, res) => {
    const c = await CampaignModel.findById(req.params.campaignId)
    if (!c) return res.status(404).json({ message: 'Campaign not found.' })
    return res.json(ok(shape(c)))
  })

  router.post('/', requireAuth, requireRole(['admin']), async (req, res) => {
    const input = campaignSchema.parse(req.body)
    const linkCode = await uniqueLinkCode(input.name)
    const campaign = await CampaignModel.create({
      ...input,
      linkCode,
      createdBy: req.auth!.userId,
    })

    if (bus) {
      const evt: CampaignCreatedEvent = {
        campaignId: campaign.id,
        name: campaign.name,
        totalRewardAmount: campaign.totalRewardAmount,
        rewardCurrency: campaign.rewardCurrency,
        occurredAt: new Date().toISOString(),
      }
      await bus.publish(EVENTS.CAMPAIGN_CREATED, evt)
    }

    return res.status(201).json(ok(shape(campaign)))
  })

  router.patch('/:campaignId', requireAuth, requireRole(['admin']), async (req, res) => {
    const input = campaignSchema.partial().parse(req.body)
    const updated = await CampaignModel.findByIdAndUpdate(
      req.params.campaignId,
      { $set: input },
      { new: true, runValidators: true },
    )
    if (!updated) return res.status(404).json({ message: 'Campaign not found.' })
    return res.json(ok(shape(updated)))
  })

  router.delete('/:campaignId', requireAuth, requireRole(['admin']), async (req, res) => {
    const updated = await CampaignModel.findByIdAndUpdate(
      req.params.campaignId,
      { $set: { active: false } },
      { new: true },
    )
    if (!updated) return res.status(404).json({ message: 'Campaign not found.' })
    return res.json(ok({ id: updated.id, deactivated: true }))
  })

  router.get('/_internal/by-ids', async (req, res) => {
    if (req.header('x-internal-key') !== env.jwtSecret) {
      return res.status(403).json({ message: 'Forbidden.' })
    }
    const ids = String(req.query.ids ?? '').split(',').filter(Boolean)
    const campaigns = await CampaignModel.find(ids.length ? { _id: { $in: ids } } : {}).limit(500)
    return res.json(ok(campaigns.map(shape)))
  })

  return router
}
