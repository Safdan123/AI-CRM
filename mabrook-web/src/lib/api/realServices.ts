import type {
  AdminServiceContract,
  AiInsightsContract,
  AuthServiceContract,
  CampaignServiceContract,
  ReferralServiceContract,
  UserPortalServiceContract,
} from './contracts'
import type { ApiResult, Campaign, ChurnScoresPayload, LeadScoresPayload, Referral, ScoreTier, UserCampaignAcceptance } from './types'
import { apiFetch, apiFetchPublic, apiUpload, setAccessToken, setRefreshToken } from './http'

type AuthResponse = {
  user: { id: string; fullName: string; email: string; role: 'admin' | 'broker' | 'user' | 'support' }
  accessToken: string
  refreshToken?: string
}

export const realAuthService: AuthServiceContract = {
  async login(input) {
    const result = await apiFetchPublic<ApiResult<AuthResponse>>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    setAccessToken(result.data.accessToken)
    if (result.data.refreshToken) setRefreshToken(result.data.refreshToken)
    return result
  },
  async signup(input) {
    const result = await apiFetchPublic<ApiResult<AuthResponse>>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    setAccessToken(result.data.accessToken)
    if (result.data.refreshToken) setRefreshToken(result.data.refreshToken)
    return result
  },
  async me() {
    return apiFetch('/api/auth/me')
  },
  async logout() {
    const result = await apiFetch<ApiResult<{ ok: true }>>('/api/auth/logout', { method: 'POST' })
    setAccessToken(null)
    setRefreshToken(null)
    return result
  },
}

export const realCampaignService: CampaignServiceContract = {
  async list() {
    return apiFetch('/api/campaigns')
  },
  async getById(campaignId) {
    return apiFetch(`/api/campaigns/${campaignId}`)
  },
}

export const realReferralService: ReferralServiceContract = {
  async listByBroker(params) {
    const search = new URLSearchParams()
    if (params?.query) search.set('query', params.query)
    if (params?.status) search.set('status', params.status)
    if (params?.startDate) search.set('startDate', params.startDate)
    if (params?.endDate) search.set('endDate', params.endDate)
    if (params?.page) search.set('page', String(params.page))
    if (params?.pageSize) search.set('pageSize', String(params.pageSize))
    return apiFetch(`/api/referrals?${search.toString()}`)
  },
  async getById(referralId) {
    return apiFetch(`/api/referrals/${referralId}`)
  },
}

export const realAdminService: AdminServiceContract = {
  async getKpis() {
    return apiFetch('/api/admin/kpis')
  },
  async listReferralsForReview() {
    return apiFetch('/api/admin/referrals/review')
  },
  async reviewReferral(referralId, input) {
    return apiFetch(`/api/admin/referrals/${referralId}/review`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    })
  },
}

export const realUserPortalService: UserPortalServiceContract = {
  async acceptReferralFromLink(input) {
    return apiFetch<ApiResult<UserCampaignAcceptance>>(`/api/ref/${input.referralLinkCode}/accept`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  async listAcceptedCampaigns(userId) {
    return apiFetch<ApiResult<Campaign[]>>(`/api/users/${userId}/accepted-campaigns`)
  },
}

/** Meilisearch hit shapes used by `GET /api/search` (ids always indexed as strings). */
export type SearchCampaignHit = { id: string; name?: string }
export type SearchReferralHit = { id: string; customerName?: string }
export type SearchBlogHit = { id: string; title?: string }

export type SearchResults = {
  referrals: SearchReferralHit[]
  campaigns: SearchCampaignHit[]
  blogs: SearchBlogHit[]
}

export async function searchGlobal(query: string) {
  return apiFetch<ApiResult<SearchResults>>(`/api/search?q=${encodeURIComponent(query)}`)
}

export async function searchByType(
  type: 'referrals' | 'campaigns' | 'blogs',
  query: string,
  limit = 20,
) {
  return apiFetch<ApiResult<{ hits: Array<Record<string, unknown>> }>>(
    `/api/search/${type}?q=${encodeURIComponent(query)}&limit=${limit}`,
  )
}

export type ProfilePayload = {
  id: string
  fullName: string
  email: string
  role: 'admin' | 'broker' | 'user' | 'support'
  bio: string
  avatarUrl: string
  phone: string
  preferredCurrency?: string
}

export async function getMyProfile() {
  return apiFetch<ApiResult<ProfilePayload>>('/api/profile/me')
}

export async function updateMyProfile(input: {
  fullName?: string
  bio?: string
  phone?: string
  preferredCurrency?: string
  /** Data URL or server URL; backend caps length. */
  avatarUrl?: string
}) {
  return apiFetch<ApiResult<ProfilePayload>>('/api/profile/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function uploadAvatar(file: File) {
  const fd = new FormData()
  fd.append('avatar', file)
  return apiUpload<ApiResult<{ avatarUrl: string }>>('/api/profile/me/avatar', fd)
}

export async function createReferral(input: {
  customerName: string
  phone: string
  campaignId: string
}) {
  return apiFetch<ApiResult<Referral>>('/api/referrals', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export type NotificationPayload = {
  _id: string
  userId: string
  title: string
  body: string
  category?: string
  link?: string
  isRead: boolean
  createdAt: string
}

export async function listMyNotifications() {
  return apiFetch<ApiResult<NotificationPayload[]>>('/api/notifications/me')
}

export async function createNotification(input: {
  userId: string
  title: string
  body: string
  category?: string
  link?: string
}) {
  return apiFetch<ApiResult<NotificationPayload>>('/api/notifications', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function markNotificationRead(notificationId: string) {
  return apiFetch<ApiResult<NotificationPayload>>(`/api/notifications/${notificationId}/read`, {
    method: 'PATCH',
  })
}

export async function markAllNotificationsRead() {
  return apiFetch<ApiResult<{ updatedCount: number }>>('/api/notifications/me/read-all', {
    method: 'PATCH',
  })
}

export async function listAdminUsers() {
  return apiFetch<
    ApiResult<Array<{ id: string; fullName: string; email: string; role: 'admin' | 'broker' | 'user' | 'support' }>>
  >('/api/admin/users')
}

export type BlogPayload = {
  _id: string
  id: string
  title: string
  slug: string
  body: string
  bodyHtml?: string
  excerpt: string
  tags: string[]
  status?: 'draft' | 'published'
  publishedAt?: string
  createdAt: string
}

export async function listBlogs() {
  return apiFetchPublic<ApiResult<BlogPayload[]>>('/api/blogs')
}

export async function getBlog(slugOrId: string) {
  return apiFetchPublic<ApiResult<BlogPayload>>(`/api/blogs/${slugOrId}`)
}

export async function createBlog(input: {
  title: string
  body: string
  excerpt?: string
  tags?: string[]
  status?: 'draft' | 'published'
}) {
  return apiFetch<ApiResult<BlogPayload>>('/api/blogs', { method: 'POST', body: JSON.stringify(input) })
}

export async function updateBlog(
  blogId: string,
  input: { title: string; body: string; excerpt?: string; tags?: string[]; status?: 'draft' | 'published' },
) {
  return apiFetch<ApiResult<BlogPayload>>(`/api/blogs/${blogId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export async function deleteBlog(blogId: string) {
  return apiFetch<ApiResult<{ id: string; deleted: true }>>(`/api/blogs/${blogId}`, { method: 'DELETE' })
}

export type PublicContactPayload = {
  email: string
  phone: string
  address: string
  googleMapUrl: string
  social: { facebook: string; instagram: string; linkedin: string }
}

export async function getPublicContact() {
  return apiFetchPublic<ApiResult<PublicContactPayload>>('/api/public/contact')
}

export type RewardLedgerEntry = {
  _id: string
  userId: string
  referralId?: string
  amount: number
  currency: string
  amountInBase: number
  baseCurrency: string
  fxRate: number
  entryType: 'credit' | 'debit'
  description: string
  createdAt: string
}

export async function getMyRewards() {
  return apiFetch<
    ApiResult<{
      balanceInBase: number
      baseCurrency: string
      creditTotal: number
      debitTotal: number
      entries: RewardLedgerEntry[]
    }>
  >('/api/rewards/me')
}

export async function getRewardsCashflow() {
  return apiFetch<
    ApiResult<{
      credit: number
      debit: number
      baseCurrency: string
      creditCount: number
      debitCount: number
    }>
  >('/api/rewards/cashflow')
}

export async function getFxRates(base = 'USD') {
  return apiFetchPublic<ApiResult<{ base: string; rates: Record<string, number> }>>(
    `/api/rewards/fx?base=${base}`,
  )
}

export type AiRecommendation = {
  id: string
  name: string
  description?: string
  totalRewardAmount: number
  rewardCurrency: string
  score?: number
}

export async function getRecommendations(userId: string) {
  return apiFetch<ApiResult<AiRecommendation[]>>(`/api/recommendations/${userId}`)
}

export async function aiChat(prompt: string, system?: string) {
  return apiFetch<ApiResult<{ provider: string; text: string }>>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ prompt, system }),
  })
}

export async function aiStatus() {
  return apiFetchPublic<ApiResult<{ provider: string }>>('/api/ai/status')
}

export async function requestRewardReport(format: 'pdf' | 'xlsx' = 'pdf') {
  return apiFetch<ApiResult<{ jobId: string }>>('/api/reports/rewards', {
    method: 'POST',
    body: JSON.stringify({ format }),
  })
}

export async function getReportJob(jobId: string) {
  return apiFetch<ApiResult<{ id: string; state: string; progress: unknown }>>(
    `/api/reports/jobs/${jobId}`,
  )
}

export function downloadReportUrl(jobId: string) {
  return `/api/reports/jobs/${jobId}/download`
}

export const realAiInsightsService: AiInsightsContract = {
  async getLeadScores(params?: { tier?: ScoreTier; limit?: number }) {
    const q = new URLSearchParams()
    if (params?.tier) q.set('tier', params.tier)
    if (params?.limit != null) q.set('limit', String(params.limit))
    const qs = q.toString()
    return apiFetch<ApiResult<LeadScoresPayload>>(
      `/api/ai/admin/lead-scores${qs ? `?${qs}` : ''}`,
    )
  },
  async getChurnScores(params?: { tier?: ScoreTier; limit?: number }) {
    const q = new URLSearchParams()
    if (params?.tier) q.set('tier', params.tier)
    if (params?.limit != null) q.set('limit', String(params.limit))
    const qs = q.toString()
    return apiFetch<ApiResult<ChurnScoresPayload>>(
      `/api/ai/admin/churn-scores${qs ? `?${qs}` : ''}`,
    )
  },
}
