export type UserRole = 'admin' | 'broker' | 'user' | 'support'
export type ReferralStatus = 'pending' | 'verified' | 'converted' | 'rejected'

export type JwtPayload = {
  userId: string
  role: UserRole
  email: string
}
