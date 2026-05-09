import { Router } from 'express'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { z } from 'zod'
import {
  EVENTS,
  makeRequireAuth,
  ok,
  requireRole,
  type EventBus,
  type ReferralAcceptedEvent,
  type ReferralConvertedEvent,
  type ReferralCreatedEvent,
  type ReferralReviewedEvent,
} from '@aicrm/shared'
import { env } from '../config/env.js'
import { AcceptanceModel } from '../models/Acceptance.js'
import { ReferralModel } from '../models/Referral.js'

const requireAuth = makeRequireAuth(env.jwtSecret)

const referralCreateSchema = z.object({
  customerName: z.string().min(2),
  phone: z.string().min(5),
  campaignId: z.string().min(1),
})

const reviewSchema = z.object({
  status: z.enum(['pending', 'verified', 'converted', 'rejected']),
  reviewNote: z.string().optional(),
})

const acceptSchema = z.object({
  referralLinkCode: z.string(),
  campaignId: z.string(),
})

function shape(r: NonNullable<Awaited<ReturnType<typeof ReferralModel.findOne>>>) {
  return {
    id: r.id,
    brokerId: r.brokerId,
    customerName: r.customerName,
    phone: r.phone,
    campaignId: r.campaignId,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }
}

async function fetchCampaign(campaignId: string) {
  try {
    const res = await fetch(`${env.campaignServiceUrl}/api/campaigns/_internal/by-ids?ids=${campaignId}`, {
      headers: { 'x-internal-key': env.jwtSecret },
    })
    if (!res.ok) return null
    const json = (await res.json()) as { data: Array<{ id: string; totalRewardAmount: number; rewardCurrency: string }> }
    return json.data[0] ?? null
  } catch {
    return null
  }
}

export function referralsRouter(bus: EventBus | null) {
  const router = Router()

  router.get('/', requireAuth, async (req, res) => {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 10)))
    const query = String(req.query.query ?? '').trim()
    const status = String(req.query.status ?? '').toLowerCase()
    const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : null
    const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : null

    const filter: Record<string, unknown> = {}
    if (req.auth!.role === 'broker') filter.brokerId = req.auth!.userId
    if (status && status !== 'all') filter.status = status
    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) (filter.createdAt as Record<string, unknown>).$gte = startDate
      if (endDate) (filter.createdAt as Record<string, unknown>).$lte = endDate
    }
    if (query) {
      const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      filter.$or = [{ customerName: regex }, { phone: regex }]
    }

    const [items, total] = await Promise.all([
      ReferralModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize),
      ReferralModel.countDocuments(filter),
    ])
    return res.json(ok({ items: items.map(shape), page, pageSize, total }))
  })

  router.get('/:referralId', requireAuth, async (req, res) => {
    const r = await ReferralModel.findById(req.params.referralId)
    if (!r) return res.status(404).json({ message: 'Referral not found.' })
    if (req.auth!.role === 'broker' && r.brokerId !== req.auth!.userId) {
      return res.status(403).json({ message: 'Forbidden.' })
    }
    return res.json(ok(shape(r)))
  })

  router.post('/', requireAuth, requireRole(['admin', 'broker']), async (req, res) => {
    const input = referralCreateSchema.parse(req.body)
    const parsed = parsePhoneNumberFromString(input.phone, 'PK')
    const phoneE164 = parsed?.isValid() ? parsed.format('E.164') : input.phone

    const dup = await ReferralModel.findOne({ phoneE164, campaignId: input.campaignId })
    if (dup) return res.status(409).json({ message: 'Duplicate referral for this campaign and phone.' })

    const referral = await ReferralModel.create({
      brokerId: req.auth!.userId,
      customerName: input.customerName,
      phone: input.phone,
      phoneE164,
      campaignId: input.campaignId,
      status: 'pending',
    })

    if (bus) {
      const evt: ReferralCreatedEvent = {
        referralId: referral.id,
        brokerId: referral.brokerId,
        campaignId: referral.campaignId,
        customerName: referral.customerName,
        phone: referral.phone,
        occurredAt: new Date().toISOString(),
      }
      await bus.publish(EVENTS.REFERRAL_CREATED, evt)
    }
    return res.status(201).json(ok(shape(referral)))
  })

  return router
}

export function adminReferralsRouter(bus: EventBus | null) {
  const router = Router()

  router.get('/review', requireAuth, requireRole(['admin', 'support']), async (_req, res) => {
    const referrals = await ReferralModel.find().sort({ createdAt: -1 }).limit(50)
    return res.json(ok(referrals.map(shape)))
  })

  router.patch('/:referralId/review', requireAuth, requireRole(['admin', 'support']), async (req, res) => {
    const input = reviewSchema.parse(req.body)
    const referral = await ReferralModel.findById(req.params.referralId)
    if (!referral) return res.status(404).json({ message: 'Referral not found.' })

    referral.status = input.status
    referral.reviewNote = input.reviewNote
    referral.reviewedBy = req.auth!.userId
    referral.reviewedAt = new Date()
    await referral.save()

    if (bus) {
      const reviewEvt: ReferralReviewedEvent = {
        referralId: referral.id,
        brokerId: referral.brokerId,
        campaignId: referral.campaignId,
        status: input.status,
        reviewedBy: req.auth!.userId,
        occurredAt: new Date().toISOString(),
      }
      await bus.publish(EVENTS.REFERRAL_REVIEWED, reviewEvt)

      if (input.status === 'converted') {
        const camp = await fetchCampaign(referral.campaignId)
        const evt: ReferralConvertedEvent = {
          referralId: referral.id,
          brokerId: referral.brokerId,
          campaignId: referral.campaignId,
          customerName: referral.customerName,
          rewardAmount: camp ? Math.min(camp.totalRewardAmount, env.defaultRewardAmount) : env.defaultRewardAmount,
          rewardCurrency: camp?.rewardCurrency ?? env.defaultRewardCurrency,
          occurredAt: new Date().toISOString(),
        }
        await bus.publish(EVENTS.REFERRAL_CONVERTED, evt)
      }
    }

    return res.json(
      ok({
        id: referral.id,
        status: referral.status,
        reviewNote: referral.reviewNote,
        reviewedBy: referral.reviewedBy,
        reviewedAt: referral.reviewedAt?.toISOString(),
      }),
    )
  })

  return router
}

export function acceptanceRouter(bus: EventBus | null) {
  const router = Router()

  router.post('/ref/:code/accept', requireAuth, requireRole(['user']), async (req, res) => {
    const body = acceptSchema.parse(req.body)
    const acceptance = await AcceptanceModel.findOneAndUpdate(
      { userId: req.auth!.userId, campaignId: body.campaignId },
      {
        $setOnInsert: {
          userId: req.auth!.userId,
          campaignId: body.campaignId,
          referralLinkCode: body.referralLinkCode || req.params.code,
        },
      },
      { upsert: true, new: true },
    )

    if (bus) {
      const evt: ReferralAcceptedEvent = {
        userId: req.auth!.userId,
        campaignId: body.campaignId,
        referralLinkCode: body.referralLinkCode || req.params.code,
        occurredAt: new Date().toISOString(),
      }
      await bus.publish(EVENTS.REFERRAL_ACCEPTED, evt)
    }

    return res.status(201).json(
      ok({
        userId: acceptance.userId,
        campaignId: acceptance.campaignId,
        referralLinkCode: acceptance.referralLinkCode,
        acceptedAt: acceptance.acceptedAt.toISOString(),
      }),
    )
  })

  router.get('/users/:userId/accepted-campaigns', requireAuth, async (req, res) => {
    if (req.auth!.role === 'user' && req.auth!.userId !== req.params.userId) {
      return res.status(403).json({ message: 'Forbidden.' })
    }
    const accepted = await AcceptanceModel.find({ userId: req.params.userId }).limit(200)
    if (accepted.length === 0) return res.json(ok([]))

    const ids = accepted.map((a) => a.campaignId).join(',')
    try {
      const r = await fetch(`${env.campaignServiceUrl}/api/campaigns/_internal/by-ids?ids=${ids}`, {
        headers: { 'x-internal-key': env.jwtSecret },
      })
      const json = (await r.json()) as { data: unknown[] }
      return res.json(ok(json.data ?? []))
    } catch {
      return res.json(ok([]))
    }
  })

  return router
}
