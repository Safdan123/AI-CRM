export type UserRole = 'admin' | 'broker' | 'user' | 'support'
export type ReferralStatus = 'pending' | 'verified' | 'converted' | 'rejected'

export type JwtPayload = {
  userId: string
  role: UserRole
  email: string
  iat?: number
  exp?: number
}

export type ApiResult<T> = {
  data: T
  message?: string
}

export type Currency = 'USD' | 'EUR' | 'GBP' | 'PKR' | 'AED' | 'SAR' | 'INR'
export const SUPPORTED_CURRENCIES: Currency[] = [
  'USD',
  'EUR',
  'GBP',
  'PKR',
  'AED',
  'SAR',
  'INR',
]
