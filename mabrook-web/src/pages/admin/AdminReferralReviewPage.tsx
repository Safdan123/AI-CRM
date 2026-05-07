import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

type ReferralStatus = 'Pending' | 'Verified' | 'Converted' | 'Rejected'

function statusClass(status: ReferralStatus) {
  if (status === 'Pending') return 'bg-amber-100 text-amber-800 border-amber-200'
  if (status === 'Verified') return 'bg-blue-100 text-blue-800 border-blue-200'
  if (status === 'Converted') return 'bg-green-100 text-green-800 border-green-200'
  return 'bg-red-100 text-red-800 border-red-200'
}

export function AdminReferralReviewPage() {
  const navigate = useNavigate()
  const { referralId = 'RF-1023' } = useParams<{ referralId: string }>()
  const [status, setStatus] = useState<ReferralStatus>('Pending')
  const [reviewNote, setReviewNote] = useState('')

  const timeline = useMemo(
    () => [
      { key: 'Submitted', done: true, date: '2026-05-01 10:22 AM' },
      {
        key: 'In Review',
        done: status !== 'Pending',
        date: status !== 'Pending' ? '2026-05-03 02:05 PM' : '--',
      },
      {
        key: 'Decision',
        done: status === 'Verified' || status === 'Converted' || status === 'Rejected',
        date:
          status === 'Verified' || status === 'Converted' || status === 'Rejected'
            ? '2026-05-04 11:35 AM'
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
          {status}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-line bg-white p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold text-brand">Referral Information</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-footer/60 p-3">
              <p className="text-xs text-brand/60">Customer Name</p>
              <p className="mt-1 font-semibold text-brand">Ali Raza</p>
            </div>
            <div className="rounded-xl bg-footer/60 p-3">
              <p className="text-xs text-brand/60">Customer Phone</p>
              <p className="mt-1 font-semibold text-brand">+92 301 2345678</p>
            </div>
            <div className="rounded-xl bg-footer/60 p-3">
              <p className="text-xs text-brand/60">Campaign</p>
              <p className="mt-1 font-semibold text-brand">Campaign 10</p>
            </div>
            <div className="rounded-xl bg-footer/60 p-3">
              <p className="text-xs text-brand/60">Broker</p>
              <p className="mt-1 font-semibold text-brand">Ahmad Stan</p>
            </div>
            <div className="rounded-xl bg-footer/60 p-3 md:col-span-2">
              <p className="text-xs text-brand/60">Referral Notes</p>
              <p className="mt-1 text-sm text-brand/80">
                Customer is interested in the investment package and requested a callback.
              </p>
            </div>
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
              onClick={() => setStatus('Verified')}
              className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white"
            >
              Approve / Verify
            </button>
            <button
              type="button"
              onClick={() => setStatus('Rejected')}
              className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-600 hover:text-white"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => setStatus('Pending')}
              className="rounded-full border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-500 hover:text-white"
            >
              Request Revision
            </button>
            <button
              type="button"
              onClick={() => setStatus('Converted')}
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
    </div>
  )
}
