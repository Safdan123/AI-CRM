import { NavLink } from 'react-router-dom'
import { paths } from '../../config/paths'

const baseItem =
  'block rounded-xl px-4 py-2.5 text-sm font-medium text-brand transition hover:bg-footer'
const activeItem = 'bg-brand/8 font-semibold text-brand ring-1 ring-brand/15'

const adminItems = [
  { label: 'Dashboard', to: paths.admin.dashboard },
  { label: 'Customers', to: paths.admin.customers },
  { label: 'Brokers', to: paths.admin.brokers },
  { label: 'Referrals', to: paths.admin.referrals },
  { label: 'Rewards', to: paths.admin.rewards },
  { label: 'Insights', to: paths.admin.aiInsights },
  { label: 'Reports', to: paths.admin.reports },
  { label: 'Blogs', to: paths.admin.blogs },
  { label: 'Notifications', to: paths.admin.notifications },
  { label: 'Users & Roles', to: paths.admin.usersRoles },
  { label: 'Settings', to: paths.admin.settings },
] as const

export function AdminSidebar() {
  return (
    <nav
      className="flex min-w-0 flex-row gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0"
      aria-label="Admin navigation"
    >
      {adminItems.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          className={({ isActive }) =>
            `${baseItem} ${isActive ? activeItem : ''}`.trim()
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
