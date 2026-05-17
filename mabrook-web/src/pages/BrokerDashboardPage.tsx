import { useEffect, useMemo, useState } from 'react'
import { CampaignReferralSection } from '../components/dashboard/CampaignReferralSection'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { DashboardHero } from '../components/dashboard/DashboardHero'
import { LeaderboardStatsCards } from '../components/dashboard/LeaderboardStatsCards'
import { LeaderboardTable } from '../components/dashboard/LeaderboardTable'
import { MyCampaignsSection } from '../components/dashboard/MyCampaignsSection'
import { Footer } from '../components/layout/Footer'
import { campaignService, referralService } from '../lib/api'
import { getLeaderboard, getMyLeaderboardStats, getOrCreateBrokerInvite } from '../lib/api/realServices'
import { getTokenPayload } from '../lib/api/http'
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
  const [loadError, setLoadError] = useState('')
  const [leaderboardError, setLeaderboardError] = useState('')
  const [campaignReferralCounts, setCampaignReferralCounts] = useState({
    total: 0,
    converted: 0,
  })
  const [brokerInviteUrl, setBrokerInviteUrl] = useState('')
  const [inviteError, setInviteError] = useState('')

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
    let alive = true
    setLeaderboardError('')

    async function loadLeaderboard() {
      try {
        const [board, me] = await Promise.all([
          getLeaderboard({ period: 'all', metric: 'conversions', campaignId, limit: 50 }),
          getMyLeaderboardStats({ period: 'all', campaignId }),
        ])
        if (!alive) return
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
      } catch (err) {
        if (!alive) return
        const message =
          err instanceof Error ? err.message : 'Leaderboard could not be loaded.'
        setLeaderboardError(message)
        setLeaderboardRows([])

        try {
          const res = await referralService.listByBroker({ pageSize: 200 })
          if (!alive) return
          const forCampaign = res.data.items.filter((r) => r.campaignId === campaignId)
          const conversions = forCampaign.filter((r) => r.status === 'converted').length
          const payload = getTokenPayload()
          const brokerName = payload?.email?.split('@')[0] ?? 'You'
          setStats({
            totalPeople: conversions > 0 ? 1 : 0,
            yourPosition: conversions > 0 ? 1 : 0,
            yourReferrals: conversions,
          })
          if (conversions > 0 && payload?.userId) {
            setLeaderboardRows([
              {
                id: payload.userId,
                rank: 1,
                name: brokerName,
                avatarUrl: localLeaderboardAvatar(0),
                rewards: `${conversions} conversion${conversions === 1 ? '' : 's'}`,
              },
            ])
            setLeaderboardError(
              `${message} Showing your conversions from referrals; restart referral-service for full leaderboard.`,
            )
          }
        } catch {
          if (!alive) return
          setStats({ totalPeople: 0, yourPosition: 0, yourReferrals: 0 })
        }
      }
    }

    void loadLeaderboard()
    return () => {
      alive = false
    }
  }, [campaignId])

  useEffect(() => {
    if (!campaignId) return
    let alive = true
    void referralService
      .listByBroker({ pageSize: 200 })
      .then((res) => {
        if (!alive) return
        const forCampaign = res.data.items.filter((r) => r.campaignId === campaignId)
        setCampaignReferralCounts({
          total: forCampaign.length,
          converted: forCampaign.filter((r) => r.status === 'converted').length,
        })
      })
      .catch(() => {
        if (!alive) return
        setCampaignReferralCounts({ total: 0, converted: 0 })
      })
    return () => {
      alive = false
    }
  }, [campaignId])

  useEffect(() => {
    if (!campaignId) return
    let alive = true
    setInviteError('')
    void getOrCreateBrokerInvite(campaignId)
      .then((res) => {
        if (!alive) return
        setBrokerInviteUrl(res.data.inviteUrl)
      })
      .catch((err) => {
        if (!alive) return
        setBrokerInviteUrl('')
        setInviteError(err instanceof Error ? err.message : 'Could not load invite link.')
      })
    return () => {
      alive = false
    }
  }, [campaignId])

  const campaignOptions: CampaignOption[] = useMemo(
    () => campaigns.map((c) => ({ id: c.id, label: c.name })),
    [campaigns],
  )

  const selectedCampaign = useMemo(
    () => campaigns.find((c) => c.id === campaignId),
    [campaigns, campaignId],
  )

  return (
    <div className={PAGE_WRAP}>
      <DashboardHeader />
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
            {inviteError ? (
              <p className="mx-auto max-w-[1440px] px-4 pb-2 text-sm text-red-600 sm:px-8 lg:px-[120px]">
                {inviteError}
              </p>
            ) : null}
            <CampaignReferralSection
              campaignTitle={selectedCampaign?.name ?? 'Campaign'}
              referralUrl={brokerInviteUrl}
              referralCount={campaignReferralCounts.total}
              convertedCount={campaignReferralCounts.converted}
            />
            {leaderboardError ? (
              <p className="mx-auto max-w-[1440px] px-4 pb-2 text-sm text-amber-800 sm:px-8 lg:px-[120px]">
                {leaderboardError}
              </p>
            ) : null}
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
