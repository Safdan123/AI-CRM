export function AdminRewardsPage() {
  const payouts = [
    { id: 'PO-201', broker: 'Ahmad Stan', amount: '$450', status: 'Pending' },
    { id: 'PO-202', broker: 'Ali Khan', amount: '$820', status: 'Paid' },
    { id: 'PO-203', broker: 'Raza Jafri', amount: '$310', status: 'Pending' },
  ]

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <h1 className="mb-4 text-[30px] font-bold text-brand">Rewards Management</h1>
      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[700px] border-collapse text-left text-sm">
          <thead className="border-b border-line text-[11px] uppercase tracking-wide text-brand/70">
            <tr>
              <th className="px-4 py-3">Payout ID</th>
              <th className="px-4 py-3">Broker</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((p) => (
              <tr key={p.id} className="border-b border-line hover:bg-footer/60">
                <td className="px-4 py-3">{p.id}</td>
                <td className="px-4 py-3 font-semibold">{p.broker}</td>
                <td className="px-4 py-3">{p.amount}</td>
                <td className="px-4 py-3">{p.status}</td>
                <td className="px-4 py-3">
                  <button className="rounded-full border border-line px-3 py-1 text-xs font-semibold">
                    Mark Paid
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
