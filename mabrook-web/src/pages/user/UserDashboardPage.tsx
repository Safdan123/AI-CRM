import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { authService, userPortalService } from '../../lib/api'
import { paths } from '../../config/paths'
import type { Campaign } from '../../lib/api/types'

export function UserDashboardPage() {
  const [acceptedCampaigns, setAcceptedCampaigns] = useState<Campaign[]>([])

  useEffect(() => {
    void authService
      .me()
      .then((meRes) => userPortalService.listAcceptedCampaigns(meRes.data.id))
      .then((res) => {
        setAcceptedCampaigns(res.data)
      })
      .catch(() => {
        setAcceptedCampaigns([])
      })
  }, [])

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <h1 className="text-[34px] font-bold leading-tight text-brand max-sm:text-3xl">
        User Dashboard
      </h1>
      <p className="mt-2 text-sm text-brand/70">
        Track rewards, referral source activity, and your recent account updates.
      </p>

      <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Total Rewards', value: '$1,250' },
          { label: 'Successful Referrals', value: '18' },
          { label: 'Pending Rewards', value: '$320' },
        ].map((item) => (
          <article key={item.label} className="rounded-2xl border border-line bg-footer/55 p-4">
            <p className="text-xs text-brand/65">{item.label}</p>
            <p className="mt-1 text-2xl font-bold text-brand">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-white p-5">
        <h2 className="text-lg font-semibold text-brand">Campaigns Joined Via Referral Link</h2>
        <div className="mt-3 space-y-2">
          {acceptedCampaigns.length === 0 ? (
            <p className="text-sm text-brand/65">
              No campaigns yet. Open a broker invite link to join a campaign.
            </p>
          ) : null}
          {acceptedCampaigns.map((campaign) => (
            <Link
              key={campaign.id}
              to={paths.user.campaignDetail(campaign.id)}
              className="flex items-center justify-between rounded-lg bg-footer/60 px-3 py-2 text-sm transition hover:bg-footer"
            >
              <span className="font-medium text-brand">{campaign.name}</span>
              <span className="text-brand/70">
                {campaign.startDate} to {campaign.endDate}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
