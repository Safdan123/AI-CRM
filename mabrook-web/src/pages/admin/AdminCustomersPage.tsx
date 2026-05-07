import { useNavigate } from 'react-router-dom'
import { paths } from '../../config/paths'

export function AdminCustomersPage() {
  const navigate = useNavigate()
  const rows = Array.from({ length: 8 }, (_, i) => ({
    id: `CUS-${100 + i}`,
    name: `Customer ${i + 1}`,
    email: `customer${i + 1}@mail.com`,
    phone: '+92 300 0000000',
    city: i % 2 === 0 ? 'Lahore' : 'Karachi',
    broker: 'Ahmad Stan',
    status: i % 3 === 0 ? 'Lead' : i % 2 === 0 ? 'Active' : 'Converted',
  }))

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[30px] font-bold text-brand">Customer Management</h1>
        <div className="flex gap-2">
          <button className="h-10 rounded-full border border-line px-5 text-sm font-semibold text-brand transition hover:border-brand hover:bg-brand hover:text-white">
            Add Customer
          </button>
          <button className="h-10 rounded-full bg-brand px-5 text-sm font-semibold text-white transition hover:opacity-90">
            Export Customers
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <input
          className="h-10 rounded-full border border-line px-4 text-sm outline-none focus:border-brand md:col-span-2"
          placeholder="Search by Name / Email / Phone"
        />
        <input
          className="h-10 rounded-full border border-line px-4 text-sm outline-none focus:border-brand"
          placeholder="Status"
        />
        <input
          className="h-10 rounded-full border border-line px-4 text-sm outline-none focus:border-brand"
          placeholder="City"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[950px] border-collapse text-left text-sm">
          <thead className="border-b border-line text-[11px] uppercase tracking-wide text-brand/70">
            <tr>
              <th className="px-4 py-3">Customer ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Broker Assigned</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-line hover:bg-footer/60">
                <td className="px-4 py-3">{row.id}</td>
                <td className="px-4 py-3 font-semibold">{row.name}</td>
                <td className="px-4 py-3">{row.email}</td>
                <td className="px-4 py-3">{row.phone}</td>
                <td className="px-4 py-3">{row.city}</td>
                <td className="px-4 py-3">{row.broker}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full border border-line px-2.5 py-1 text-xs">
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(paths.admin.customerDetail(row.id))}
                      className="rounded-full border border-line px-3 py-1 text-xs font-semibold"
                    >
                      View
                    </button>
                    <button className="rounded-full border border-line px-3 py-1 text-xs font-semibold">
                      Edit
                    </button>
                    <button className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700">
                      Delete
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
