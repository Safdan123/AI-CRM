import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { Footer } from '../components/layout/Footer'
import { paths } from '../config/paths'
import { localLeaderboardAvatar } from '../data/brokerDashboard.mock'
import { campaignService, referralService } from '../lib/api'
import type { Campaign, Referral } from '../lib/api/types'

type ReferralRow = {
  id: string
  number: number
  username: string
  avatarUrl: string
  referralCount: number
  successfulResponse: number
}

type SortKey = 'number' | 'username' | 'referralCount' | 'successfulResponse'
type SortDir = 'asc' | 'desc'

const PAGE_WRAP =
  'flex min-h-svh w-full max-w-full flex-col overflow-x-hidden bg-white'

const ROWS_PER_PAGE = 10
const TOTAL_ROWS = 245

function extractCampaignNumber(campaignId: string | undefined) {
  const raw = campaignId ?? '1'
  const match = raw.match(/\d+/)
  return Number(match?.[0] ?? 1)
}

function buildReferrals(seed: number): ReferralRow[] {
  return Array.from({ length: TOTAL_ROWS }, (_, i) => {
    const n = i + 1
    return {
      id: `ref-${seed}-${n}`,
      number: n,
      username: 'Ahmad Stan',
      avatarUrl: localLeaderboardAvatar(i + seed),
      referralCount: 77,
      successfulResponse: 70 + ((i + seed) % 2),
    }
  })
}

function sortLabel(active: boolean) {
  return `flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide ${
    active ? 'text-brand' : 'text-brand/60'
  }`.trim()
}

export function CampaignDetailsPage() {
  const navigate = useNavigate()
  const { campaignId } = useParams<{ campaignId: string }>()
  const campaignNumber = extractCampaignNumber(campaignId)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [campaignReferrals, setCampaignReferrals] = useState<Referral[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!campaignId) return
    void campaignService
      .getById(campaignId)
      .then((res) => setCampaign(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load campaign.'))
    void referralService
      .listByBroker({ pageSize: 200 })
      .then((res) => {
        setCampaignReferrals(res.data.items.filter((item) => item.campaignId === campaignId))
      })
      .catch(() => setCampaignReferrals([]))
  }, [campaignId])
  const campaignTitle = campaign?.name ?? `Campaign ${campaignNumber}`

  const startedDate = campaign?.startDate ?? '--'
  const endDate = campaign?.endDate ?? '--'
  const referralsCount = campaignReferrals.length
  const activeUsers = campaignReferrals.filter((r) => r.status !== 'rejected').length

  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: 'number',
    dir: 'asc',
  })

  const rows = useMemo(() => buildReferrals(campaignNumber), [campaignNumber])

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => row.username.toLowerCase().includes(q))
  }, [rows, query])

  const sortedRows = useMemo(() => {
    const list = [...filteredRows]
    list.sort((a, b) => {
      const av = a[sort.key]
      const bv = b[sort.key]
      if (typeof av === 'number' && typeof bv === 'number') {
        return sort.dir === 'asc' ? av - bv : bv - av
      }
      const result = String(av).localeCompare(String(bv))
      return sort.dir === 'asc' ? result : -result
    })
    return list
  }, [filteredRows, sort])

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / ROWS_PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pageStart = (safePage - 1) * ROWS_PER_PAGE
  const pageRows = sortedRows.slice(pageStart, pageStart + ROWS_PER_PAGE)

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (safePage <= 3) return [1, 2, 3, 4, totalPages]
    if (safePage >= totalPages - 2) {
      return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [1, safePage - 1, safePage, safePage + 1, totalPages]
  }, [safePage, totalPages])

  const onSort = (key: SortKey) => {
    setPage(1)
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' },
    )
  }

  const openReferralProfile = (referralRowId: string) => {
    if (!campaignId) return
    navigate(paths.campaignReferralDetail(campaignId, referralRowId))
  }

  return (
    <div className={PAGE_WRAP}>
      <DashboardHeader />
      <main className="flex-1 bg-white">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-8 lg:px-[120px]">
          <p className="text-xs text-brand/55">Home / Campaigns / {campaignTitle}</p>
        </section>

        <section className="border-t border-line pb-16 pt-7">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-8 lg:px-[120px]">
            <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
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
                <h1 className="text-2xl font-bold text-brand">{campaignTitle}</h1>
              </div>
              <button
                type="button"
                onClick={() => console.log('End campaign (mock):', campaignId)}
                className="h-10 rounded-full border border-line bg-brand px-5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                End Campaign
              </button>
            </div>

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Campaign Started', value: startedDate },
                { label: 'Campaign Ends', value: endDate },
                { label: 'Number of Referrals', value: String(referralsCount) },
                { label: 'Active Users', value: String(activeUsers) },
              ].map((item) => (
                <article
                  key={item.label}
                  className="rounded-2xl border border-line bg-footer/55 p-4"
                >
                  <p className="text-xs text-brand/70">{item.label}</p>
                  <p className="mt-1.5 text-2xl font-bold text-brand">{item.value}</p>
                </article>
              ))}
            </section>
            {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

            <section className="mt-7">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-[24px] font-bold text-brand">Referrals Count</h2>
                <label className="relative block sm:w-[210px]">
                  <span className="sr-only">Search referrals</span>
                  <svg
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand/45"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <path d="m21 21-4.35-4.35m1.35-4.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
                  </svg>
                  <input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setPage(1)
                    }}
                    placeholder="Search"
                    className="h-10 w-full rounded-full border border-line bg-white pl-10 pr-4 text-sm text-brand-ink outline-none transition focus:border-brand"
                  />
                </label>
              </div>

              <div className="overflow-x-auto rounded-xl border border-line bg-white">
                <table className="w-full min-w-[850px] border-collapse text-left">
                  <thead className="border-b border-line bg-white">
                    <tr className="text-[11px] uppercase tracking-wide text-brand/70">
                      <th className="px-4 py-3 font-semibold sm:px-6">
                        <button type="button" onClick={() => onSort('number')} className={sortLabel(sort.key === 'number')}>
                          No.
                          <span>{sort.key === 'number' && sort.dir === 'desc' ? '↓' : '↑'}</span>
                        </button>
                      </th>
                      <th className="px-4 py-3 font-semibold sm:px-6">
                        <button type="button" onClick={() => onSort('username')} className={sortLabel(sort.key === 'username')}>
                          Username
                          <span>{sort.key === 'username' && sort.dir === 'desc' ? '↓' : '↑'}</span>
                        </button>
                      </th>
                      <th className="px-4 py-3 font-semibold sm:px-6">
                        <button type="button" onClick={() => onSort('referralCount')} className={sortLabel(sort.key === 'referralCount')}>
                          Referral Count
                          <span>{sort.key === 'referralCount' && sort.dir === 'desc' ? '↓' : '↑'}</span>
                        </button>
                      </th>
                      <th className="px-4 py-3 font-semibold sm:px-6">
                        <button type="button" onClick={() => onSort('successfulResponse')} className={sortLabel(sort.key === 'successfulResponse')}>
                          Successful Response
                          <span>
                            {sort.key === 'successfulResponse' && sort.dir === 'desc' ? '↓' : '↑'}
                          </span>
                        </button>
                      </th>
                      <th className="px-4 py-3 font-semibold sm:px-6">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-line text-sm text-brand transition hover:bg-footer/70 last:border-b-0"
                      >
                        <td className="px-4 py-4 sm:px-6">{row.number}</td>
                        <td className="px-4 py-4 sm:px-6">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={row.avatarUrl}
                              alt=""
                              className="size-6 rounded-full border border-line object-cover"
                              width={24}
                              height={24}
                            />
                            <button
                              type="button"
                              onClick={() => openReferralProfile(row.id)}
                              className="font-semibold text-brand transition hover:text-brand/70 hover:underline"
                            >
                              {row.username}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4 sm:px-6">{row.referralCount}</td>
                        <td className="px-4 py-4 sm:px-6">{row.successfulResponse}</td>
                        <td className="px-4 py-4 sm:px-6">
                          <button
                            type="button"
                            onClick={() => openReferralProfile(row.id)}
                            className="h-8 rounded-full border border-line px-4 text-xs font-semibold text-brand transition hover:border-brand hover:bg-brand hover:text-white"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-col gap-4 text-xs text-brand/70 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <span>Rows per page</span>
                  <div className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2 py-1 text-[11px] font-medium text-brand">
                    <span>10</span>
                    <svg
                      className="size-3 text-brand/60"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <span>
                    {pageStart + 1}-{Math.min(pageStart + ROWS_PER_PAGE, sortedRows.length)} of{' '}
                    {sortedRows.length}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setPage(1)}
                    className="rounded-md border border-line px-2 py-1 text-brand transition hover:bg-footer disabled:opacity-40"
                  >
                    ≪
                  </button>
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-md border border-line px-2 py-1 text-brand transition hover:bg-footer disabled:opacity-40"
                  >
                    ‹
                  </button>
                  {pageNumbers.map((n, idx) => (
                    <button
                      key={`${n}-${idx}`}
                      type="button"
                      onClick={() => setPage(n)}
                      className={`h-7 min-w-7 rounded-md border px-2 text-[11px] font-semibold ${
                        n === safePage
                          ? 'border-brand bg-brand text-white'
                          : 'border-line bg-white text-brand hover:bg-footer'
                      }`}
                    >
                      {idx > 0 && n - pageNumbers[idx - 1] > 1 ? `… ${n}` : n}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-md border border-line px-2 py-1 text-brand transition hover:bg-footer disabled:opacity-40"
                  >
                    ›
                  </button>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage(totalPages)}
                    className="rounded-md border border-line px-2 py-1 text-brand transition hover:bg-footer disabled:opacity-40"
                  >
                    ≫
                  </button>
                </div>
              </div>

              <p className="mt-4 text-xs text-brand/50">
                The date &amp; timestamp are displayed according to the time zone of your
                browser.
              </p>
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
