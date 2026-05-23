import { z } from 'zod'

export const leaderboardTierSchema = z.object({
  rank: z.number().int().positive(),
  rewardAmount: z.number().nonnegative(),
})
export type LeaderboardTier = z.infer<typeof leaderboardTierSchema>

export const campaignRulesSchema = z.object({
  rewardPerConversion: z.number().nonnegative(),
  minInvestmentAmount: z.number().nonnegative().default(0),
  requireVerifiedBeforeConvert: z.boolean().default(true),
  leaderboardTiers: z.array(leaderboardTierSchema).default([]),
})
export type CampaignRules = z.infer<typeof campaignRulesSchema>

export const leaderboardPeriodSchema = z.enum(['day', 'week', 'month', 'all'])
export const leaderboardMetricSchema = z.enum(['referrals', 'conversions', 'rewards'])
