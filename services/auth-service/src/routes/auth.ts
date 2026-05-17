import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { nanoid } from 'nanoid'
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
import { LoginActivityModel } from '../models/LoginActivity.js'
import { UserModel } from '../models/User.js'
import { sendEmail } from '../services/mailer.js'
import { recordLoginActivity } from '../services/loginActivity.js'

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
    await recordLoginActivity(req, { email: user.email, userId: user.id, success: true })

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
    if (!user) {
      await recordLoginActivity(req, { email: input.email, success: false, failureReason: 'invalid_email' })
      return res.status(401).json({ message: 'Invalid credentials.' })
    }
    const valid = await bcrypt.compare(input.password, user.passwordHash)
    if (!valid) {
      await recordLoginActivity(req, {
        email: input.email,
        userId: user.id,
        success: false,
        failureReason: 'invalid_password',
      })
      return res.status(401).json({ message: 'Invalid credentials.' })
    }

    const tokens = await issueTokens(user.id, user.role, user.email)
    await recordLoginActivity(req, { email: user.email, userId: user.id, success: true })
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

  router.post('/forgot-password', async (req, res) => {
    const { email } = z.object({ email: z.string().email() }).parse(req.body)
    const user = await UserModel.findOne({ email })
    if (user) {
      const token = nanoid(48)
      await redis.set(`password-reset:${token}`, user.id, 'EX', 60 * 60)
      const resetUrl = `${env.clientUrl}/reset-password?token=${encodeURIComponent(token)}`
      await sendEmail(
        user.email,
        'Reset your Mabrook password',
        `<p>Hello ${user.fullName},</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 1 hour.</p>`,
      )
    }
    return res.json(ok({ message: 'If that email exists, a reset link has been sent.' }))
  })

  router.post('/reset-password', async (req, res) => {
    const body = z
      .object({
        token: z.string().min(10),
        password: z.string().min(6),
      })
      .parse(req.body)
    const userId = await redis.get(`password-reset:${body.token}`)
    if (!userId) return res.status(400).json({ message: 'Invalid or expired reset token.' })
    const user = await UserModel.findById(userId)
    if (!user) return res.status(404).json({ message: 'User not found.' })
    user.passwordHash = await bcrypt.hash(body.password, 10)
    await user.save()
    await redis.del(`password-reset:${body.token}`)
    await redis.del(`refresh:${user.id}`)
    return res.json(ok({ message: 'Password updated. You can sign in with your new password.' }))
  })

  router.patch('/change-password', requireAuth, async (req, res) => {
    const body = z
      .object({
        currentPassword: z.string().min(6),
        newPassword: z.string().min(6),
      })
      .parse(req.body)
    const user = await UserModel.findById(req.auth!.userId)
    if (!user) return res.status(404).json({ message: 'User not found.' })
    const valid = await bcrypt.compare(body.currentPassword, user.passwordHash)
    if (!valid) return res.status(400).json({ message: 'Current password is incorrect.' })
    user.passwordHash = await bcrypt.hash(body.newPassword, 10)
    await user.save()
    await redis.del(`refresh:${user.id}`)
    return res.json(ok({ message: 'Password changed successfully.' }))
  })

  router.get('/me/login-activity', requireAuth, async (req, res) => {
    const rows = await LoginActivityModel.find({ userId: req.auth!.userId })
      .sort({ createdAt: -1 })
      .limit(20)
    return res.json(
      ok(
        rows.map((r) => ({
          id: r.id,
          success: r.success,
          ip: r.ip,
          userAgent: r.userAgent,
          failureReason: r.failureReason,
          createdAt: r.createdAt.toISOString(),
        })),
      ),
    )
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

  router.get('/security/login-activity', requireAuth, async (req, res) => {
    if (req.auth!.role !== 'admin' && req.auth!.role !== 'support') {
      return res.status(403).json({ message: 'Forbidden.' })
    }
    const page = Math.max(1, Number(req.query.page ?? 1))
    const pageSize = Math.min(200, Math.max(1, Number(req.query.pageSize ?? 50)))
    const email = String(req.query.email ?? '').trim()
    const filter = email ? { email: new RegExp(email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } : {}
    const [items, total] = await Promise.all([
      LoginActivityModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize),
      LoginActivityModel.countDocuments(filter),
    ])
    return res.json(
      ok({
        items: items.map((r) => ({
          id: r.id,
          userId: r.userId,
          email: r.email,
          success: r.success,
          failureReason: r.failureReason,
          ip: r.ip,
          userAgent: r.userAgent,
          createdAt: r.createdAt.toISOString(),
        })),
        page,
        pageSize,
        total,
      }),
    )
  })

  return router
}
