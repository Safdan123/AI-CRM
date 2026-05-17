import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MarketingLayout } from '../components/layout/MarketingLayout'
import { Container } from '../components/ui/Container'
import { paths } from '../config/paths'
import { resolveBrokerInvitePublic } from '../lib/api/realServices'
import type { InviteResolvePayload } from '../lib/api/types'
import { setPendingInviteCode } from '../lib/referral/inviteStorage'

export function InviteLandingPage() {
  const navigate = useNavigate()
  const { inviteCode = '' } = useParams<{ inviteCode: string }>()
  const [payload, setPayload] = useState<InviteResolvePayload | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const code = inviteCode.trim().toUpperCase()
    if (!code) {
      setError('Invalid invite link.')
      setLoading(false)
      return
    }
    setPendingInviteCode(code)
    void resolveBrokerInvitePublic(code)
      .then((res) => setPayload(res.data))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Invite link is invalid or expired.')
      })
      .finally(() => setLoading(false))
  }, [inviteCode])

  const loginTo = `${paths.login}?from=invite`
  const signupTo = `${paths.signup}?from=invite`

  return (
    <MarketingLayout>
      <Container className="py-16 lg:py-24">
        {loading ? (
          <p className="text-brand/70">Loading invite...</p>
        ) : error ? (
          <div>
            <h1 className="text-3xl font-bold text-brand">Invite unavailable</h1>
            <p className="mt-4 text-brand/75">{error}</p>
            <button
              type="button"
              onClick={() => navigate(paths.home)}
              className="mt-6 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white"
            >
              Go home
            </button>
          </div>
        ) : payload ? (
          <div className="mx-auto max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand/55">
              Personal invite
            </p>
            <h1 className="mt-2 text-3xl font-bold text-brand md:text-4xl">{payload.campaign.name}</h1>
            <p className="mt-3 text-brand/75">
              {payload.broker.name} invited you to join this campaign on Mabrook Rewards.
            </p>
            {payload.campaign.description ? (
              <p className="mt-4 rounded-xl border border-line bg-footer/50 p-4 text-sm text-brand/80">
                {payload.campaign.description}
              </p>
            ) : null}
            <ul className="mt-5 space-y-2 text-sm text-brand/80">
              <li>
                Campaign period: {payload.campaign.startDate} → {payload.campaign.endDate}
              </li>
              <li>
                Reward on conversion: {payload.campaign.rewardPerConversion}{' '}
                {payload.campaign.rewardCurrency}
              </li>
              {payload.campaign.minInvestmentAmount > 0 ? (
                <li>Minimum investment: {payload.campaign.minInvestmentAmount}</li>
              ) : null}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to={signupTo}
                className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-brand px-6 text-sm font-semibold text-white"
              >
                Sign up to join
              </Link>
              <Link
                to={loginTo}
                className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-line px-6 text-sm font-semibold text-brand"
              >
                Log in
              </Link>
            </div>
            <p className="mt-4 text-xs text-brand/55">
              After you authenticate, we will register your interest with {payload.broker.name} and
              create your referral record for admin review before rewards are paid.
            </p>
          </div>
        ) : null}
      </Container>
    </MarketingLayout>
  )
}
