const INVITE_CODE_KEY = 'mabrook_invite_code'

export function setPendingInviteCode(inviteCode: string) {
  const code = inviteCode.trim().toUpperCase()
  if (!code) return
  sessionStorage.setItem(INVITE_CODE_KEY, code)
}

export function getPendingInviteCode() {
  return sessionStorage.getItem(INVITE_CODE_KEY)?.trim().toUpperCase() ?? ''
}

export function clearPendingInviteCode() {
  sessionStorage.removeItem(INVITE_CODE_KEY)
}
