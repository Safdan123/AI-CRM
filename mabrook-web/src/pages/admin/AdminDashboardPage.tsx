const kpis = [
  { label: 'Total Customers', value: '1,245', delta: '+12% this month' },
  { label: 'Active Brokers', value: '186', delta: '+4% this month' },
  { label: 'Total Referrals', value: '3,902', delta: '+9% this month' },
  { label: 'Conversions', value: '1,128', delta: '+6% this month' },
  { label: 'Rewards Distributed', value: '$45,300', delta: '+15% this month' },
] as const

export function AdminDashboardPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[34px] font-bold leading-tight text-brand max-sm:text-3xl">
          Admin CRM Dashboard
        </h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="h-10 rounded-full border border-line px-5 text-sm font-semibold text-brand transition hover:border-brand hover:bg-brand hover:text-white"
          >
            Export Report
          </button>
          <button
            type="button"
            className="h-10 rounded-full bg-brand px-5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Generate AI Report
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((item) => (
          <article key={item.label} className="rounded-2xl border border-line bg-footer/55 p-4">
            <p className="text-xs text-brand/65">{item.label}</p>
            <p className="mt-1 text-2xl font-bold text-brand">{item.value}</p>
            <p className="mt-1 text-xs text-green-700">{item.delta}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-line bg-white p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold text-brand">Customer Growth (Monthly)</h2>
          <div className="mt-4 h-64 rounded-xl bg-footer/60 p-4">
            <div className="flex h-full items-end gap-3">
              {[35, 42, 51, 48, 60, 66, 72].map((v, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-md bg-brand/80"
                    style={{ height: `${v}%` }}
                  />
                  <span className="text-[10px] text-brand/60">W{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-lg font-semibold text-brand">AI Insights</h2>
          <ul className="mt-4 space-y-3 text-sm text-brand/80">
            <li className="rounded-lg bg-footer/60 p-3">
              Customers from Lahore have 32% higher conversion probability.
            </li>
            <li className="rounded-lg bg-footer/60 p-3">
              Campaign 10 has strongest referral velocity this week.
            </li>
            <li className="rounded-lg bg-footer/60 p-3">
              27 users are high churn-risk and need follow-up.
            </li>
          </ul>
        </article>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-lg font-semibold text-brand">Referral Analytics</h2>
          <div className="mt-4 space-y-3 text-sm text-brand/80">
            <div className="flex items-center justify-between">
              <span>Pending</span>
              <span className="font-semibold text-amber-700">28%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Verified</span>
              <span className="font-semibold text-blue-700">25%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Converted</span>
              <span className="font-semibold text-green-700">38%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Rejected</span>
              <span className="font-semibold text-red-700">9%</span>
            </div>
          </div>
        </article>
        <article className="rounded-2xl border border-line bg-white p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold text-brand">Recent Activity</h2>
          <ul className="mt-4 space-y-2 text-sm text-brand/80">
            <li className="rounded-lg bg-footer/60 px-3 py-2">
              Broker John submitted referral RF1023.
            </li>
            <li className="rounded-lg bg-footer/60 px-3 py-2">
              Admin approved referral RF1011.
            </li>
            <li className="rounded-lg bg-footer/60 px-3 py-2">
              Customer Sara registered.
            </li>
          </ul>
        </article>
      </section>
    </div>
  )
}
