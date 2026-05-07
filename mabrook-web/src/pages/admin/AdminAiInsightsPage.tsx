export function AdminAiInsightsPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <h1 className="text-[30px] font-bold text-brand">AI Insights</h1>
      <p className="mt-2 text-sm text-brand/70">
        Lead scoring, churn signals, and AI-generated recommendations.
      </p>
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-lg font-semibold text-brand">Lead Scoring Snapshot</h2>
          <ul className="mt-3 space-y-2 text-sm text-brand/80">
            <li className="rounded-lg bg-footer/60 p-3">High score leads: 42</li>
            <li className="rounded-lg bg-footer/60 p-3">Medium score leads: 91</li>
            <li className="rounded-lg bg-footer/60 p-3">Low score leads: 37</li>
          </ul>
        </article>
        <article className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-lg font-semibold text-brand">Churn Risk Signals</h2>
          <ul className="mt-3 space-y-2 text-sm text-brand/80">
            <li className="rounded-lg bg-footer/60 p-3">High risk customers: 27</li>
            <li className="rounded-lg bg-footer/60 p-3">Medium risk customers: 63</li>
            <li className="rounded-lg bg-footer/60 p-3">Low risk customers: 201</li>
          </ul>
        </article>
      </div>
    </div>
  )
}
