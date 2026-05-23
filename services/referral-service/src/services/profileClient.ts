import { env } from '../config/env.js'

export type ProfileSnapshot = {
  userId: string
  fullName: string
  email: string
  phone?: string
}

export async function fetchProfile(userId: string): Promise<ProfileSnapshot | null> {
  const base = env.userProfileServiceUrl ?? 'http://user-profile-service:4002'
  try {
    const res = await fetch(`${base}/api/profile/_internal/list?ids=${encodeURIComponent(userId)}`, {
      headers: { 'x-internal-key': env.jwtSecret },
    })
    if (!res.ok) return null
    const json = (await res.json()) as {
      data: Array<{ id: string; fullName: string; email: string; phone?: string }>
    }
    const p = json.data[0]
    if (!p) return null
    return { userId: p.id, fullName: p.fullName, email: p.email, phone: p.phone }
  } catch {
    return null
  }
}
