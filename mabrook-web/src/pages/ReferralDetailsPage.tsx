import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { Footer } from '../components/layout/Footer'
import { referralService } from '../lib/api'
import type { Referral } from '../lib/api/types'

const PAGE_WRAP =
  'flex min-h-svh w-full max-w-full flex-col overflow-x-hidden bg-white'

export function ReferralDetailsPage() {
  const navigate = useNavigate()
  const { referralId = '' } = useParams<{ referralId: string }>()
  const [referral, setReferral] = useState<Referral | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!referralId) return
    setLoading(true)
    setError('')
    void referralService
      .getById(referralId)
      .then((res) => {
        setReferral(res.data)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load referral.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [referralId])

  const timeline = useMemo(
    () => [
      { step: 'Submitted', active: true },
      {
        step: 'Verified',
        active:
          referral?.status === 'verified' || referral?.status === 'converted',
      },
      { step: 'Converted', active: referral?.status === 'converted' },
    ],
    [referral?.status],
  )

  return (
    <div className={PAGE_WRAP}>
      <DashboardHeader />
      <main className="flex-1 bg-white">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-8 lg:px-[120px]">
          <p className="text-xs text-brand/55">Home / Referrals / {referralId || '...'}</p>
        </section>
        <section className="border-t border-line pb-16 pt-7">
          <div className="mx-auto w-full max-w-[1080px] px-4 sm:px-8">
            <div className="mb-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex size-9 items-center justify-center rounded-full border border-line text-brand transition hover:border-brand hover:bg-brand hover:text-white"
                aria-label="Go back"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden>
                  <path
                    d="m15 18-6-6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <h1 className="text-[34px] font-bold leading-tight text-brand max-sm:text-3xl">
                Referral Details
              </h1>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <section className="rounded-2xl border border-line bg-white p-5 lg:col-span-2">
                <h2 className="text-lg font-semibold text-brand">Referral Information</h2>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-footer/60 p-3">
                    <p className="text-xs text-brand/60">Referral ID</p>
                    <p className="mt-1 font-semibold text-brand">{referral?.id ?? referralId}</p>
                  </div>
                  <div className="rounded-xl bg-footer/60 p-3">
                    <p className="text-xs text-brand/60">Customer Name</p>
                    <p className="mt-1 font-semibold text-brand">{referral?.customerName ?? '--'}</p>
                  </div>
                  <div className="rounded-xl bg-footer/60 p-3">
                    <p className="text-xs text-brand/60">Phone</p>
                    <p className="mt-1 font-semibold text-brand">{referral?.phone ?? '--'}</p>
                  </div>
                  <div className="rounded-xl bg-footer/60 p-3">
                    <p className="text-xs text-brand/60">Campaign</p>
                    <p className="mt-1 font-semibold text-brand">{referral?.campaignId ?? '--'}</p>
                  </div>
                  <div className="rounded-xl bg-footer/60 p-3 md:col-span-2">
                    <p className="text-xs text-brand/60">Referral Notes</p>
                    <p className="mt-1 text-sm text-brand/80">
                      Status: {referral?.status ?? '--'}.
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-line bg-white p-5">
                <h2 className="text-lg font-semibold text-brand">Status Timeline</h2>
                <ul className="mt-4 space-y-3">
                  {timeline.map((item) => (
                    <li key={item.step} className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 inline-flex size-4 shrink-0 rounded-full border ${
                          item.active
                            ? 'border-green-500 bg-green-500'
                            : 'border-line bg-white'
                        }`}
                      />
                      <div>
                        <p className="text-sm font-semibold text-brand">{item.step}</p>
                        <p className="text-xs text-brand/60">{item.active ? 'Done' : '--'}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
            {loading ? <p className="mt-4 text-sm text-brand/70">Loading referral details...</p> : null}
            {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
