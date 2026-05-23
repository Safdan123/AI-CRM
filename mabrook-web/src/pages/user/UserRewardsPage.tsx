import { useEffect, useState } from 'react'
import { getMyRewards, type RewardLedgerEntry } from '../../lib/api/realServices'

function formatAmount(entry: RewardLedgerEntry) {
  return `${entry.amount.toLocaleString()} ${entry.currency}`
}

export function UserRewardsPage() {
  const [entries, setEntries] = useState<RewardLedgerEntry[]>([])
  const [balance, setBalance] = useState<{ amount: number; currency: string } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void getMyRewards()
      .then((res) => {
        setEntries(res.data.entries)
        setBalance({
          amount: res.data.balanceInBase,
          currency: res.data.baseCurrency,
        })
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load rewards.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <h1 className="text-[30px] font-bold text-brand">Rewards History</h1>
      <p className="mt-2 text-sm text-brand/70">
        Rewards earned when your referred leads are verified and converted (ledger credits).
      </p>

      {balance ? (
        <p className="mt-4 rounded-xl border border-line bg-footer/55 px-4 py-3 text-sm font-semibold text-brand">
          Balance: {balance.amount.toLocaleString()} {balance.currency}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-6 text-sm text-brand/60">Loading rewards…</p>
      ) : error ? (
        <p className="mt-6 text-sm text-red-600">{error}</p>
      ) : entries.length === 0 ? (
        <p className="mt-6 text-sm text-brand/60">No reward entries yet.</p>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead className="border-b border-line text-[11px] uppercase tracking-wide text-brand/70">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((r) => (
                <tr key={r._id} className="border-b border-line hover:bg-footer/60">
                  <td className="px-4 py-3">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-semibold">{r.description}</td>
                  <td className="px-4 py-3 capitalize">{r.entryType}</td>
                  <td className="px-4 py-3">{formatAmount(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
