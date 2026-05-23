import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { campaignService } from '../../lib/api'
import { paths } from '../../config/paths'
import type { Campaign } from '../../lib/api/types'

export function UserCampaignDetailPage() {
  const { campaignId = '' } = useParams<{ campaignId: string }>()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!campaignId) return
    void campaignService
      .getById(campaignId)
      .then((res) => setCampaign(res.data))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load campaign.')
      })
      .finally(() => setLoading(false))
  }, [campaignId])

  return (
    <div className="mx-auto w-full max-w-[900px]">
      <Link to={paths.user.dashboard} className="text-sm text-brand underline">
        ← Back to dashboard
      </Link>
      <h1 className="mt-4 text-[34px] font-bold leading-tight text-brand max-sm:text-3xl">
        {campaign?.name ?? 'Campaign'}
      </h1>
      {loading ? <p className="mt-4 text-sm text-brand/70">Loading...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {campaign ? (
        <>
          <p className="mt-2 text-sm text-brand/75">
            You joined this campaign through a broker invite. Your interest is recorded; an admin
            will verify and convert your referral when investment requirements are met.
          </p>
          <section className="mt-6 grid gap-3 sm:grid-cols-2">
            <article className="rounded-xl border border-line bg-footer/55 p-4">
              <p className="text-xs text-brand/65">Period</p>
              <p className="mt-1 font-semibold text-brand">
                {campaign.startDate} → {campaign.endDate}
              </p>
            </article>
            <article className="rounded-xl border border-line bg-footer/55 p-4">
              <p className="text-xs text-brand/65">Reward on conversion</p>
              <p className="mt-1 font-semibold text-brand">
                {campaign.rewardPerConversion ?? campaign.totalRewardAmount} {campaign.rewardCurrency}
              </p>
            </article>
            {(campaign.minInvestmentAmount ?? 0) > 0 ? (
              <article className="rounded-xl border border-line bg-footer/55 p-4 sm:col-span-2">
                <p className="text-xs text-brand/65">Minimum investment</p>
                <p className="mt-1 font-semibold text-brand">{campaign.minInvestmentAmount}</p>
              </article>
            ) : null}
          </section>
          <section className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
            <p className="font-semibold">Next steps</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Complete your profile phone number under account settings (helps admin verify you).</li>
              <li>Contact your broker or support to complete investment off-platform for this MVP.</li>
              <li>After admin converts your referral, your broker earns rewards and you may see updates here.</li>
            </ul>
          </section>
        </>
      ) : null}
    </div>
  )
}
