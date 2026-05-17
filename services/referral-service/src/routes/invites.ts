import { Router } from 'express'
import { nanoid } from 'nanoid'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { z } from 'zod'
import {
  EVENTS,
  makeRequireAuth,
  ok,
  requireRole,
  type EventBus,
  type ReferralAcceptedEvent,
  type ReferralCreatedEvent,
} from '@aicrm/shared'
import { env } from '../config/env.js'
import { AcceptanceModel } from '../models/Acceptance.js'
import { BrokerCampaignInviteModel } from '../models/BrokerCampaignInvite.js'
import { ReferralModel } from '../models/Referral.js'
import { fetchCampaign } from '../services/campaignClient.js'
import { fetchProfile } from '../services/profileClient.js'

const requireAuth = makeRequireAuth(env.jwtSecret)

const createInviteSchema = z.object({
  campaignId: z.string().min(1),
})

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

function inviteShape(invite: {
  inviteCode: string
  brokerId: string
  campaignId: string
  active: boolean
  createdAt: Date
}) {
  const base = env.publicAppUrl.replace(/\/$/, '')
  return {
    inviteCode: invite.inviteCode,
    brokerId: invite.brokerId,
    campaignId: invite.campaignId,
    active: invite.active,
    inviteUrl: `${base}/invite/${invite.inviteCode}`,
    createdAt: invite.createdAt.toISOString(),
  }
}

async function uniqueInviteCode() {
  for (let i = 0; i < 8; i++) {
    const code = `INV-${nanoid(10).toUpperCase()}`
    const exists = await BrokerCampaignInviteModel.findOne({ inviteCode: code })
    if (!exists) return code
  }
  throw new Error('Could not allocate invite code.')
}

export function brokerInvitesRouter() {
  const router = Router()

  router.get('/me/invites', requireAuth, requireRole(['admin', 'broker']), async (req, res) => {
    const campaignId = String(req.query.campaignId ?? '').trim()
    const brokerId = req.auth!.userId
    const filter: Record<string, unknown> = { brokerId, active: true }
    if (campaignId) filter.campaignId = campaignId

    const invites = await BrokerCampaignInviteModel.find(filter).sort({ createdAt: -1 }).limit(100)
    return res.json(ok(invites.map(inviteShape)))
  })

  router.post('/me/invites', requireAuth, requireRole(['admin', 'broker']), async (req, res) => {
    const input = createInviteSchema.parse(req.body)
    const brokerId = req.auth!.userId

    const campaign = await fetchCampaign(input.campaignId)
    if (!campaign) return res.status(404).json({ message: 'Campaign not found.' })
    if (!campaign.active) return res.status(400).json({ message: 'Campaign is not active.' })

    let invite = await BrokerCampaignInviteModel.findOne({
      brokerId,
      campaignId: input.campaignId,
    })
    if (!invite) {
      invite = await BrokerCampaignInviteModel.create({
        brokerId,
        campaignId: input.campaignId,
        inviteCode: await uniqueInviteCode(),
        active: true,
      })
    }

    return res.status(201).json(ok(inviteShape(invite)))
  })

  return router
}

export function publicInvitesRouter(bus: EventBus | null) {
  const router = Router()

  router.get('/:inviteCode', async (req, res) => {
    const code = String(req.params.inviteCode ?? '').trim().toUpperCase()
    const invite = await BrokerCampaignInviteModel.findOne({ inviteCode: code, active: true })
    if (!invite) return res.status(404).json({ message: 'Invite link not found or expired.' })

    const campaign = await fetchCampaign(invite.campaignId)
    if (!campaign || !campaign.active) {
      return res.status(400).json({ message: 'Campaign is no longer available.' })
    }

    const names = await fetchBrokerNames([invite.brokerId])
    return res.json(
      ok({
        inviteCode: invite.inviteCode,
        broker: {
          id: invite.brokerId,
          name: names.get(invite.brokerId) ?? 'Broker',
        },
        campaign: {
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          rewardCurrency: campaign.rewardCurrency,
          rewardPerConversion: campaign.rewardPerConversion,
          minInvestmentAmount: campaign.minInvestmentAmount,
        },
      }),
    )
  })

  router.post('/:inviteCode/accept', requireAuth, requireRole(['user']), async (req, res) => {
    const code = String(req.params.inviteCode ?? '').trim().toUpperCase()
    const invite = await BrokerCampaignInviteModel.findOne({ inviteCode: code, active: true })
    if (!invite) return res.status(404).json({ message: 'Invite link not found or expired.' })

    const campaign = await fetchCampaign(invite.campaignId)
    if (!campaign || !campaign.active) {
      return res.status(400).json({ message: 'Campaign is no longer available.' })
    }

    const userId = req.auth!.userId
    const existingAcceptance = await AcceptanceModel.findOne({
      userId,
      campaignId: invite.campaignId,
    })
    if (existingAcceptance) {
      return res.json(
        ok({
          alreadyAccepted: true,
          userId: existingAcceptance.userId,
          brokerId: existingAcceptance.brokerId,
          campaignId: existingAcceptance.campaignId,
          inviteCode: existingAcceptance.inviteCode,
          referralId: existingAcceptance.referralId,
          acceptedAt: existingAcceptance.acceptedAt.toISOString(),
        }),
      )
    }

    const profile =
      (await fetchProfile(userId)) ??
      ({
        userId,
        fullName: req.auth!.email.split('@')[0] ?? 'Customer',
        email: req.auth!.email,
      } as const)

    const phone = profile.phone?.trim() || `user:${userId}`
    const parsed = parsePhoneNumberFromString(phone, 'PK')
    const phoneE164 = parsed?.isValid() ? parsed.format('E.164') : phone

    let referral = await ReferralModel.findOne({
      campaignId: invite.campaignId,
      customerUserId: userId,
    })
    if (!referral && phoneE164 && !phoneE164.startsWith('user:')) {
      referral = await ReferralModel.findOne({ campaignId: invite.campaignId, phoneE164 })
    }

    if (!referral) {
      referral = await ReferralModel.create({
        brokerId: invite.brokerId,
        customerUserId: userId,
        customerName: profile.fullName,
        phone: profile.phone?.trim() || phone,
        phoneE164: phoneE164.startsWith('user:') ? undefined : phoneE164,
        campaignId: invite.campaignId,
        source: 'invite_link',
        inviteCode: invite.inviteCode,
        notes: 'Customer joined via broker invite link.',
        status: 'pending',
      })

      if (bus) {
        const createdEvt: ReferralCreatedEvent = {
          referralId: referral.id,
          brokerId: referral.brokerId,
          campaignId: referral.campaignId,
          customerName: referral.customerName,
          phone: referral.phone,
          occurredAt: new Date().toISOString(),
        }
        await bus.publish(EVENTS.REFERRAL_CREATED, createdEvt)
      }
    }

    const acceptance = await AcceptanceModel.create({
      userId,
      brokerId: invite.brokerId,
      campaignId: invite.campaignId,
      inviteCode: invite.inviteCode,
      referralId: referral.id,
      referralLinkCode: campaign.linkCode,
    })

    if (bus) {
      const evt: ReferralAcceptedEvent = {
        userId,
        brokerId: invite.brokerId,
        campaignId: invite.campaignId,
        inviteCode: invite.inviteCode,
        referralId: referral.id,
        referralLinkCode: campaign.linkCode,
        occurredAt: new Date().toISOString(),
      }
      await bus.publish(EVENTS.REFERRAL_ACCEPTED, evt)
    }

    return res.status(201).json(
      ok({
        alreadyAccepted: false,
        userId: acceptance.userId,
        brokerId: acceptance.brokerId,
        campaignId: acceptance.campaignId,
        inviteCode: acceptance.inviteCode,
        referralId: acceptance.referralId,
        acceptedAt: acceptance.acceptedAt.toISOString(),
      }),
    )
  })

  return router
}
