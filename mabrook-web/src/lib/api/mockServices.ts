import type {
  AdminServiceContract,
  AuthServiceContract,
  CampaignServiceContract,
  ReferralServiceContract,
  UserPortalServiceContract,
} from './contracts'
import { mockAdminKpis, mockCampaigns, mockReferrals, mockUser } from './mockData'

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
