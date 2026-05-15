import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { z } from 'zod'
import {
  EVENTS,
  makeRequireAuth,
  ok,
  signAccessToken,
  signRefreshToken,
  verifyToken,
  type EventBus,
  type UserRegisteredEvent,
} from '@aicrm/shared'
import { env } from '../config/env.js'
import { redis } from '../config/redis.js'
import { UserModel } from '../models/User.js'

const requireAuth = makeRequireAuth(env.jwtSecret)

const signupSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'broker', 'user', 'support']).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

async function issueTokens(userId: string, role: 'admin' | 'broker' | 'user' | 'support', email: string) {
  const access = signAccessToken({ userId, role, email }, env.jwtSecret, env.accessTokenTtl)
  const refresh = signRefreshToken({ userId, role, email }, env.jwtRefreshSecret, env.refreshTokenTtl)
  await redis.set(`refresh:${userId}`, refresh, 'EX', 60 * 60 * 24 * 7)
  return { accessToken: access, refreshToken: refresh }
}

export function authRouter(bus: EventBus | null) {
  const router = Router()

  router.post('/signup', async (req, res) => {
    const input = signupSchema.parse(req.body)
    const exists = await UserModel.findOne({ email: input.email })
    if (exists) return res.status(409).json({ message: 'Email already exists.' })

    const passwordHash = await bcrypt.hash(input.password, 10)
    const role = env.allowSignupRoleSelection ? (input.role ?? 'user') : 'user'
    const user = await UserModel.create({
      fullName: input.fullName,
      email: input.email,
      passwordHash,
      role,
    })

    const tokens = await issueTokens(user.id, user.role, user.email)

    if (bus) {
      const evt: UserRegisteredEvent = {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        occurredAt: new Date().toISOString(),
      }
      await bus.publish(EVENTS.USER_REGISTERED, evt)
    }

    return res.status(201).json(
      ok({
        user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
        ...tokens,
      }),
    )
  })

  router.post('/login', async (req, res) => {
    const input = loginSchema.parse(req.body)
    const user = await UserModel.findOne({ email: input.email })
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' })
    const valid = await bcrypt.compare(input.password, user.passwordHash)
    if (!valid) return res.status(401).json({ message: 'Invalid credentials.' })

    const tokens = await issueTokens(user.id, user.role, user.email)
    return res.json(
      ok({
        user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
        ...tokens,
      }),
    )
  })

  router.post('/refresh', async (req, res) => {
    const body = z.object({ refreshToken: z.string() }).parse(req.body)
    let payload
    try {
      payload = verifyToken(body.refreshToken, env.jwtRefreshSecret)
    } catch {
      return res.status(401).json({ message: 'Invalid refresh token.' })
    }
    const stored = await redis.get(`refresh:${payload.userId}`)
    if (stored !== body.refreshToken) {
      return res.status(401).json({ message: 'Refresh token revoked.' })
    }
    const user = await UserModel.findById(payload.userId)
    if (!user) return res.status(404).json({ message: 'User not found.' })

    const tokens = await issueTokens(user.id, user.role, user.email)
    return res.json(ok(tokens))
  })

  router.get('/me', requireAuth, async (req, res) => {
    const user = await UserModel.findById(req.auth!.userId)
    if (!user) return res.status(404).json({ message: 'User not found.' })
    return res.json(ok({ id: user.id, fullName: user.fullName, email: user.email, role: user.role }))
  })

  router.post('/logout', requireAuth, async (req, res) => {
    await redis.del(`refresh:${req.auth!.userId}`)
    return res.json(ok({ ok: true }))
  })

  router.get('/_internal/users', async (req, res) => {
    if (req.header('x-internal-key') !== env.jwtSecret) {
      return res.status(403).json({ message: 'Forbidden.' })
    }
    const ids = String(req.query.ids ?? '').split(',').filter(Boolean)
    const filter = ids.length ? { _id: { $in: ids } } : {}
    const users = await UserModel.find(filter).limit(500)
    return res.json(
      ok(users.map((u) => ({ id: u.id, fullName: u.fullName, email: u.email, role: u.role }))),
    )
  })

  return router
}

export function adminUsersRouter() {
  const router = Router()
  router.get('/users', requireAuth, async (req, res) => {
    if (req.auth!.role !== 'admin' && req.auth!.role !== 'support') {
      return res.status(403).json({ message: 'Forbidden.' })
    }
    const page = Math.max(1, Number(req.query.page ?? 1))
    const pageSize = Math.min(500, Math.max(1, Number(req.query.pageSize ?? 100)))
    const [users, total] = await Promise.all([
      UserModel.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize),
      UserModel.countDocuments(),
    ])
    const totalPages = Math.ceil(total / pageSize)
    return res.json(
      ok(
        users.map((u) => ({ id: u.id, fullName: u.fullName, email: u.email, role: u.role })),
        `page ${page} / ${totalPages}`,
      ),
    )
  })
  return router
}
