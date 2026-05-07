import type {
  AdminKpi,
  ApiResult,
  AuthUser,
  Campaign,
  PaginatedResult,
  Referral,
  ReferralReview,
  UserCampaignAcceptance,
} from './types'

export type LoginInput = { email: string; password: string }
export type SignupInput = {
  fullName: string
  email: string
  password: string
  role?: 'admin' | 'broker' | 'user' | 'support'
}

export interface AuthServiceContract {
  login(input: LoginInput): Promise<ApiResult<{ user: AuthUser; accessToken: string }>>
  signup(input: SignupInput): Promise<ApiResult<{ user: AuthUser; accessToken: string }>>
  me(): Promise<ApiResult<AuthUser>>
  logout(): Promise<ApiResult<{ ok: true }>>
}

export interface CampaignServiceContract {
  list(): Promise<ApiResult<Campaign[]>>
  getById(campaignId: string): Promise<ApiResult<Campaign>>
}

export interface ReferralServiceContract {
  listByBroker(params?: {
    query?: string
    status?: string
    startDate?: string
    endDate?: string
    page?: number
    pageSize?: number
  }): Promise<ApiResult<PaginatedResult<Referral>>>
  getById(referralId: string): Promise<ApiResult<Referral>>
}

export interface AdminServiceContract {
  getKpis(): Promise<ApiResult<AdminKpi>>
  listReferralsForReview(): Promise<ApiResult<Referral[]>>
  reviewReferral(
    referralId: string,
    input: { status: ReferralReview['status']; reviewNote?: string },
  ): Promise<ApiResult<ReferralReview>>
}

export interface UserPortalServiceContract {
  acceptReferralFromLink(input: {
    referralLinkCode: string
    campaignId: string
  }): Promise<ApiResult<UserCampaignAcceptance>>
  listAcceptedCampaigns(userId: string): Promise<ApiResult<Campaign[]>>
}
