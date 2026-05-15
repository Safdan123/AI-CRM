import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { paths } from '../../config/paths'
import { adminService, aiInsightsService, analyticsService } from '../../lib/api'
import type { AdminKpi, Referral, TimeseriesPoint } from '../../lib/api/types'

const CUSTOMER_GROWTH_KEY = 'users.user'

function formatShortDate(isoDate: string) {
  const d = new Date(isoDate + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatNumber(n: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n)
}

function formatMoney(n: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    n,
  )
}

function referralStatusStyle(status: Referral['status']) {
  switch (status) {
    case 'pending':
      return 'bg-amber-50 text-amber-900 ring-amber-200/80'
    case 'verified':
      return 'bg-blue-50 text-blue-900 ring-blue-200/80'
    case 'converted':
      return 'bg-emerald-50 text-emerald-900 ring-emerald-200/80'
    case 'rejected':
      return 'bg-rose-50 text-rose-900 ring-rose-200/80'
    default:
      return 'bg-footer/80 text-brand/80 ring-line'
  }
}

function GrowthChart({ points, emptyLabel }: { points: TimeseriesPoint[]; emptyLabel: string }) {
  const pad = 8
  const vw = 520
  const vh = 160

  const { linePath, areaPath, maxY, ticks } = useMemo(() => {
    if (points.length === 0) {
      return { linePath: '', areaPath: '', maxY: 1, ticks: [] as string[] }
    }
    const values = points.map((p) => p.value)
    const max = Math.max(...values, 1)
    const n = points.length
    const innerW = vw - pad * 2
    const innerH = vh - pad * 2
    const coords = points.map((p, i) => {
      const x = pad + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW)
      const y = pad + innerH - (p.value / max) * innerH
      return { x, y }
    })
    const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ')
    const last = coords[coords.length - 1]
    const first = coords[0]
    const area = `${line} L ${last.x.toFixed(1)} ${(pad + innerH).toFixed(1)} L ${first.x.toFixed(1)} ${(pad + innerH).toFixed(1)} Z`
    const tickIdx =
      n <= 5 ? points.map((_, i) => i) : [0, Math.floor(n / 2), n - 1].filter((i, j, a) => a.indexOf(i) === j)
    return {
      linePath: line,
      areaPath: area,
      maxY: max,
      ticks: tickIdx.map((i) => formatShortDate(points[i]!.date)),
    }
  }, [points])

  if (points.length === 0 || points.every((p) => p.value === 0)) {
    return (
      <div className="flex h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-line bg-gradient-to-b from-footer/40 to-white px-6 text-center">
        <p className="text-sm font-medium text-brand">{emptyLabel}</p>
        <p className="mt-1 max-w-sm text-xs text-brand/55">
          Data fills automatically as customers register and the analytics service records daily totals.
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      <svg
        className="h-[220px] w-full text-brand"
        viewBox={`0 0 ${vw} ${vh}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        <defs>
          <linearGradient id="growthFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#growthFill)" className="text-brand" />
        <path
          d={linePath}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-brand drop-shadow-sm"
        />
      </svg>
      <div className="mt-2 flex justify-between px-1 text-[11px] font-medium tabular-nums text-brand/50">
        {ticks.map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
      <p className="mt-1 text-center text-[11px] text-brand/45">Daily sign-ups (last {points.length} days) · max {formatNumber(maxY)}/day</p>
    </div>
  )
}

export function AdminDashboardPage() {
  const [kpis, setKpis] = useState<AdminKpi | null>(null)
  const [series, setSeries] = useState<TimeseriesPoint[]>([])
  const [leadHigh, setLeadHigh] = useState(0)
  const [churnHigh, setChurnHigh] = useState(0)
  const [churnTotal, setChurnTotal] = useState(0)
  const [leadTotal, setLeadTotal] = useState(0)
  const [recent, setRecent] = useState<Referral[]>([])
  const [reviewQueue, setReviewQueue] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      const settled = await Promise.allSettled([
        adminService.getKpis(),
        analyticsService.getTimeseries(CUSTOMER_GROWTH_KEY, 30),
        aiInsightsService.getLeadScores({ limit: 8 }),
        aiInsightsService.getChurnScores({ limit: 8 }),
        adminService.listReferralsForReview(),
      ])

      if (cancelled) return

      const [kpiR, tsR, leadsR, churnR, refR] = settled

      if (kpiR.status === 'fulfilled') {
        setKpis(kpiR.value.data)
      } else {
        setError(kpiR.reason instanceof Error ? kpiR.reason.message : 'Failed to load KPIs.')
        setKpis(null)
      }

      if (tsR.status === 'fulfilled') {
        setSeries(tsR.value.data)
      } else {
        setSeries([])
      }

      if (leadsR.status === 'fulfilled') {
        setLeadHigh(leadsR.value.data.summary.high)
        setLeadTotal(leadsR.value.data.summary.total)
      } else {
        setLeadHigh(0)
        setLeadTotal(0)
      }

      if (churnR.status === 'fulfilled') {
        setChurnHigh(churnR.value.data.summary.high)
        setChurnTotal(churnR.value.data.summary.total)
      } else {
        setChurnHigh(0)
        setChurnTotal(0)
      }

      if (refR.status === 'fulfilled') {
        const sorted = [...refR.value.data].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        setReviewQueue(sorted)
        setRecent(sorted.slice(0, 7))
      } else {
        setReviewQueue([])
        setRecent([])
      }

      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const kpiCards = useMemo(() => {
    if (!kpis) return []
    return [
      {
        label: 'Total customers',
        value: formatNumber(kpis.totalCustomers),
        hint: 'End-user accounts',
        accent: 'from-emerald-500/90 to-teal-600/80',
      },
      {
        label: 'Active brokers',
        value: formatNumber(kpis.activeBrokers),
        hint: 'Broker roles on platform',
        accent: 'from-sky-500/90 to-blue-600/80',
      },
      {
        label: 'Total referrals',
        value: formatNumber(kpis.totalReferrals),
        hint: 'All-time submissions',
        accent: 'from-violet-500/90 to-indigo-600/80',
      },
      {
        label: 'Conversions',
        value: formatNumber(kpis.conversions),
        hint: 'Completed referrals',
        accent: 'from-amber-500/90 to-orange-600/80',
      },
      {
        label: 'Rewards distributed',
        value: formatMoney(kpis.rewardsDistributed),
        hint: 'Lifetime payout total',
        accent: 'from-rose-500/90 to-pink-600/80',
      },
    ]
  }, [kpis])

  const referralMix = useMemo(() => {
    const bucket: Record<Referral['status'], number> = {
      pending: 0,
      verified: 0,
      converted: 0,
      rejected: 0,
    }
    for (const r of reviewQueue) bucket[r.status]++
    const total = Object.values(bucket).reduce((a, b) => a + b, 0)
    const rows: { label: string; status: Referral['status']; pct: number; color: string }[] = [
      { label: 'Pending', status: 'pending', pct: total ? (bucket.pending / total) * 100 : 0, color: 'bg-amber-500' },
      { label: 'Verified', status: 'verified', pct: total ? (bucket.verified / total) * 100 : 0, color: 'bg-blue-500' },
      {
        label: 'Converted',
        status: 'converted',
        pct: total ? (bucket.converted / total) * 100 : 0,
        color: 'bg-emerald-500',
      },
      { label: 'Rejected', status: 'rejected', pct: total ? (bucket.rejected / total) * 100 : 0, color: 'bg-rose-500' },
    ]
    return { rows, total }
  }, [reviewQueue])

  const insightBlocks = useMemo(() => {
    const blocks: { title: string; body: string }[] = []
    if (churnTotal > 0) {
      blocks.push({
        title: 'Churn risk',
        body: `${formatNumber(churnHigh)} high-risk profile${churnHigh === 1 ? '' : 's'} in the current scoring set — review and prioritize follow-ups in Insights.`,
      })
    }
    if (leadTotal > 0) {
      blocks.push({
        title: 'Lead priority',
        body: `${formatNumber(leadHigh)} lead${leadHigh === 1 ? '' : 's'} marked high priority. Tune outreach from the full lead board.`,
      })
    }
    if (blocks.length < 3) {
      blocks.push({
        title: 'Operations snapshot',
        body:
          kpis !== null
            ? `${formatNumber(kpis.conversions)} lifetime conversions with ${formatNumber(kpis.totalReferrals)} referrals logged.`
            : 'KPIs appear here once loaded from the admin analytics pipeline.',
      })
    }
    if (blocks.length < 3) {
      blocks.push({
        title: 'Next step',
        body: 'Export or deep-dive reports from the Reports area when you need board-ready summaries.',
      })
    }
    return blocks.slice(0, 3)
  }, [churnHigh, churnTotal, leadHigh, leadTotal, kpis])

  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <div className="mb-8 flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand/45">Overview</p>
          <h1 className="mt-2 text-[34px] font-bold leading-tight tracking-tight text-brand max-sm:text-3xl">
            Admin CRM dashboard
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand/70">
            Live health of customers, brokers, referrals, and rewards — with growth and insight summaries in one
            place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="h-10 rounded-full border border-line bg-white px-5 text-sm font-semibold text-brand shadow-sm transition hover:border-brand/40 hover:bg-footer/70"
          >
            Export report
          </button>
          <Link
            to={paths.admin.reports}
            className="inline-flex h-10 items-center rounded-full bg-brand px-5 text-sm font-semibold text-white shadow-md shadow-brand/20 transition hover:opacity-92"
          >
            View reports
          </Link>
        </div>
      </div>

      {error ? (
        <p className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {(loading && !kpis ? Array.from({ length: 5 }) : kpiCards).map((item, i) => (
          <article
            key={loading && !kpis ? i : (item as { label: string }).label}
            className="group relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-sm ring-1 ring-black/[0.02] transition hover:shadow-md"
          >
            {loading && !kpis ? (
              <div className="animate-pulse space-y-3">
                <div className="h-3 w-24 rounded-lg bg-footer" />
                <div className="h-8 w-20 rounded-lg bg-footer" />
                <div className="h-3 w-full rounded-lg bg-footer/80" />
              </div>
            ) : (
              <>
                <div
                  className={`pointer-events-none absolute inset-y-3 left-0 w-1 rounded-full bg-gradient-to-b opacity-95 ${(item as { accent: string }).accent}`}
                  aria-hidden
                />
                <p className="pl-2 text-[11px] font-semibold uppercase tracking-wider text-brand/50">
                  {(item as { label: string }).label}
                </p>
                <p className="mt-2 pl-2 font-mono text-3xl font-bold tracking-tight text-brand tabular-nums">
                  {(item as { value: string }).value}
                </p>
                <p className="mt-2 pl-2 text-xs leading-snug text-brand/55">{(item as { hint: string }).hint}</p>
              </>
            )}
          </article>
        ))}
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article className="rounded-2xl border border-line bg-white p-6 shadow-sm ring-1 ring-black/[0.02] xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-brand">Customer growth</h2>
              <p className="mt-1 text-sm text-brand/60">New customer (user) registrations by day</p>
            </div>
            {series.length > 0 && series.some((p) => p.value > 0) ? (
              <span className="rounded-full bg-footer/80 px-3 py-1 text-xs font-semibold text-brand/70">
                Last {series.length} days
              </span>
            ) : null}
          </div>
          <div className="mt-6">
            {loading && series.length === 0 ? (
              <div className="h-[220px] animate-pulse rounded-xl bg-gradient-to-br from-footer/50 to-white" />
            ) : (
              <GrowthChart
                points={series}
                emptyLabel="No daily customer sign-ups recorded yet in analytics."
              />
            )}
          </div>
        </article>

        <article className="flex flex-col rounded-2xl border border-line bg-gradient-to-b from-white to-footer/30 p-6 shadow-sm ring-1 ring-black/[0.02]">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-brand">Insights</h2>
              <p className="mt-1 text-sm text-brand/60">Short signals from your scoring models</p>
            </div>
            <Link
              to={paths.admin.aiInsights}
              className="shrink-0 text-xs font-semibold text-brand underline-offset-4 transition hover:underline"
            >
              View all
            </Link>
          </div>
          <ul className="mt-5 flex flex-1 flex-col gap-3">
            {insightBlocks.map((item) => (
              <li
                key={item.title}
                className="rounded-xl border border-line/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm transition hover:border-brand/25"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-brand/45">{item.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-brand/80">{item.body}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <article className="rounded-2xl border border-line bg-white p-6 shadow-sm ring-1 ring-black/[0.02]">
          <h2 className="text-lg font-semibold text-brand">Referral pipeline</h2>
          <p className="mt-1 text-sm text-brand/60">Share of recent review-queue referrals by status</p>
          <div className="mt-5 space-y-4">
            {referralMix.total === 0 ? (
              <p className="text-sm text-brand/55">No recent referrals in the review queue to chart yet.</p>
            ) : (
              referralMix.rows.map((row) => (
                <div key={row.status}>
                  <div className="mb-1 flex items-center justify-between text-xs font-medium text-brand/75">
                    <span>{row.label}</span>
                    <span className="tabular-nums text-brand/55">{row.pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-footer/90">
                    <div className={`h-full rounded-full ${row.color}`} style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-line bg-white p-6 shadow-sm ring-1 ring-black/[0.02] lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-brand">Recent activity</h2>
            <Link
              to={paths.admin.referrals}
              className="text-xs font-semibold text-brand underline-offset-4 transition hover:underline"
            >
              Open referrals
            </Link>
          </div>
          <p className="mt-1 text-sm text-brand/60">Latest items from the admin review queue</p>
          <ul className="mt-5 divide-y divide-line/80">
            {recent.length === 0 ? (
              <li className="py-8 text-center text-sm text-brand/55">No referrals in the review queue right now.</li>
            ) : (
              recent.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 py-3.5 first:pt-0">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-semibold text-brand">{r.customerName}</span>
                    <span className="truncate text-xs text-brand/55">
                      {r.id} · {r.phone}
                    </span>
                  </div>
                  <span
                    className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${referralStatusStyle(r.status)}`}
                  >
                    {r.status}
                  </span>
                  <span className="shrink-0 text-[11px] font-medium tabular-nums text-brand/45">{r.createdAt}</span>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>
    </div>
  )
}
