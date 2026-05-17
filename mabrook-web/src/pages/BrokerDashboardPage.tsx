import { useEffect, useMemo, useState } from 'react'
import { CampaignReferralSection } from '../components/dashboard/CampaignReferralSection'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { DashboardHero } from '../components/dashboard/DashboardHero'
import { LeaderboardStatsCards } from '../components/dashboard/LeaderboardStatsCards'
import { LeaderboardTable } from '../components/dashboard/LeaderboardTable'
import { MyCampaignsSection } from '../components/dashboard/MyCampaignsSection'
import { Footer } from '../components/layout/Footer'
import { authService, campaignService } from '../lib/api'
import { getLeaderboard, getMyLeaderboardStats } from '../lib/api/realServices'
import type { Campaign } from '../lib/api/types'
import { localLeaderboardAvatar, type CampaignOption, type LeaderboardUser } from '../data/brokerDashboard.mock'

const PAGE_WRAP =
  'flex min-h-svh w-full max-w-full flex-col overflow-x-hidden bg-white'

export function BrokerDashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignId, setCampaignId] = useState('')
  const [leaderboardRows, setLeaderboardRows] = useState<LeaderboardUser[]>([])
  const [stats, setStats] = useState({
    totalPeople: 0,
    yourPosition: 0,
    yourReferrals: 0,
  })
  const [userName, setUserName] = useState('Broker')
  const [userEmail, setUserEmail] = useState('')
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    void authService.me().then((res) => {
      setUserName(res.data.fullName)
      setUserEmail(res.data.email)
    })
  }, [])

  useEffect(() => {
    void campaignService
      .list()
      .then((res) => {
        setCampaigns(res.data)
        if (res.data[0]?.id) setCampaignId(res.data[0].id)
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load campaigns.'))
  }, [])

  useEffect(() => {
    if (!campaignId) return
    void Promise.all([
      getLeaderboard({ period: 'all', metric: 'conversions', campaignId, limit: 50 }),
      getMyLeaderboardStats({ period: 'all', campaignId }),
    ])
      .then(([board, me]) => {
        setLeaderboardRows(
          board.data.rows.map((r) => ({
            id: r.brokerId,
            rank: r.rank,
            name: r.name,
            avatarUrl: localLeaderboardAvatar(r.rank - 1),
            rewards: `${r.score} conversions`,
          })),
        )
        setStats({
          totalPeople: me.data.totalBrokers || board.data.rows.length,
          yourPosition: me.data.position,
          yourReferrals: me.data.conversions,
        })
      })
      .catch(() => {
        setLeaderboardRows([])
      })
  }, [campaignId])

  const campaignOptions: CampaignOption[] = useMemo(
    () => campaigns.map((c) => ({ id: c.id, label: c.name })),
    [campaigns],
  )

  const selectedCampaign = useMemo(
    () => campaigns.find((c) => c.id === campaignId),
    [campaigns, campaignId],
  )

  const referralUrl = selectedCampaign
    ? `${window.location.origin}/login?ref=${encodeURIComponent(selectedCampaign.linkCode)}&campaign=${selectedCampaign.id}`
    : ''

  return (
    <div className={PAGE_WRAP}>
      <DashboardHeader userName={userName} userEmail={userEmail} />
      <main className="flex-1">
        {loadError ? (
          <p className="mx-auto max-w-[1440px] px-4 py-4 text-sm text-red-600 sm:px-8 lg:px-[120px]">
            {loadError}
          </p>
        ) : null}
        <DashboardHero />
        {campaignOptions.length > 0 ? (
          <>
            <MyCampaignsSection
              campaigns={campaignOptions}
              value={campaignId}
              onChange={setCampaignId}
            />
            <CampaignReferralSection
              campaignTitle={selectedCampaign?.name ?? 'Campaign'}
              referralUrl={referralUrl}
            />
            <LeaderboardStatsCards stats={stats} />
            <LeaderboardTable rows={leaderboardRows} />
          </>
        ) : (
          <p className="mx-auto max-w-[1440px] px-4 py-10 text-sm text-brand/70 sm:px-8 lg:px-[120px]">
            No campaigns yet. Create one from the Campaigns page.
          </p>
        )}
      </main>
      <Footer />
    </div>
  )
}
