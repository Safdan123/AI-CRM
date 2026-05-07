import type { NextFunction, Request, Response } from 'express'
import type { UserRole } from '../types/index.js'
import { verifyToken } from '../utils/jwt.js'

declare module 'express-serve-static-core' {
  interface Request {
    auth?: {
      userId: string
      role: UserRole
      email: string
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Missing auth token.' })

  try {
    const payload = verifyToken(token)
    req.auth = { userId: payload.userId, role: payload.role, email: payload.email }
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }
}

export function requireRole(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ message: 'Unauthorized.' })
    if (!roles.includes(req.auth.role)) return res.status(403).json({ message: 'Forbidden.' })
    next()
  }
}
