import { env } from '../config/env.js'
import { redis } from '../config/redis.js'

const memoryCache = new Map<string, { rates: Record<string, number>; expiresAt: number }>()

export async function getRates(base = env.baseCurrency): Promise<Record<string, number>> {
  const cacheKey = `fx:${base}`
  const cached = await redis.get(cacheKey).catch(() => null)
  if (cached) {
    try {
      return JSON.parse(cached) as Record<string, number>
    } catch {
      // ignore
    }
  }
  const mem = memoryCache.get(cacheKey)
  if (mem && mem.expiresAt > Date.now()) return mem.rates

  try {
    const r = await fetch(`${env.fxApiUrl}?base=${base}`)
    if (!r.ok) throw new Error(`FX API ${r.status}`)
    const json = (await r.json()) as { rates?: Record<string, number> }
    const rates = json.rates ?? {}
    rates[base] = 1
    await redis.setex(cacheKey, env.fxTtlSeconds, JSON.stringify(rates)).catch(() => {})
    memoryCache.set(cacheKey, { rates, expiresAt: Date.now() + env.fxTtlSeconds * 1000 })
    return rates
  } catch {
    const fallback: Record<string, number> = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.78,
      PKR: 278,
      AED: 3.67,
      SAR: 3.75,
      INR: 83.2,
    }
    return fallback
  }
}

export async function convert(amount: number, from: string, to: string) {
  if (from === to) return { converted: amount, rate: 1 }
  const rates = await getRates(from)
  const rate = rates[to.toUpperCase()]
  if (!rate) return { converted: amount, rate: 1 }
  return { converted: amount * rate, rate }
}
