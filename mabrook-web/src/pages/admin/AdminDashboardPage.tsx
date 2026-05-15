import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { paths } from '../../config/paths'
import { adminService, aiInsightsService, analyticsService } from '../../lib/api'
import type {
  AdminKpi,
  AiScoresSummary,
  ChurnScoreRow,
  LeadScoreRow,
  Referral,
  ScoreTier,
  TimeseriesPoint,
} from '../../lib/api/types'

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

function tierBadgeClass(tier: ScoreTier) {
  if (tier === 'high') return 'bg-amber-100 text-amber-900 ring-1 ring-amber-200/90'
  if (tier === 'medium') return 'bg-blue-100 text-blue-900 ring-1 ring-blue-200/90'
  return 'bg-slate-100 text-slate-800 ring-1 ring-slate-200/90'
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

function computeTopBroker(leads: LeadScoreRow[]) {
  type Agg = { brokerName: string; leadCount: number; sumScore: number; topLead: LeadScoreRow }
  const map = new Map<string, Agg>()
  for (const row of leads) {
    const brokerName = row.brokerName?.trim() || 'Unassigned'
    const cur = map.get(brokerName) ?? {
      brokerName,
      leadCount: 0,
      sumScore: 0,
      topLead: row,
    }
    cur.leadCount += 1
    cur.sumScore += row.score
    if (row.score > cur.topLead.score) cur.topLead = row
    map.set(brokerName, cur)
  }
  let best: Agg | null = null
  for (const agg of map.values()) {
    if (!best || agg.sumScore > best.sumScore || (agg.sumScore === best.sumScore && agg.leadCount > best.leadCount)) {
      best = agg
    }
  }
  return best
}

export function AdminDashboardPage() {
  const [kpis, setKpis] = useState<AdminKpi | null>(null)
  const [series, setSeries] = useState<TimeseriesPoint[]>([])
  const [leads, setLeads] = useState<LeadScoreRow[]>([])
  const [churn, setChurn] = useState<ChurnScoreRow[]>([])
  const [leadSummary, setLeadSummary] = useState<AiScoresSummary | null>(null)
  const [churnSummary, setChurnSummary] = useState<AiScoresSummary | null>(null)
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
        aiInsightsService.getLeadScores({ limit: 60 }),
        aiInsightsService.getChurnScores({ limit: 60 }),
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
        setLeads(leadsR.value.data.items)
        setLeadSummary(leadsR.value.data.summary)
      } else {
        setLeads([])
        setLeadSummary(null)
      }

      if (churnR.status === 'fulfilled') {
        setChurn(churnR.value.data.items)
        setChurnSummary(churnR.value.data.summary)
      } else {
        setChurn([])
        setChurnSummary(null)
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

  const topBroker = useMemo(() => computeTopBroker(leads), [leads])
  const topLead = leads[0] ?? null
  const topChurn = churn[0] ?? null

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
              <p className="mt-1 text-sm text-brand/60">Live fields from lead & churn scores</p>
            </div>
            <Link
              to={paths.admin.aiInsights}
              className="shrink-0 text-xs font-semibold text-brand underline-offset-4 transition hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="mt-5 flex max-h-[min(520px,70vh)] flex-col gap-3 overflow-y-auto pr-1">
            {loading && leads.length === 0 && churn.length === 0 ? (
              <div className="space-y-3">
                <div className="h-24 animate-pulse rounded-xl bg-footer/70" />
                <div className="h-24 animate-pulse rounded-xl bg-footer/70" />
                <div className="h-24 animate-pulse rounded-xl bg-footer/70" />
              </div>
            ) : !topLead && !topChurn && !topBroker ? (
              <p className="rounded-xl border border-dashed border-line bg-white/80 px-4 py-6 text-center text-sm text-brand/60">
                No scored leads or customers yet. Open{' '}
                <Link to={paths.admin.aiInsights} className="font-semibold text-brand underline-offset-2 hover:underline">
                  Insights
                </Link>{' '}
                after data is seeded.
              </p>
            ) : (
              <>
                {topBroker ? (
                  <section className="rounded-xl border border-line/80 bg-white/95 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-brand/45">Top broker (by score sum)</p>
                      <span className="rounded-full bg-footer px-2 py-0.5 text-[11px] font-semibold tabular-nums text-brand/70">
                        {formatNumber(topBroker.leadCount)} leads
                      </span>
                    </div>
                    <p className="mt-2 truncate text-base font-semibold text-brand">{topBroker.brokerName}</p>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-footer/60 px-2 py-1.5">
                        <dt className="text-brand/50">Σ score</dt>
                        <dd className="font-mono font-semibold text-brand">{formatNumber(topBroker.sumScore)}</dd>
                      </div>
                      <div className="rounded-lg bg-footer/60 px-2 py-1.5">
                        <dt className="text-brand/50">Avg</dt>
                        <dd className="font-mono font-semibold text-brand">
                          {formatNumber(Math.round(topBroker.sumScore / topBroker.leadCount))}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-2 truncate text-[11px] text-brand/55">
                      Strongest lead: {topBroker.topLead.displayName} ({formatNumber(topBroker.topLead.score)})
                    </p>
                  </section>
                ) : null}

                {topLead ? (
                  <section className="rounded-xl border border-line/80 bg-white/95 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-brand/45">Top lead</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${tierBadgeClass(topLead.tier)}`}>
                        {topLead.tier}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-base font-semibold text-brand">{topLead.displayName}</p>
                    <p className="mt-0.5 truncate text-xs text-brand/60">
                      {topLead.brokerName || '—'} · {topLead.region} · {topLead.stage}
                    </p>
                    <p className="mt-3 font-mono text-2xl font-bold tabular-nums text-brand">{formatNumber(topLead.score)}</p>
                    {topLead.reasons[0] ? (
                      <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-brand/55">{topLead.reasons[0]}</p>
                    ) : null}
                  </section>
                ) : null}

                {topChurn ? (
                  <section className="rounded-xl border border-line/80 bg-white/95 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-brand/45">Highest churn risk</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${tierBadgeClass(topChurn.tier)}`}>
                        {topChurn.tier}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-base font-semibold text-brand">{topChurn.displayName}</p>
                    <p className="mt-0.5 truncate text-xs text-brand/60">{topChurn.region}</p>
                    <p className="mt-3 font-mono text-2xl font-bold tabular-nums text-brand">{formatNumber(topChurn.risk)}</p>
                    {topChurn.reasons[0] ? (
                      <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-brand/55">{topChurn.reasons[0]}</p>
                    ) : null}
                  </section>
                ) : null}

                {leadSummary && churnSummary ? (
                  <section className="rounded-xl border border-line/80 bg-white/95 p-4 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-brand/45">Tier mix (scored)</p>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="font-semibold text-brand/70">Leads</p>
                        <dl className="mt-1.5 space-y-1 font-mono tabular-nums text-brand/85">
                          <div className="flex justify-between gap-2">
                            <dt className="text-brand/50">High</dt>
                            <dd>{formatNumber(leadSummary.high)}</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-brand/50">Med</dt>
                            <dd>{formatNumber(leadSummary.medium)}</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-brand/50">Low</dt>
                            <dd>{formatNumber(leadSummary.low)}</dd>
                          </div>
                        </dl>
                      </div>
                      <div>
                        <p className="font-semibold text-brand/70">Churn</p>
                        <dl className="mt-1.5 space-y-1 font-mono tabular-nums text-brand/85">
                          <div className="flex justify-between gap-2">
                            <dt className="text-brand/50">High</dt>
                            <dd>{formatNumber(churnSummary.high)}</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-brand/50">Med</dt>
                            <dd>{formatNumber(churnSummary.medium)}</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-brand/50">Low</dt>
                            <dd>{formatNumber(churnSummary.low)}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                    <p className="mt-2 text-center text-[10px] text-brand/45">
                      Totals · leads {formatNumber(leadSummary.total)} · customers {formatNumber(churnSummary.total)}
                    </p>
                  </section>
                ) : null}
              </>
            )}
          </div>
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
