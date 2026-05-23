import type { UserRole } from '../api/types'
import { paths } from '../../config/paths'
import { getDashboardRouteByRole } from '../auth/roleRoute'
import { completePendingInvite } from './completePendingInvite'

export async function navigateAfterAuth(role: UserRole, navigate: (path: string) => void) {
  if (role === 'user') {
    const invite = await completePendingInvite()
    if (invite.status === 'accepted' || invite.status === 'already') {
      navigate(paths.user.campaignDetail(invite.campaignId))
      return
    }
  }
  navigate(getDashboardRouteByRole(role))
}
