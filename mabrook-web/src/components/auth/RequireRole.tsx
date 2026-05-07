import { Navigate, Outlet } from 'react-router-dom'
import { paths } from '../../config/paths'
import { getTokenPayload } from '../../lib/api/http'
import { getDashboardRouteByRole } from '../../lib/auth/roleRoute'
import type { UserRole } from '../../lib/api/types'

type RequireRoleProps = {
  allow: UserRole[]
}

export function RequireRole({ allow }: RequireRoleProps) {
  const payload = getTokenPayload()
  if (!payload) return <Navigate to={paths.login} replace />
  if (!allow.includes(payload.role)) return <Navigate to={getDashboardRouteByRole(payload.role)} replace />
  return <Outlet />
}
