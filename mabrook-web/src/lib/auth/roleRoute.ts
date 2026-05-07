import type { UserRole } from '../api/types'
import { paths } from '../../config/paths'

export function getDashboardRouteByRole(role: UserRole) {
  if (role === 'admin' || role === 'support') return paths.admin.dashboard
  if (role === 'broker') return paths.dashboard
  return paths.user.dashboard
}
