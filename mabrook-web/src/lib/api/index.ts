import type {
  AdminServiceContract,
  AuthServiceContract,
  CampaignServiceContract,
  ReferralServiceContract,
  UserPortalServiceContract,
} from './contracts'
import {
  mockAdminService,
  mockAuthService,
  mockCampaignService,
  mockReferralService,
  mockUserPortalService,
} from './mockServices'

/**
 * Backend integration switch:
 * - keep "mock" until backend routes are ready
 * - change to "real" and wire HTTP services in one place
 */
const API_MODE: 'mock' | 'real' = 'mock'

function notWired<T extends object>(name: string): T {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(`${name} real service is not wired yet.`)
      },
    },
  ) as T
}

export const authService: AuthServiceContract =
  API_MODE === 'mock' ? mockAuthService : notWired<AuthServiceContract>('authService')

export const campaignService: CampaignServiceContract =
  API_MODE === 'mock'
    ? mockCampaignService
    : notWired<CampaignServiceContract>('campaignService')

export const referralService: ReferralServiceContract =
  API_MODE === 'mock'
    ? mockReferralService
    : notWired<ReferralServiceContract>('referralService')

export const adminService: AdminServiceContract =
  API_MODE === 'mock'
    ? mockAdminService
    : notWired<AdminServiceContract>('adminService')

export const userPortalService: UserPortalServiceContract =
  API_MODE === 'mock'
    ? mockUserPortalService
    : notWired<UserPortalServiceContract>('userPortalService')
