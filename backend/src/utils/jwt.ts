import jwt from 'jsonwebtoken'
import type { JwtPayload } from '../types/index.js'
import { env } from '../config/env.js'

export function signToken(payload: JwtPayload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '12h' })
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.jwtSecret) as JwtPayload
}
