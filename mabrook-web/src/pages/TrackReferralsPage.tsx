import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { Footer } from '../components/layout/Footer'
import { paths } from '../config/paths'

type ReferralStatus = 'Pending' | 'Verified' | 'Converted' | 'Rejected'

type ReferralRow = {
  id: string
  customerName: string
  phone: string
  campaign: string
  date: string
  status: ReferralStatus
}

const PAGE_WRAP =
  'flex min-h-svh w-full max-w-full flex-col overflow-x-hidden bg-white'

const seedRows: ReferralRow[] = [
  { id: 'RF-1023', customerName: 'Ali Raza', phone: '+92 301 0000001', campaign: 'Campaign 10', date: '2026-05-02', status: 'Pending' },
  { id: 'RF-1022', customerName: 'Sara Ahmed', phone: '+92 301 0000002', campaign: 'Campaign 9', date: '2026-05-01', status: 'Verified' },
  { id: 'RF-1021', customerName: 'Hamza Ali', phone: '+92 301 0000003', campaign: 'Campaign 8', date: '2026-04-29', status: 'Converted' },
  { id: 'RF-1020', customerName: 'Amna Khan', phone: '+92 301 0000004', campaign: 'Campaign 7', date: '2026-04-28', status: 'Rejected' },
  { id: 'RF-1019', customerName: 'Umer Farooq', phone: '+92 301 0000005', campaign: 'Campaign 10', date: '2026-04-27', status: 'Pending' },
]

function statusClass(status: ReferralStatus) {
  if (status === 'Pending') return 'bg-amber-100 text-amber-800 border-amber-200'
  if (status === 'Verified') return 'bg-blue-100 text-blue-800 border-blue-200'
  if (status === 'Converted') return 'bg-green-100 text-green-800 border-green-200'
  return 'bg-red-100 text-red-800 border-red-200'
}

export function TrackReferralsPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState(seedRows)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | ReferralStatus>('All')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const matchesQuery =
        !query ||
        r.id.toLowerCase().includes(query.toLowerCase()) ||
        r.customerName.toLowerCase().includes(query.toLowerCase()) ||
        r.phone.includes(query)
      const matchesStatus = statusFilter === 'All' || r.status === statusFilter
      const matchesStart = !startDate || r.date >= startDate
      const matchesEnd = !endDate || r.date <= endDate
      return matchesQuery && matchesStatus && matchesStart && matchesEnd
    })
  }, [rows, query, statusFilter, startDate, endDate])

  const onCancelReferral = (id: string) => {
    setRows((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'Rejected' as ReferralStatus } : item,
      ),
    )
  }

  const onEditReferral = (id: string) => {
    console.log('Edit referral (mock):', id)
  }

  return (
    <div className={PAGE_WRAP}>
      <DashboardHeader userName="Jack Morris" userEmail="jack.morris@mabrook.app" />
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
                  setStatusFilter(e.target.value as 'All' | ReferralStatus)
                }
                className="h-10 rounded-full border border-line px-4 text-sm outline-none focus:border-brand"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Verified">Verified</option>
                <option value="Converted">Converted</option>
                <option value="Rejected">Rejected</option>
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
                    setStatusFilter('All')
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
                      <td className="px-4 py-3">{row.campaign}</td>
                      <td className="px-4 py-3">{row.date}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(row.status)}`}
                        >
                          {row.status}
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
                            onClick={() => onEditReferral(row.id)}
                            className="rounded-full border border-line px-3 py-1 text-xs font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onCancelReferral(row.id)}
                            className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
