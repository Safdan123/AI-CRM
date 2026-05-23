export type UserRole = 'admin' | 'broker' | 'user' | 'support'

export type ReferralStatus = 'pending' | 'verified' | 'converted' | 'rejected'

export type ApiResult<T> = {
  data: T
  message?: string
}

export type PaginatedResult<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export type AuthUser = {
  id: string
  fullName: string
  email: string
  role: UserRole
}

export type LeaderboardTier = {
  rank: number
  rewardAmount: number
}

export type Campaign = {
  id: string
  name: string
  description?: string
  startDate: string
  endDate: string
  totalRewardAmount: number
  rewardCurrency?: string
  rewardPerConversion?: number
  minInvestmentAmount?: number
  requireVerifiedBeforeConvert?: boolean
  leaderboardTiers?: LeaderboardTier[]
  linkCode: string
  active?: boolean
}

export type Referral = {
  id: string
  brokerId: string
  customerUserId?: string
  customerName: string
  phone: string
  campaignId: string
  source?: ReferralSource
  inviteCode?: string
  relationship?: string
  notes?: string
  status: ReferralStatus
  investmentAmount?: number
  investmentCurrency?: string
  rewardAmount?: number
  rewardCurrency?: string
  createdAt: string
}

export type LeaderboardRow = {
  rank: number
  brokerId: string
  name: string
  score: number
}

export type LeaderboardMeStats = {
  period: string
  campaignId: string | null
  totalReferrals: number
  conversions: number
  rewardsEarned: number
  position: number
  totalBrokers: number
}

export type LoginActivityRow = {
  id: string
  success: boolean
  ip: string
  userAgent: string
  failureReason?: string
  createdAt: string
}

export type ReferralReview = {
  id: string
  status: ReferralStatus
  reviewNote?: string
  reviewedBy: string
  reviewedAt: string
}

export type AdminKpi = {
  totalCustomers: number
  activeBrokers: number
  totalReferrals: number
  conversions: number
  rewardsDistributed: number
}

/** Daily counter bucket from `GET /api/analytics/timeseries/:key`. */
export type TimeseriesPoint = { date: string; value: number }

export type BrokerInviteLink = {
  inviteCode: string
  brokerId: string
  campaignId: string
  active: boolean
  inviteUrl: string
  createdAt: string
}

export type InviteResolvePayload = {
  inviteCode: string
  broker: { id: string; name: string }
  campaign: {
    id: string
    name: string
    description: string
    startDate: string
    endDate: string
    rewardCurrency: string
    rewardPerConversion: number
    minInvestmentAmount: number
  }
}

export type InviteAcceptResult = {
  alreadyAccepted: boolean
  userId: string
  brokerId: string
  campaignId: string
  inviteCode: string
  referralId?: string
  acceptedAt: string
}

export type UserCampaignAcceptance = {
  userId: string
  campaignId: string
  referralLinkCode?: string
  acceptedAt: string
}

export type ReferralSource = 'manual' | 'invite_link'

export type ScoreTier = 'high' | 'medium' | 'low'

export type LeadScoreRow = {
  id: string
  displayName: string
  brokerName: string
  region: string
  stage: string
  score: number
  tier: ScoreTier
  reasons: string[]
  features: Record<string, number>
}

export type ChurnScoreRow = {
  id: string
  displayName: string
  region: string
  risk: number
  tier: ScoreTier
  reasons: string[]
  features: Record<string, number>
}

export type AiScoresSummary = {
  total: number
  high: number
  medium: number
  low: number
}

export type LeadScoresPayload = {
  items: LeadScoreRow[]
  summary: AiScoresSummary
  hint?: string
}

export type ChurnScoresPayload = {
  items: ChurnScoreRow[]
  summary: AiScoresSummary
  hint?: string
}
