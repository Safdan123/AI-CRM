export function AdminReportsPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[30px] font-bold text-brand">Reports</h1>
        <button className="h-10 rounded-full bg-brand px-5 text-sm font-semibold text-white transition hover:opacity-90">
          Export Report
        </button>
      </div>
      <div className="rounded-2xl border border-line bg-white p-5">
        <p className="text-sm text-brand/80">
          Report center for referrals, conversions, rewards payouts, and broker
          performance exports.
        </p>
      </div>
    </div>
  )
}
