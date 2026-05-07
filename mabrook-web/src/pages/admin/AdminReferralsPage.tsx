import { useNavigate } from 'react-router-dom'
import { paths } from '../../config/paths'

export function AdminReferralsPage() {
  const navigate = useNavigate()
  const items = [
    { id: 'RF-1023', customer: 'Ali Raza', campaign: 'Campaign 10', status: 'Pending', broker: 'Ahmad Stan' },
    { id: 'RF-1022', customer: 'Sara Ahmed', campaign: 'Campaign 8', status: 'Verified', broker: 'Ali Khan' },
    { id: 'RF-1021', customer: 'Hamza Ali', campaign: 'Campaign 9', status: 'Converted', broker: 'Momin Butt' },
    { id: 'RF-1020', customer: 'Amna Khan', campaign: 'Campaign 7', status: 'Rejected', broker: 'Raza Jafri' },
  ]

  const statusClass: Record<string, string> = {
    Pending: 'bg-amber-100 text-amber-800 border-amber-200',
    Verified: 'bg-blue-100 text-blue-800 border-blue-200',
    Converted: 'bg-green-100 text-green-800 border-green-200',
    Rejected: 'bg-red-100 text-red-800 border-red-200',
  }

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <h1 className="mb-4 text-[30px] font-bold text-brand">
        Referral Verification & Approval
      </h1>
      <p className="mb-5 text-sm text-brand/70">
        Review customer, campaign, and broker information before approval.
      </p>

      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="border-b border-line text-[11px] uppercase tracking-wide text-brand/70">
            <tr>
              <th className="px-4 py-3">Referral ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Broker</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="cursor-pointer border-b border-line hover:bg-footer/60"
                onClick={() => navigate(paths.admin.referralReview(item.id))}
              >
                <td className="px-4 py-3">{item.id}</td>
                <td className="px-4 py-3 font-semibold">{item.customer}</td>
                <td className="px-4 py-3">{item.campaign}</td>
                <td className="px-4 py-3">{item.broker}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass[item.status]}`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(paths.admin.referralReview(item.id))
                      }}
                      className="rounded-full border border-line px-3 py-1 text-xs font-semibold"
                    >
                      Review
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-full border border-green-200 px-3 py-1 text-xs font-semibold text-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
