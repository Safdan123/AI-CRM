import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { Footer } from '../components/layout/Footer'
import { paths } from '../config/paths'
import { referralService } from '../lib/api'
import type { ReferralStatus } from '../lib/api/types'

type ReferralRow = {
  id: string
  customerName: string
  phone: string
  campaignId: string
  date: string
  status: ReferralStatus
}

const PAGE_WRAP =
  'flex min-h-svh w-full max-w-full flex-col overflow-x-hidden bg-white'

function statusClass(status: ReferralStatus) {
  if (status === 'pending') return 'bg-amber-100 text-amber-800 border-amber-200'
  if (status === 'verified') return 'bg-blue-100 text-blue-800 border-blue-200'
  if (status === 'converted') return 'bg-green-100 text-green-800 border-green-200'
  return 'bg-red-100 text-red-800 border-red-200'
}

export function TrackReferralsPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<ReferralRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ReferralStatus>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    void referralService
      .listByBroker({
        query: query || undefined,
        status: statusFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      .then((res) => {
        if (!alive) return
        setRows(
          res.data.items.map((item) => ({
            id: item.id,
            customerName: item.customerName,
            phone: item.phone,
            campaignId: item.campaignId,
            date: item.createdAt,
            status: item.status,
          })),
        )
      })
      .catch((err) => {
        if (!alive) return
        setError(err instanceof Error ? err.message : 'Failed to load referrals.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [query, statusFilter, startDate, endDate])

  const filteredRows = useMemo(() => {
    return rows
  }, [rows])

  return (
    <div className={PAGE_WRAP}>
      <DashboardHeader />
      <main className="flex-1 bg-white">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-8 lg:px-[120px]">
          <p className="text-xs text-brand/55">Home / Referrals</p>
        </section>
        <section className="border-t border-line pb-16 pt-7">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-8 lg:px-[120px]">
            <h1 className="mb-5 text-[34px] font-bold leading-tight text-brand max-sm:text-3xl">
              Track Referrals
            </h1>

            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-5">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 rounded-full border border-line px-4 text-sm outline-none focus:border-brand md:col-span-2"
                placeholder="Search by ID / name / phone"
              />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'all' | ReferralStatus)
                }
                className="h-10 rounded-full border border-line px-4 text-sm outline-none focus:border-brand"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="converted">Converted</option>
                <option value="rejected">Rejected</option>
              </select>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 rounded-full border border-line px-4 text-sm outline-none focus:border-brand"
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 w-full rounded-full border border-line px-4 text-sm outline-none focus:border-brand"
                />
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setStatusFilter('all')
                    setStartDate('')
                    setEndDate('')
                  }}
                  className="h-10 rounded-full border border-line px-4 text-sm font-semibold text-brand transition hover:border-brand hover:bg-brand hover:text-white"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-line bg-white">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead className="border-b border-line text-[11px] uppercase tracking-wide text-brand/70">
                  <tr>
                    <th className="px-4 py-3">Referral ID</th>
                    <th className="px-4 py-3">Customer Name</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Campaign</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="border-b border-line hover:bg-footer/60">
                      <td className="px-4 py-3">{row.id}</td>
                      <td className="px-4 py-3 font-semibold">{row.customerName}</td>
                      <td className="px-4 py-3">{row.phone}</td>
                      <td className="px-4 py-3">{row.campaignId}</td>
                      <td className="px-4 py-3">{row.date}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(row.status)}`}
                        >
                          {row.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(paths.brokerReferralDetail(row.id))}
                            className="rounded-full border border-line px-3 py-1 text-xs font-semibold"
                          >
                            View Details
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(paths.brokerReferralDetail(row.id))}
                            className="rounded-full border border-line px-3 py-1 text-xs font-semibold"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {loading ? <p className="mt-3 text-sm text-brand/70">Loading referrals...</p> : null}
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
