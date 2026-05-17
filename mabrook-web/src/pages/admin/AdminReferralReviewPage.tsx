import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminService, referralService } from '../../lib/api'
import type { Referral, ReferralStatus } from '../../lib/api/types'

function statusClass(status: ReferralStatus) {
  if (status === 'pending') return 'bg-amber-100 text-amber-800 border-amber-200'
  if (status === 'verified') return 'bg-blue-100 text-blue-800 border-blue-200'
  if (status === 'converted') return 'bg-green-100 text-green-800 border-green-200'
  return 'bg-red-100 text-red-800 border-red-200'
}

export function AdminReferralReviewPage() {
  const navigate = useNavigate()
  const { referralId = '' } = useParams<{ referralId: string }>()
  const [status, setStatus] = useState<ReferralStatus>('pending')
  const [reviewNote, setReviewNote] = useState('')
  const [investmentAmount, setInvestmentAmount] = useState('')
  const [referral, setReferral] = useState<Referral | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!referralId) return
    void referralService
      .getById(referralId)
      .then((res) => {
        setReferral(res.data)
        setStatus(res.data.status)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load referral.'))
  }, [referralId])

  async function applyStatus(nextStatus: ReferralStatus) {
    if (!referralId) return
    setError('')
    try {
      const payload: {
        status: ReferralStatus
        reviewNote?: string
        investmentAmount?: number
      } = { status: nextStatus, reviewNote }
      if (nextStatus === 'converted' && investmentAmount.trim()) {
        payload.investmentAmount = Number(investmentAmount.replace(/[$,\s]/g, ''))
      }
      await adminService.reviewReferral(referralId, payload)
      setStatus(nextStatus)
      const refreshed = await referralService.getById(referralId)
      setReferral(refreshed.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update referral.')
    }
  }

  const timeline = useMemo(
    () => [
      { key: 'Submitted', done: true, date: '2026-05-01 10:22 AM' },
      {
        key: 'In Review',
        done: status !== 'pending',
        date: status !== 'pending' ? 'Reviewed' : '--',
      },
      {
        key: 'Decision',
        done: status === 'verified' || status === 'converted' || status === 'rejected',
        date:
          status === 'verified' || status === 'converted' || status === 'rejected'
            ? 'Completed'
            : '--',
      },
    ],
    [status],
  )

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex size-9 items-center justify-center rounded-full border border-line text-brand transition hover:border-brand hover:bg-brand hover:text-white"
            aria-label="Back"
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
          <h1 className="text-[30px] font-bold text-brand">Referral Review: {referralId}</h1>
        </div>
        <span
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${statusClass(status)}`}
        >
          {status.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-line bg-white p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold text-brand">Referral Information</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-footer/60 p-3">
              <p className="text-xs text-brand/60">Customer Name</p>
              <p className="mt-1 font-semibold text-brand">{referral?.customerName ?? '--'}</p>
            </div>
            <div className="rounded-xl bg-footer/60 p-3">
              <p className="text-xs text-brand/60">Customer Phone</p>
              <p className="mt-1 font-semibold text-brand">{referral?.phone ?? '--'}</p>
            </div>
            <div className="rounded-xl bg-footer/60 p-3">
              <p className="text-xs text-brand/60">Campaign</p>
              <p className="mt-1 font-semibold text-brand">{referral?.campaignId ?? '--'}</p>
            </div>
            <div className="rounded-xl bg-footer/60 p-3">
              <p className="text-xs text-brand/60">Broker</p>
              <p className="mt-1 font-semibold text-brand">{referral?.brokerId ?? '--'}</p>
            </div>
            <div className="rounded-xl bg-footer/60 p-3 md:col-span-2">
              <p className="text-xs text-brand/60">Referral Notes</p>
              <p className="mt-1 text-sm text-brand/80">{referral?.notes ?? '—'}</p>
            </div>
            {referral?.rewardAmount != null ? (
              <div className="rounded-xl bg-green-50 p-3 md:col-span-2">
                <p className="text-xs text-brand/60">Reward credited</p>
                <p className="mt-1 font-semibold text-brand">
                  {referral.rewardAmount} {referral.rewardCurrency}
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-brand" htmlFor="investment-amount">
              Investment amount (for conversion)
            </label>
            <input
              id="investment-amount"
              type="text"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(e.target.value)}
              className="mb-2 h-10 w-full max-w-xs rounded-md border border-line px-3 text-sm outline-none focus:border-brand"
              placeholder="e.g. 5000"
            />
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-brand" htmlFor="review-note">
              Admin Review Note
            </label>
            <textarea
              id="review-note"
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              className="h-28 w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand"
              placeholder="Add review comments, reasons, or instructions..."
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void applyStatus('verified')}
              className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white"
            >
              Approve / Verify
            </button>
            <button
              type="button"
              onClick={() => void applyStatus('rejected')}
              className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-600 hover:text-white"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => void applyStatus('pending')}
              className="rounded-full border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-500 hover:text-white"
            >
              Request Revision
            </button>
            <button
              type="button"
              onClick={() => void applyStatus('converted')}
              className="rounded-full border border-green-200 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-600 hover:text-white"
            >
              Mark Converted
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-lg font-semibold text-brand">Status Timeline</h2>
          <ul className="mt-4 space-y-3">
            {timeline.map((item) => (
              <li key={item.key} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 inline-flex size-4 shrink-0 rounded-full border ${
                    item.done ? 'border-green-500 bg-green-500' : 'border-line bg-white'
                  }`}
                />
                <div>
                  <p className="text-sm font-semibold text-brand">{item.key}</p>
                  <p className="text-xs text-brand/60">{item.date}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-xl bg-footer/60 p-3">
            <p className="text-xs text-brand/60">Attached Documents</p>
            <p className="mt-1 text-sm font-medium text-brand">
              CNIC-front.jpg, salary-slip.pdf
            </p>
          </div>
        </section>
      </div>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
