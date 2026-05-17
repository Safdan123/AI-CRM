import type {
  AdminServiceContract,
  AiInsightsContract,
  AnalyticsServiceContract,
  AuthServiceContract,
  CampaignServiceContract,
  ReferralServiceContract,
  UserPortalServiceContract,
} from './contracts'
import { mockAdminKpis, mockCampaigns, mockReferrals, mockUser } from './mockData'
import type { ChurnScoreRow, LeadScoreRow, TimeseriesPoint } from './types'

function wait(ms = 180) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const mockAuthService: AuthServiceContract = {
  async login() {
    await wait()
    return { data: { user: mockUser, accessToken: 'mock-token' } }
  },
  async signup(input) {
    await wait()
    return {
      data: {
        user: { ...mockUser, fullName: input.fullName, email: input.email },
        accessToken: 'mock-token',
      },
    }
  },
  async me() {
    await wait()
    return { data: mockUser }
  },
  async logout() {
    await wait()
    return { data: { ok: true } }
  },
  async forgotPassword() {
    await wait()
    return { data: { message: 'If that email exists, a reset link has been sent.' } }
  },
  async resetPassword() {
    await wait()
    return { data: { message: 'Password updated.' } }
  },
  async changePassword() {
    await wait()
    return { data: { message: 'Password changed successfully.' } }
  },
}

export const mockCampaignService: CampaignServiceContract = {
  async list() {
    await wait()
    return { data: mockCampaigns }
  },
  async getById(campaignId) {
    await wait()
    return {
      data:
        mockCampaigns.find((c) => c.id === campaignId) ??
        mockCampaigns[0],
    }
  },
  async create(input) {
    await wait()
    return {
      data: {
        id: `mock-${Date.now()}`,
        name: input.name,
        startDate: input.startDate,
        endDate: input.endDate,
        totalRewardAmount: input.totalRewardAmount,
        linkCode: 'MOCK-LINK',
        rewardCurrency: input.rewardCurrency ?? 'USD',
      },
    }
  },
}

export const mockReferralService: ReferralServiceContract = {
  async listByBroker(params) {
    await wait()
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 10
    const q = params?.query?.toLowerCase().trim()
    const status = params?.status?.toLowerCase()
    let filtered = [...mockReferrals]

    if (q) {
      filtered = filtered.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.phone.includes(q),
      )
    }
    if (status && status !== 'all') {
      filtered = filtered.filter((r) => r.status === status)
    }
    if (params?.startDate) filtered = filtered.filter((r) => r.createdAt >= params.startDate!)
    if (params?.endDate) filtered = filtered.filter((r) => r.createdAt <= params.endDate!)

    const start = (page - 1) * pageSize
    const items = filtered.slice(start, start + pageSize)
    return { data: { items, page, pageSize, total: filtered.length } }
  },
  async getById(referralId) {
    await wait()
    return {
      data: mockReferrals.find((r) => r.id === referralId) ?? mockReferrals[0],
    }
  },
}

function buildMockTimeseries(days: number): TimeseriesPoint[] {
  const out: TimeseriesPoint[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const date = d.toISOString().slice(0, 10)
    const wave = Math.sin(i / 5) * 4
    const value = Math.max(0, Math.round(3 + wave + i * 0.15))
    out.push({ date, value })
  }
  return out
}

export const mockAnalyticsService: AnalyticsServiceContract = {
  async getTimeseries(_key, days = 30) {
    await wait()
    return { data: buildMockTimeseries(Math.min(180, Math.max(7, days))) }
  },
}

export const mockAdminService: AdminServiceContract = {
  async getKpis() {
    await wait()
    return { data: mockAdminKpis }
  },
  async listReferralsForReview() {
    await wait()
    return { data: mockReferrals.slice(0, 12) }
  },
  async reviewReferral(referralId, input) {
    await wait()
    return {
      data: {
        id: referralId,
        status: input.status,
        reviewNote: input.reviewNote,
        reviewedBy: 'u-admin-1',
        reviewedAt: new Date().toISOString(),
      },
    }
  },
}

const mockLeadRows: LeadScoreRow[] = [
  {
    id: 'mock-lead-1',
    displayName: 'Sara Malik',
    brokerName: 'Community Broker Desk',
    region: 'Lahore',
    stage: 'verified',
    score: 78,
    tier: 'high',
    reasons: ['Broker quality proxy is strong (synthetic).', 'Contact details look complete.'],
    features: {},
  },
  {
    id: 'mock-lead-2',
    displayName: 'Omar Rahman',
    brokerName: 'Al Mabrook Partner East',
    region: 'Karachi',
    stage: 'pending',
    score: 52,
    tier: 'medium',
    reasons: ['Lead has been in stage for a while — prioritise follow-up.'],
    features: {},
  },
  {
    id: 'mock-lead-3',
    displayName: 'Fatima Abbas',
    brokerName: 'Retail Referral Hub',
    region: 'Islamabad',
    stage: 'pending',
    score: 28,
    tier: 'low',
    reasons: ['Broker quality proxy is weak (synthetic).', 'Missing key contact signals (synthetic).'],
    features: {},
  },
]

const mockChurnRows: ChurnScoreRow[] = [
  {
    id: 'mock-cust-1',
    displayName: 'Hassan Qureshi',
    region: 'Multan',
    risk: 72,
    tier: 'high',
    reasons: ['No recent activity window is wide (synthetic).', 'Support friction proxy elevated (synthetic).'],
    features: {},
  },
  {
    id: 'mock-cust-2',
    displayName: 'Maryam Siddiqui',
    region: 'Lahore',
    risk: 48,
    tier: 'medium',
    reasons: ['Reward velocity flat or negative (synthetic).'],
    features: {},
  },
  {
    id: 'mock-cust-3',
    displayName: 'Zain Mirza',
    region: 'Karachi',
    risk: 18,
    tier: 'low',
    reasons: ['Recent activity within window (synthetic).', 'Meaningful rewards balance proxy — stickiness signal.'],
    features: {},
  },
]

function summarize(rows: { tier: 'high' | 'medium' | 'low' }[]) {
  const high = rows.filter((r) => r.tier === 'high').length
  const medium = rows.filter((r) => r.tier === 'medium').length
  const low = rows.filter((r) => r.tier === 'low').length
  return {
    total: rows.length,
    high,
    medium,
    low,
  }
}

export const mockAiInsightsService: AiInsightsContract = {
  async getLeadScores(params) {
    await wait()
    const tier = params?.tier
    const limit = params?.limit ?? 80
    const filtered = tier ? mockLeadRows.filter((r) => r.tier === tier) : mockLeadRows
    return {
      data: {
        items: filtered.slice(0, limit),
        summary: summarize(mockLeadRows),
      },
    }
  },
  async getChurnScores(params) {
    await wait()
    const tier = params?.tier
    const limit = params?.limit ?? 80
    const filtered = tier ? mockChurnRows.filter((r) => r.tier === tier) : mockChurnRows
    return {
      data: {
        items: filtered.slice(0, limit),
        summary: summarize(mockChurnRows),
      },
    }
  },
}

export const mockUserPortalService: UserPortalServiceContract = {
  async acceptReferralFromLink(input) {
    await wait()
    return {
      data: {
        userId: 'u-user-1',
        campaignId: input.campaignId,
        referralLinkCode: input.referralLinkCode,
        acceptedAt: new Date().toISOString(),
      },
    }
  },
  async listAcceptedCampaigns() {
    await wait()
    return { data: mockCampaigns }
  },
}
