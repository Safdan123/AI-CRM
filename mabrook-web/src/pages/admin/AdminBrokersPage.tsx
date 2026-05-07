export function AdminBrokersPage() {
  const brokers = [
    { id: 'BR-01', name: 'Ahmad Stan', referrals: 77, conversions: 31, rewards: '$1,250' },
    { id: 'BR-02', name: 'Ali Khan', referrals: 65, conversions: 26, rewards: '$980' },
    { id: 'BR-03', name: 'Raza Jafri', referrals: 49, conversions: 18, rewards: '$720' },
  ]

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <h1 className="mb-4 text-[30px] font-bold text-brand">Brokers Management</h1>
      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="border-b border-line text-[11px] uppercase tracking-wide text-brand/70">
            <tr>
              <th className="px-4 py-3">Broker ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Referrals</th>
              <th className="px-4 py-3">Conversions</th>
              <th className="px-4 py-3">Rewards</th>
            </tr>
          </thead>
          <tbody>
            {brokers.map((b) => (
              <tr key={b.id} className="border-b border-line hover:bg-footer/60">
                <td className="px-4 py-3">{b.id}</td>
                <td className="px-4 py-3 font-semibold">{b.name}</td>
                <td className="px-4 py-3">{b.referrals}</td>
                <td className="px-4 py-3">{b.conversions}</td>
                <td className="px-4 py-3">{b.rewards}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
