import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import type { JwtPayload, UserRole } from './types.js'

declare module 'express-serve-static-core' {
  interface Request {
    auth?: {
      userId: string
      role: UserRole
      email: string
    }
  }
}

export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>, secret: string, expiresIn = '15m') {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions)
}

export function signRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>, secret: string, expiresIn = '7d') {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions)
}

export function verifyToken(token: string, secret: string): JwtPayload {
  return jwt.verify(token, secret) as JwtPayload
}

export function makeRequireAuth(secret: string) {
  return function requireAuth(req: Request, res: Response, next: NextFunction) {
    const headerUserId = req.header('x-user-id')
    const headerRole = req.header('x-user-role') as UserRole | undefined
    const headerEmail = req.header('x-user-email')
    if (headerUserId && headerRole && headerEmail) {
      req.auth = { userId: headerUserId, role: headerRole, email: headerEmail }
      return next()
    }

    const authHeader = req.header('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return res.status(401).json({ message: 'Missing auth token.' })
    try {
      const payload = verifyToken(token, secret)
      req.auth = { userId: payload.userId, role: payload.role, email: payload.email }
      return next()
    } catch {
      return res.status(401).json({ message: 'Invalid or expired token.' })
    }
  }
}

export function requireRole(roles: UserRole[]) {
  const allowed = new Set<UserRole>(roles)
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ message: 'Unauthorized.' })
    const role = String(req.auth.role).trim() as UserRole
    if (!allowed.has(role)) {
      return res.status(403).json({
        message: 'Forbidden.',
        detail: { role, allowed: [...allowed] },
      })
    }
    next()
  }
}
