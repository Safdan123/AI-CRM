import { NavLink } from 'react-router-dom'
import { paths } from '../../config/paths'

const baseItem =
  'block rounded-xl px-4 py-2.5 text-sm font-medium text-brand transition hover:bg-footer'
const activeItem = 'bg-brand/8 font-semibold text-brand ring-1 ring-brand/15'

const userItems = [
  { label: 'Dashboard', to: paths.user.dashboard },
  { label: 'Profile', to: paths.user.profile },
  { label: 'Rewards', to: paths.user.rewards },
  { label: 'Notifications', to: paths.user.notifications },
] as const

export function UserSidebar() {
  return (
    <nav
      className="flex min-w-0 flex-row gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0"
      aria-label="User navigation"
    >
      {userItems.map((item) => (
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
