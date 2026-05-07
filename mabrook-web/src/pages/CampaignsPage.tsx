import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { Footer } from '../components/layout/Footer'
import { paths } from '../config/paths'
import { campaignService } from '../lib/api'
import { getTokenPayload } from '../lib/api/http'
import type { Campaign } from '../lib/api/types'

type CampaignRow = {
  id: string
  number: number
  campaignName: string
  signupDate: string
  endDate: string
  rewardAmount: number
}

type SortKey = 'number' | 'campaignName' | 'signupDate' | 'endDate' | 'rewardAmount'
type SortDir = 'asc' | 'desc'

const PAGE_WRAP =
  'flex min-h-svh w-full max-w-full flex-col overflow-x-hidden bg-white'

const ROWS_PER_PAGE = 10

function iconButtonClass(active: boolean) {
  return `flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide ${
    active ? 'text-brand' : 'text-brand/60'
  }`.trim()
}

export function CampaignsPage() {
  const navigate = useNavigate()
  const role = getTokenPayload()?.role
  const canCreateCampaign = role === 'admin'
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<CampaignRow[]>([])
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: 'number',
    dir: 'asc',
  })

  useEffect(() => {
    void campaignService
      .list()
      .then((res) => {
        setRows(
          res.data.map((c: Campaign, index: number) => ({
            id: c.id,
            number: index + 1,
            campaignName: c.name,
            signupDate: c.startDate,
            endDate: c.endDate,
            rewardAmount: c.totalRewardAmount,
          })),
        )
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load campaigns.')
      })
  }, [])

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => {
      return (
        row.campaignName.toLowerCase().includes(q) ||
        row.signupDate.toLowerCase().includes(q) ||
        row.endDate.toLowerCase().includes(q)
      )
    })
  }, [query, rows])

  const sortedRows = useMemo(() => {
    const list = [...filteredRows]
    list.sort((a, b) => {
      const aValue = a[sort.key]
      const bValue = b[sort.key]
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sort.dir === 'asc' ? aValue - bValue : bValue - aValue
      }
      const result = String(aValue).localeCompare(String(bValue))
      return sort.dir === 'asc' ? result : -result
    })
    return list
  }, [filteredRows, sort])

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / ROWS_PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pageStart = (safePage - 1) * ROWS_PER_PAGE
  const pageRows = sortedRows.slice(pageStart, pageStart + ROWS_PER_PAGE)

  const visiblePageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (safePage <= 3) return [1, 2, 3, 4, totalPages]
    if (safePage >= totalPages - 2) {
      return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [1, safePage - 1, safePage, safePage + 1, totalPages]
  }, [safePage, totalPages])

  const onToggleSort = (key: SortKey) => {
    setPage(1)
    setSort((prev) => {
      if (prev.key === key) {
        return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      }
      return { key, dir: 'asc' }
    })
  }

  const onSearchChange = (value: string) => {
    setQuery(value)
    setPage(1)
  }

  return (
    <div className={PAGE_WRAP}>
      <DashboardHeader userName="Jack Morris" userEmail="jack.morris@mabrook.app" />
      <main className="flex-1 bg-white">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-8 lg:px-[120px]">
          <p className="text-xs text-brand/55">Home / Campaigns</p>
        </section>
        <section className="border-t border-line pb-16 pt-7">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-8 lg:px-[120px]">
            <div className="mb-6 flex flex-col gap-3 sm:mb-7 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-[30px] font-bold leading-tight text-brand">Campaigns</h1>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                <label className="relative block sm:w-[220px]">
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
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search"
                    className="h-10 w-full rounded-full border border-line bg-white pl-10 pr-4 text-sm text-brand-ink outline-none transition focus:border-brand"
                  />
                </label>
                {canCreateCampaign ? (
                  <button
                    type="button"
                    onClick={() => navigate(paths.campaignsCreate)}
                    className="h-10 rounded-full bg-brand px-5 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Create New Campaign
                  </button>
                ) : null}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-line bg-white">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead className="border-b border-line bg-white">
                  <tr className="text-[11px] uppercase tracking-wide text-brand/70">
                    <th className="px-4 py-3 font-semibold sm:px-6">
                      <button
                        type="button"
                        onClick={() => onToggleSort('number')}
                        className={iconButtonClass(sort.key === 'number')}
                      >
                        No.
                        <span>{sort.key === 'number' && sort.dir === 'desc' ? '↓' : '↑'}</span>
                      </button>
                    </th>
                    <th className="px-4 py-3 font-semibold sm:px-6">
                      <button
                        type="button"
                        onClick={() => onToggleSort('campaignName')}
                        className={iconButtonClass(sort.key === 'campaignName')}
                      >
                        Campaign Name
                        <span>
                          {sort.key === 'campaignName' && sort.dir === 'desc' ? '↓' : '↑'}
                        </span>
                      </button>
                    </th>
                    <th className="px-4 py-3 font-semibold sm:px-6">
                      <button
                        type="button"
                        onClick={() => onToggleSort('signupDate')}
                        className={iconButtonClass(sort.key === 'signupDate')}
                      >
                        Signup Date
                        <span>{sort.key === 'signupDate' && sort.dir === 'desc' ? '↓' : '↑'}</span>
                      </button>
                    </th>
                    <th className="px-4 py-3 font-semibold sm:px-6">
                      <button
                        type="button"
                        onClick={() => onToggleSort('endDate')}
                        className={iconButtonClass(sort.key === 'endDate')}
                      >
                        End Date
                        <span>{sort.key === 'endDate' && sort.dir === 'desc' ? '↓' : '↑'}</span>
                      </button>
                    </th>
                    <th className="px-4 py-3 font-semibold sm:px-6">
                      <button
                        type="button"
                        onClick={() => onToggleSort('rewardAmount')}
                        className={iconButtonClass(sort.key === 'rewardAmount')}
                      >
                        Reward
                        <span>{sort.key === 'rewardAmount' && sort.dir === 'desc' ? '↓' : '↑'}</span>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => navigate(paths.campaignDetail(row.id))}
                      className="cursor-pointer border-b border-line text-sm text-brand transition hover:bg-footer/70 last:border-b-0"
                    >
                      <td className="px-4 py-4 sm:px-6">{row.number}</td>
                      <td className="px-4 py-4 font-semibold sm:px-6">{row.campaignName}</td>
                      <td className="px-4 py-4 sm:px-6">{row.signupDate}</td>
                      <td className="px-4 py-4 sm:px-6">{row.endDate}</td>
                      <td className="px-4 py-4 sm:px-6">${row.rewardAmount}</td>
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
                  aria-label="First page"
                >
                  ≪
                </button>
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-md border border-line px-2 py-1 text-brand transition hover:bg-footer disabled:opacity-40"
                  aria-label="Previous page"
                >
                  ‹
                </button>
                {visiblePageNumbers.map((n, idx) => (
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
                    {idx > 0 && n - visiblePageNumbers[idx - 1] > 1 ? `… ${n}` : n}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-md border border-line px-2 py-1 text-brand transition hover:bg-footer disabled:opacity-40"
                  aria-label="Next page"
                >
                  ›
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage(totalPages)}
                  className="rounded-md border border-line px-2 py-1 text-brand transition hover:bg-footer disabled:opacity-40"
                  aria-label="Last page"
                >
                  ≫
                </button>
              </div>
            </div>

            <p className="mt-4 text-xs text-brand/50">
              The date &amp; timestamp are displayed according to the time zone of your
              browser.
            </p>
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
