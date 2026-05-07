import type { AdminKpi, AuthUser, Campaign, Referral } from './types'

export const mockUser: AuthUser = {
  id: 'u-broker-1',
  fullName: 'Jack Morris',
  email: 'jack.morris@mabrook.app',
  role: 'broker',
}

export const mockCampaigns: Campaign[] = [
  {
    id: 'campaign-10',
    name: 'Campaign 10',
    startDate: '2026-05-05',
    endDate: '2026-06-05',
    totalRewardAmount: 250,
    linkCode: 'BROKER-10-XK9Z',
  },
  {
    id: 'campaign-9',
    name: 'Campaign 9',
    startDate: '2026-04-01',
    endDate: '2026-05-01',
    totalRewardAmount: 200,
    linkCode: 'BROKER-9-R7LQ',
  },
]

export const mockReferrals: Referral[] = Array.from({ length: 24 }, (_, i) => {
  const n = i + 1
  const status = (['pending', 'verified', 'converted', 'rejected'] as const)[i % 4]
  return {
    id: `RF-${1000 + n}`,
    brokerId: 'u-broker-1',
    customerName: `Customer ${n}`,
    phone: `+92 301 0000${String(n).padStart(3, '0')}`,
    campaignId: n % 2 === 0 ? 'campaign-10' : 'campaign-9',
    status,
    createdAt: `2026-05-${String((n % 28) + 1).padStart(2, '0')}`,
  }
})

export const mockAdminKpis: AdminKpi = {
  totalCustomers: 1245,
  activeBrokers: 186,
  totalReferrals: 3902,
  conversions: 1128,
  rewardsDistributed: 45300,
}
