const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'

const ACCESS_KEY = 'ai_crm_token'
const REFRESH_KEY = 'ai_crm_refresh'

type TokenPayload = {
  userId: string
  role: 'admin' | 'broker' | 'user' | 'support'
  email: string
  exp?: number
}

export function setAccessToken(token: string | null) {
  if (!token) {
    localStorage.removeItem(ACCESS_KEY)
    return
  }
  localStorage.setItem(ACCESS_KEY, token)
}

export function setRefreshToken(token: string | null) {
  if (!token) {
    localStorage.removeItem(REFRESH_KEY)
    return
  }
  localStorage.setItem(REFRESH_KEY, token)
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY)
}

export function getApiBaseUrl() {
  return API_BASE_URL
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

let refreshing: Promise<boolean> | null = null

async function attemptRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false
  if (refreshing) return refreshing
  refreshing = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) return false
      const json = (await res.json()) as { data?: { accessToken?: string; refreshToken?: string } }
      if (json.data?.accessToken) setAccessToken(json.data.accessToken)
      if (json.data?.refreshToken) setRefreshToken(json.data.refreshToken)
      return Boolean(json.data?.accessToken)
    } catch {
      return false
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

async function send<T>(path: string, init: RequestInit, withAuth: boolean): Promise<T> {
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }
  if (withAuth) {
    const token = getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  if (response.status === 401 && withAuth) {
    const ok = await attemptRefresh()
    if (ok) return send<T>(path, init, withAuth)
    setAccessToken(null)
    setRefreshToken(null)
    if (window.location.pathname !== '/login') window.location.assign('/login')
  }
  const payload = await response
    .json()
    .catch(() => ({ message: response.statusText || 'Unexpected response.' }))
  if (!response.ok) {
    throw new Error((payload as { message?: string }).message ?? 'Request failed.')
  }
  return payload as T
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return send<T>(path, init ?? {}, true)
}

export async function apiFetchPublic<T>(path: string, init?: RequestInit): Promise<T> {
  return send<T>(path, init ?? {}, false)
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const headers = new Headers()
  const token = getAccessToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${API_BASE_URL}${path}`, { method: 'POST', headers, body: formData })
  const payload = await response.json().catch(() => ({ message: 'Unexpected response.' }))
  if (!response.ok) throw new Error((payload as { message?: string }).message ?? 'Upload failed.')
  return payload as T
}
