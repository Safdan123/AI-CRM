import type { ReferralStatus } from '../models/Referral.js'
import type { CampaignSnapshot } from './campaignClient.js'

const ALLOWED: Record<ReferralStatus, ReferralStatus[]> = {
  pending: ['verified', 'rejected'],
  verified: ['converted', 'rejected'],
  converted: [],
  rejected: [],
}

export function assertStatusTransition(from: ReferralStatus, to: ReferralStatus) {
  if (from === to) return
  if (!ALLOWED[from].includes(to)) {
    throw new Error(`Cannot change referral status from ${from} to ${to}.`)
  }
}

export function resolveConversionReward(
  campaign: CampaignSnapshot | null,
  fallbackAmount: number,
  fallbackCurrency: string,
) {
  if (!campaign) {
    return { rewardAmount: fallbackAmount, rewardCurrency: fallbackCurrency }
  }
  const rewardAmount = Math.min(
    campaign.rewardPerConversion > 0 ? campaign.rewardPerConversion : campaign.totalRewardAmount,
    campaign.totalRewardAmount > 0 ? campaign.totalRewardAmount : fallbackAmount,
  )
  return {
    rewardAmount: rewardAmount > 0 ? rewardAmount : fallbackAmount,
    rewardCurrency: campaign.rewardCurrency || fallbackCurrency,
  }
}

export function validateConversionCriteria(input: {
  campaign: CampaignSnapshot | null
  currentStatus: ReferralStatus
  investmentAmount?: number
}) {
  const { campaign, currentStatus, investmentAmount } = input
  if (campaign?.requireVerifiedBeforeConvert && currentStatus !== 'verified') {
    throw new Error('Referral must be verified before conversion.')
  }
  const min = campaign?.minInvestmentAmount ?? 0
  if (min > 0) {
    if (investmentAmount == null || investmentAmount < min) {
      throw new Error(`Investment amount must be at least ${min} to convert this referral.`)
    }
  }
}
