const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000'

const TOKEN_KEY = 'ai_crm_token'
type TokenPayload = {
  userId: string
  role: 'admin' | 'broker' | 'user' | 'support'
  email: string
  exp?: number
}

export function setAccessToken(token: string | null) {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY)
    return
  }
  localStorage.setItem(TOKEN_KEY, token)
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getTokenPayload(): TokenPayload | null {
  const token = getAccessToken()
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 2) return null

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const json = atob(padded)
    const parsed = JSON.parse(json) as Partial<TokenPayload>
    if (!parsed.userId || !parsed.role || !parsed.email) return null
    if (typeof parsed.exp === 'number' && parsed.exp * 1000 <= Date.now()) return null
    return parsed as TokenPayload
  } catch {
    return null
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  const payload = await response.json().catch(() => ({ message: 'Unexpected response.' }))
  if (!response.ok) {
    if (response.status === 401) {
      setAccessToken(null)
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    throw new Error(payload.message ?? 'Request failed.')
  }
  return payload as T
}
