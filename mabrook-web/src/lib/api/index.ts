import type {
  AdminServiceContract,
  AiInsightsContract,
  AnalyticsServiceContract,
  AuthServiceContract,
  CampaignServiceContract,
  ReferralServiceContract,
  UserPortalServiceContract,
} from './contracts'
import {
  mockAdminService,
  mockAiInsightsService,
  mockAnalyticsService,
  mockAuthService,
  mockCampaignService,
  mockReferralService,
  mockUserPortalService,
} from './mockServices'
import {
  realAdminService,
  realAiInsightsService,
  realAnalyticsService,
  realAuthService,
  realCampaignService,
  realReferralService,
  realUserPortalService,
} from './realServices'

/**
 * Backend integration switch:
 * - default "mock" for UI-first development
 * - set VITE_API_MODE=real to use backend services
 */
const API_MODE: 'mock' | 'real' =
  (import.meta.env.VITE_API_MODE as 'mock' | 'real' | undefined) ?? 'mock'

export const authService: AuthServiceContract =
  API_MODE === 'mock' ? mockAuthService : realAuthService

export const campaignService: CampaignServiceContract =
  API_MODE === 'mock'
    ? mockCampaignService
    : realCampaignService

export const referralService: ReferralServiceContract =
  API_MODE === 'mock'
    ? mockReferralService
    : realReferralService

export const adminService: AdminServiceContract =
  API_MODE === 'mock'
    ? mockAdminService
    : realAdminService

export const analyticsService: AnalyticsServiceContract =
  API_MODE === 'mock' ? mockAnalyticsService : realAnalyticsService

export const userPortalService: UserPortalServiceContract =
  API_MODE === 'mock'
    ? mockUserPortalService
    : realUserPortalService

export const aiInsightsService: AiInsightsContract =
  API_MODE === 'mock' ? mockAiInsightsService : realAiInsightsService
