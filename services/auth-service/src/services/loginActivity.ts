import type { Request } from 'express'
import { LoginActivityModel } from '../models/LoginActivity.js'

function clientIp(req: Request) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim() ?? req.ip
  return req.ip ?? 'unknown'
}

export async function recordLoginActivity(
  req: Request,
  input: {
    email: string
    userId?: string
    success: boolean
    failureReason?: string
  },
) {
  const ip = clientIp(req)
  const userAgent = String(req.headers['user-agent'] ?? 'unknown').slice(0, 500)
  await LoginActivityModel.create({
    userId: input.userId,
    email: input.email.toLowerCase(),
    success: input.success,
    failureReason: input.failureReason,
    ip,
    userAgent,
  })
}
