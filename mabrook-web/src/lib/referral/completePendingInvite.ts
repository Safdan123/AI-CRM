import { acceptBrokerInvite } from '../api/realServices'
import { getTokenPayload } from '../api/http'
import { clearPendingInviteCode, getPendingInviteCode } from './inviteStorage'

export type InviteCompletionResult =
  | { status: 'none' }
  | { status: 'skipped'; reason: string }
  | { status: 'accepted'; campaignId: string; referralId?: string }
  | { status: 'already'; campaignId: string }
  | { status: 'error'; message: string }

export async function completePendingInvite(): Promise<InviteCompletionResult> {
  const code = getPendingInviteCode()
  if (!code) return { status: 'none' }

  const payload = getTokenPayload()
  if (!payload) return { status: 'skipped', reason: 'not_authenticated' }
  if (payload.role !== 'user') {
    clearPendingInviteCode()
    return { status: 'skipped', reason: 'not_end_user' }
  }

  try {
    const res = await acceptBrokerInvite(code)
    clearPendingInviteCode()
    if (res.data.alreadyAccepted) {
      return { status: 'already', campaignId: res.data.campaignId }
    }
    return {
      status: 'accepted',
      campaignId: res.data.campaignId,
      referralId: res.data.referralId,
    }
  } catch (err) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Failed to join campaign.',
    }
  }
}
