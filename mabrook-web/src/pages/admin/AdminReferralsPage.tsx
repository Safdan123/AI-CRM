import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { paths } from '../../config/paths'
import { adminService } from '../../lib/api'
import type { Referral } from '../../lib/api/types'

export function AdminReferralsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Referral[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    void adminService
      .listReferralsForReview()
      .then((res) => setItems(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load referrals.'))
  }, [])

  async function review(id: string, status: 'verified' | 'rejected') {
    try {
      await adminService.reviewReferral(id, {
        status,
        reviewNote: `Updated from list view: ${status}`,
      })
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update referral.')
    }
  }

  const statusClass: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    verified: 'bg-blue-100 text-blue-800 border-blue-200',
    converted: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
  }

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <h1 className="mb-4 text-[30px] font-bold text-brand">
        Referral Verification & Approval
      </h1>
      <p className="mb-5 text-sm text-brand/70">
        Review customer, campaign, and broker information before approval.
      </p>

      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="border-b border-line text-[11px] uppercase tracking-wide text-brand/70">
            <tr>
              <th className="px-4 py-3">Referral ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Broker</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="cursor-pointer border-b border-line hover:bg-footer/60"
                onClick={() => navigate(paths.admin.referralReview(item.id))}
              >
                <td className="px-4 py-3">{item.id}</td>
                <td className="px-4 py-3 font-semibold">{item.customerName}</td>
                <td className="px-4 py-3">{item.campaignId}</td>
                <td className="px-4 py-3">{item.brokerId}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass[item.status]}`}
                  >
                    {item.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(paths.admin.referralReview(item.id))
                      }}
                      className="rounded-full border border-line px-3 py-1 text-xs font-semibold"
                    >
                      Review
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        void review(item.id, 'verified')
                      }}
                      className="rounded-full border border-green-200 px-3 py-1 text-xs font-semibold text-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        void review(item.id, 'rejected')
                      }}
                      className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
