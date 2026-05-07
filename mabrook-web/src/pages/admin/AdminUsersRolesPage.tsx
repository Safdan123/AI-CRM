const users = [
  { id: 'USR-01', name: 'Admin One', email: 'admin@mabrook.app', role: 'Admin', status: 'Active' },
  { id: 'USR-02', name: 'Ahmad Stan', email: 'ahmad@broker.com', role: 'Broker', status: 'Active' },
  { id: 'USR-03', name: 'Sara Khan', email: 'sara@client.com', role: 'Customer', status: 'Lead' },
  { id: 'USR-04', name: 'Support Agent', email: 'support@mabrook.app', role: 'Support', status: 'Active' },
] as const

export function AdminUsersRolesPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <h1 className="mb-4 text-[30px] font-bold text-brand">Manage Users & Roles</h1>
      <p className="mb-5 text-sm text-brand/70">
        Create users, assign roles, and control system access permissions.
      </p>

      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <thead className="border-b border-line text-[11px] uppercase tracking-wide text-brand/70">
            <tr>
              <th className="px-4 py-3">User ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-line hover:bg-footer/60">
                <td className="px-4 py-3">{user.id}</td>
                <td className="px-4 py-3 font-semibold">{user.name}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">{user.role}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full border border-line px-2.5 py-1 text-xs">
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="rounded-full border border-line px-3 py-1 text-xs font-semibold">
                      Edit
                    </button>
                    <button className="rounded-full border border-line px-3 py-1 text-xs font-semibold">
                      Change Role
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
