import type {
  AdminServiceContract,
  AuthServiceContract,
  CampaignServiceContract,
  ReferralServiceContract,
  UserPortalServiceContract,
} from './contracts'
import type { ApiResult, Campaign, Referral, UserCampaignAcceptance } from './types'
import { apiFetch, setAccessToken } from './http'

export const realAuthService: AuthServiceContract = {
  async login(input) {
    const result = await apiFetch<ApiResult<{ user: { id: string; fullName: string; email: string; role: 'admin' | 'broker' | 'user' | 'support' }; accessToken: string }>>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    setAccessToken(result.data.accessToken)
    return result
  },
  async signup(input) {
    const result = await apiFetch<ApiResult<{ user: { id: string; fullName: string; email: string; role: 'admin' | 'broker' | 'user' | 'support' }; accessToken: string }>>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    setAccessToken(result.data.accessToken)
    return result
  },
  async me() {
    return apiFetch('/api/auth/me')
  },
  async logout() {
    setAccessToken(null)
    return apiFetch('/api/auth/logout', { method: 'POST' })
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

export async function searchGlobal(query: string) {
  return apiFetch<ApiResult<{ referrals: Referral[]; campaigns: Campaign[]; blogs: Array<{ id: string; title: string }> }>>(`/api/search?q=${encodeURIComponent(query)}`)
}

export type ProfilePayload = {
  id: string
  fullName: string
  email: string
  role: 'admin' | 'broker' | 'user' | 'support'
  bio: string
  avatarUrl: string
  phone: string
}

export async function getMyProfile() {
  return apiFetch<ApiResult<ProfilePayload>>('/api/profile/me')
}

export async function updateMyProfile(input: {
  fullName?: string
  bio?: string
  avatarUrl?: string
  phone?: string
}) {
  return apiFetch<ApiResult<ProfilePayload>>('/api/profile/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
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
  isRead: boolean
  createdAt: string
}

export async function listMyNotifications() {
  return apiFetch<ApiResult<NotificationPayload[]>>('/api/notifications/me')
}

export async function createNotification(input: { userId: string; title: string; body: string }) {
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
  return apiFetch<ApiResult<Array<{ id: string; fullName: string; email: string; role: 'admin' | 'broker' | 'user' | 'support' }>>>('/api/admin/users')
}

export type BlogPayload = {
  _id: string
  title: string
  body: string
  tags: string[]
  createdAt: string
}

export async function listBlogs() {
  return apiFetch<ApiResult<BlogPayload[]>>('/api/blogs')
}

export async function createBlog(input: { title: string; body: string; tags?: string[] }) {
  return apiFetch<ApiResult<BlogPayload>>('/api/blogs', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateBlog(blogId: string, input: { title: string; body: string; tags?: string[] }) {
  return apiFetch<ApiResult<BlogPayload>>(`/api/blogs/${blogId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export async function deleteBlog(blogId: string) {
  return apiFetch<ApiResult<{ id: string; deleted: true }>>(`/api/blogs/${blogId}`, {
    method: 'DELETE',
  })
}

export type PublicContactPayload = {
  email: string
  phone: string
  address: string
  googleMapUrl: string
  social: {
    facebook: string
    instagram: string
    linkedin: string
  }
}

export async function getPublicContact() {
  return apiFetch<ApiResult<PublicContactPayload>>('/api/public/contact')
}
