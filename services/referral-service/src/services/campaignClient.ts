import { env } from '../config/env.js'

export type CampaignSnapshot = {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  linkCode: string
  active: boolean
  createdBy: string
  totalRewardAmount: number
  rewardCurrency: string
  rewardPerConversion: number
  minInvestmentAmount: number
  requireVerifiedBeforeConvert: boolean
}

export async function fetchCampaign(campaignId: string): Promise<CampaignSnapshot | null> {
  try {
    const res = await fetch(`${env.campaignServiceUrl}/api/campaigns/_internal/by-ids?ids=${campaignId}`, {
      headers: { 'x-internal-key': env.jwtSecret },
    })
    if (!res.ok) return null
    const json = (await res.json()) as {
      data: Array<{
        id: string
        name: string
        description?: string
        startDate: string
        endDate: string
        linkCode: string
        active?: boolean
        createdBy?: string
        totalRewardAmount: number
        rewardCurrency: string
        rewardPerConversion?: number
        minInvestmentAmount?: number
        requireVerifiedBeforeConvert?: boolean
      }>
    }
    const c = json.data[0]
    if (!c) return null
    return {
      id: c.id,
      name: c.name,
      description: c.description ?? '',
      startDate: c.startDate,
      endDate: c.endDate,
      linkCode: c.linkCode,
      active: c.active ?? true,
      createdBy: c.createdBy ?? '',
      totalRewardAmount: c.totalRewardAmount,
      rewardCurrency: c.rewardCurrency,
      rewardPerConversion: c.rewardPerConversion ?? c.totalRewardAmount,
      minInvestmentAmount: c.minInvestmentAmount ?? 0,
      requireVerifiedBeforeConvert: c.requireVerifiedBeforeConvert ?? true,
    }
  } catch {
    return null
  }
}
