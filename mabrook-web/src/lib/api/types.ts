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

export type Campaign = {
  id: string
  name: string
  startDate: string
  endDate: string
  totalRewardAmount: number
  linkCode: string
}

export type Referral = {
  id: string
  brokerId: string
  customerName: string
  phone: string
  campaignId: string
  status: ReferralStatus
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

export type UserCampaignAcceptance = {
  userId: string
  campaignId: string
  referralLinkCode: string
  acceptedAt: string
}

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
