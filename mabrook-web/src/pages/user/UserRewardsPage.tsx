export function UserRewardsPage() {
  const rewards = [
    { id: 'RW-3101', type: 'Cash Reward', amount: '$150', status: 'Paid' },
    { id: 'RW-3102', type: 'Campaign Bonus', amount: '$75', status: 'Pending' },
    { id: 'RW-3103', type: 'Referral Conversion', amount: '$220', status: 'Paid' },
  ]

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <h1 className="text-[30px] font-bold text-brand">Rewards History</h1>
      <p className="mt-2 text-sm text-brand/70">
        View all rewards earned from link-attributed referrals.
      </p>

      <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
          <thead className="border-b border-line text-[11px] uppercase tracking-wide text-brand/70">
            <tr>
              <th className="px-4 py-3">Reward ID</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rewards.map((r) => (
              <tr key={r.id} className="border-b border-line hover:bg-footer/60">
                <td className="px-4 py-3">{r.id}</td>
                <td className="px-4 py-3 font-semibold">{r.type}</td>
                <td className="px-4 py-3">{r.amount}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full border border-line px-2.5 py-1 text-xs">
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
