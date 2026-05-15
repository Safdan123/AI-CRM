import { useCallback, useEffect, useState } from 'react'
import { aiInsightsService } from '../../lib/api'
import type { ChurnScoreRow, LeadScoreRow, ScoreTier } from '../../lib/api/types'

function tierClass(tier: ScoreTier) {
  if (tier === 'high') return 'bg-amber-100 text-amber-900 ring-amber-200'
  if (tier === 'medium') return 'bg-blue-100 text-blue-900 ring-blue-200'
  return 'bg-slate-100 text-slate-800 ring-slate-200'
}

export function AdminAiInsightsPage() {
  const [leads, setLeads] = useState<LeadScoreRow[]>([])
  const [churn, setChurn] = useState<ChurnScoreRow[]>([])
  const [leadSummary, setLeadSummary] = useState({ total: 0, high: 0, medium: 0, low: 0 })
  const [churnSummary, setChurnSummary] = useState({ total: 0, high: 0, medium: 0, low: 0 })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [lr, cr] = await Promise.all([
        aiInsightsService.getLeadScores({ limit: 60 }),
        aiInsightsService.getChurnScores({ limit: 60 }),
      ])
      setLeads(lr.data.items)
      setLeadSummary(lr.data.summary)
      setChurn(cr.data.items)
      setChurnSummary(cr.data.summary)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load AI insights.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[30px] font-bold text-brand">AI Insights</h1>
          <p className="mt-2 text-sm text-brand/70">Lead priority and customer churn risk views.</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="h-10 rounded-full border border-line px-5 text-sm font-semibold text-brand transition hover:border-brand hover:bg-brand hover:text-white disabled:opacity-50"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-lg font-semibold text-brand">Lead scoring snapshot</h2>
          <p className="mt-1 text-xs text-brand/60">
            Higher scores indicate higher priority for broker follow-up.
          </p>
          <ul className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
            <li className="rounded-xl bg-footer/60 px-2 py-3">
              <div className="text-2xl font-bold text-brand">{leadSummary.high}</div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-brand/55">High</div>
            </li>
            <li className="rounded-xl bg-footer/60 px-2 py-3">
              <div className="text-2xl font-bold text-brand">{leadSummary.medium}</div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-brand/55">Medium</div>
            </li>
            <li className="rounded-xl bg-footer/60 px-2 py-3">
              <div className="text-2xl font-bold text-brand">{leadSummary.low}</div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-brand/55">Low</div>
            </li>
          </ul>
          <p className="mt-2 text-center text-xs text-brand/50">Total leads scored: {leadSummary.total}</p>
        </article>

        <article className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-lg font-semibold text-brand">Churn risk snapshot</h2>
          <p className="mt-1 text-xs text-brand/60">Higher risk scores suggest customers who may need retention outreach.</p>
          <ul className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
            <li className="rounded-xl bg-footer/60 px-2 py-3">
              <div className="text-2xl font-bold text-brand">{churnSummary.high}</div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-brand/55">High risk</div>
            </li>
            <li className="rounded-xl bg-footer/60 px-2 py-3">
              <div className="text-2xl font-bold text-brand">{churnSummary.medium}</div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-brand/55">Medium</div>
            </li>
            <li className="rounded-xl bg-footer/60 px-2 py-3">
              <div className="text-2xl font-bold text-brand">{churnSummary.low}</div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-brand/55">Low risk</div>
            </li>
          </ul>
          <p className="mt-2 text-center text-xs text-brand/50">Total customers scored: {churnSummary.total}</p>
        </article>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-5">
          <h3 className="text-base font-semibold text-brand">Top lead scores</h3>
          <div className="mt-3 max-h-[420px] overflow-auto rounded-xl border border-line/80">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead className="sticky top-0 bg-footer/90 text-xs uppercase text-brand/60">
                <tr>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">Tier</th>
                  <th className="px-3 py-2">Lead</th>
                  <th className="px-3 py-2">Broker</th>
                  <th className="px-3 py-2">Stage</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((row) => (
                  <tr key={row.id} className="border-t border-line/60 hover:bg-footer/40">
                    <td className="px-3 py-2 font-semibold tabular-nums text-brand">{row.score}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${tierClass(row.tier)}`}
                      >
                        {row.tier}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-brand/90">
                      <div className="font-medium">{row.displayName}</div>
                      <div className="text-xs text-brand/55">{row.region}</div>
                    </td>
                    <td className="max-w-[140px] truncate px-3 py-2 text-brand/80">{row.brokerName}</td>
                    <td className="px-3 py-2 text-xs text-brand/70">{row.stage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && leads.length === 0 ? (
              <p className="p-4 text-sm text-brand/60">No lead scores available.</p>
            ) : null}
          </div>
          {leads[0] ? (
            <p className="mt-3 text-xs text-brand/55">Example drivers: {leads[0].reasons.slice(0, 2).join(' · ')}</p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <h3 className="text-base font-semibold text-brand">Highest churn risk</h3>
          <div className="mt-3 max-h-[420px] overflow-auto rounded-xl border border-line/80">
            <table className="w-full min-w-[280px] text-left text-sm">
              <thead className="sticky top-0 bg-footer/90 text-xs uppercase text-brand/60">
                <tr>
                  <th className="px-3 py-2">Risk</th>
                  <th className="px-3 py-2">Tier</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Region</th>
                </tr>
              </thead>
              <tbody>
                {churn.map((row) => (
                  <tr key={row.id} className="border-t border-line/60 hover:bg-footer/40">
                    <td className="px-3 py-2 font-semibold tabular-nums text-brand">{row.risk}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${tierClass(row.tier)}`}
                      >
                        {row.tier}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium text-brand/90">{row.displayName}</td>
                    <td className="px-3 py-2 text-brand/70">{row.region}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && churn.length === 0 ? (
              <p className="p-4 text-sm text-brand/60">No churn scores available.</p>
            ) : null}
          </div>
          {churn[0] ? (
            <p className="mt-3 text-xs text-brand/55">Example drivers: {churn[0].reasons.slice(0, 2).join(' · ')}</p>
          ) : null}
        </section>
      </div>
    </div>
  )
}
