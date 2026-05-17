import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { Footer } from '../components/layout/Footer'
import { localLeaderboardAvatar } from '../data/brokerDashboard.mock'

type CampaignRow = {
  id: string
  number: number
  campaignName: string
  totalReferrals: number
  successfulResponses: number
  rewardEarned: string
  position: number
}

type SortKey =
  | 'number'
  | 'campaignName'
  | 'totalReferrals'
  | 'successfulResponses'
  | 'rewardEarned'
  | 'position'
type SortDir = 'asc' | 'desc'

const PAGE_WRAP =
  'flex min-h-svh w-full max-w-full flex-col overflow-x-hidden bg-white'

const ROWS_PER_PAGE = 10
const TOTAL_ROWS = 245

function numericFromText(v: string | undefined, fallback: number) {
  const n = Number((v ?? '').match(/\d+/)?.[0] ?? fallback)
  return Number.isFinite(n) ? n : fallback
}

function buildRows(seed: number): CampaignRow[] {
  return Array.from({ length: TOTAL_ROWS }, (_, i) => {
    const number = i + 1
    const rewardBase = 500 + ((seed + i) % 4) * 50
    return {
      id: `campaign-${seed}-${number}`,
      number,
      campaignName: `Campaign ${number}`,
      totalReferrals: 77,
      successfulResponses: 70 + ((seed + i) % 7 === 0 ? 6 : 0),
      rewardEarned: `$${rewardBase}`,
      position: ((seed * 3 + i) % 95) + 1,
    }
  })
}

function sortLabel(active: boolean) {
  return `flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide ${
    active ? 'text-brand' : 'text-brand/60'
  }`.trim()
}

function positionPillClass(position: number) {
  if (position === 1) return 'bg-amber-300 text-amber-900'
  if (position <= 3) return 'bg-orange-300 text-orange-900'
  if (position <= 10) return 'bg-slate-200 text-slate-700'
  return 'bg-white text-brand/85'
}

export function CampaignReferralProfilePage() {
  const navigate = useNavigate()
  const { campaignId, referralId } = useParams<{
    campaignId: string
    referralId: string
  }>()

  const campaignNumber = numericFromText(campaignId, 1)
  const referralNumber = numericFromText(referralId, 1)
  const memberName = 'Ahmad Stan'
  const memberSince = 2020
  const avatarUrl = localLeaderboardAvatar(referralNumber)

  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: 'number',
    dir: 'asc',
  })

  const allRows = useMemo(
    () => buildRows(campaignNumber + referralNumber),
    [campaignNumber, referralNumber],
  )

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allRows
    return allRows.filter((r) => r.campaignName.toLowerCase().includes(q))
  }, [allRows, query])

  const sortedRows = useMemo(() => {
    const list = [...filteredRows]
    list.sort((a, b) => {
      const av = a[sort.key]
      const bv = b[sort.key]
      if (sort.key === 'rewardEarned') {
        const ar = Number(String(av).replace('$', ''))
        const br = Number(String(bv).replace('$', ''))
        return sort.dir === 'asc' ? ar - br : br - ar
      }
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

  return (
    <div className={PAGE_WRAP}>
      <DashboardHeader />
      <main className="flex-1 bg-white">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-8 lg:px-[120px]">
          <p className="text-xs text-brand/55">
            Home / Campaigns / Campaign {campaignNumber} / {memberName}
          </p>
        </section>

        <section className="border-t border-line pb-16 pt-7">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-8 lg:px-[120px]">
            <div className="mb-7 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex size-9 items-center justify-center rounded-full border border-line bg-brand text-white transition hover:opacity-90"
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
                <img
                  src={avatarUrl}
                  alt=""
                  className="size-11 rounded-full border border-line object-cover"
                  width={44}
                  height={44}
                />
                <h1 className="text-[38px] font-bold leading-tight text-brand max-sm:text-3xl">
                  {memberName}
                </h1>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm text-brand/75">
                <svg
                  className="size-4 text-brand/60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M8 7V3m8 4V3M4 11h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
                </svg>
                Member since: {memberSince}
              </div>
            </div>

            <section>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-[24px] font-bold text-brand">Referrals Count</h2>
                <label className="relative block sm:w-[210px]">
                  <span className="sr-only">Search campaigns</span>
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
                <table className="w-full min-w-[980px] border-collapse text-left">
                  <thead className="border-b border-line bg-white">
                    <tr className="text-[11px] uppercase tracking-wide text-brand/70">
                      <th className="px-4 py-3 font-semibold sm:px-6">
                        <button type="button" onClick={() => onSort('number')} className={sortLabel(sort.key === 'number')}>
                          No.
                          <span>{sort.key === 'number' && sort.dir === 'desc' ? '↓' : '↑'}</span>
                        </button>
                      </th>
                      <th className="px-4 py-3 font-semibold sm:px-6">
                        <button type="button" onClick={() => onSort('campaignName')} className={sortLabel(sort.key === 'campaignName')}>
                          Campaign Name
                          <span>{sort.key === 'campaignName' && sort.dir === 'desc' ? '↓' : '↑'}</span>
                        </button>
                      </th>
                      <th className="px-4 py-3 font-semibold sm:px-6">
                        <button type="button" onClick={() => onSort('totalReferrals')} className={sortLabel(sort.key === 'totalReferrals')}>
                          Total Referrals
                          <span>{sort.key === 'totalReferrals' && sort.dir === 'desc' ? '↓' : '↑'}</span>
                        </button>
                      </th>
                      <th className="px-4 py-3 font-semibold sm:px-6">
                        <button type="button" onClick={() => onSort('successfulResponses')} className={sortLabel(sort.key === 'successfulResponses')}>
                          Successful Responses
                          <span>{sort.key === 'successfulResponses' && sort.dir === 'desc' ? '↓' : '↑'}</span>
                        </button>
                      </th>
                      <th className="px-4 py-3 font-semibold sm:px-6">
                        <button type="button" onClick={() => onSort('rewardEarned')} className={sortLabel(sort.key === 'rewardEarned')}>
                          Reward Earned
                          <span>{sort.key === 'rewardEarned' && sort.dir === 'desc' ? '↓' : '↑'}</span>
                        </button>
                      </th>
                      <th className="px-4 py-3 font-semibold sm:px-6">
                        <button type="button" onClick={() => onSort('position')} className={sortLabel(sort.key === 'position')}>
                          Position
                          <span>{sort.key === 'position' && sort.dir === 'desc' ? '↓' : '↑'}</span>
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-line text-sm text-brand transition hover:bg-footer/70 last:border-b-0"
                      >
                        <td className="px-4 py-4 sm:px-6">{row.number}</td>
                        <td className="px-4 py-4 font-semibold sm:px-6">{row.campaignName}</td>
                        <td className="px-4 py-4 sm:px-6">{row.totalReferrals}</td>
                        <td className="px-4 py-4 sm:px-6">{row.successfulResponses}</td>
                        <td className="px-4 py-4 sm:px-6">{row.rewardEarned}</td>
                        <td className="px-4 py-4 sm:px-6">
                          <span
                            className={`inline-flex size-6 items-center justify-center rounded-full border border-line text-xs font-semibold ${positionPillClass(row.position)}`}
                          >
                            {row.position}
                          </span>
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
