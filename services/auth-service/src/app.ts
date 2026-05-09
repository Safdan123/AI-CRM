import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { makeErrorHandler, notFound, type EventBus } from '@aicrm/shared'
import { env } from './config/env.js'
import { adminUsersRouter, authRouter } from './routes/auth.js'

export function buildApp(bus: EventBus | null) {
  const app = express()

  app.use(helmet())
  app.disable('x-powered-by')
  app.use(cors({ origin: env.clientUrl, credentials: true }))
  app.use(express.json({ limit: '1mb' }))

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    message: { message: 'Too many authentication attempts. Please try again later.' },
  })

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'auth-service' }))
  app.use('/api/auth', authLimiter, authRouter(bus))
  app.use('/api/admin', adminUsersRouter())

  app.use(notFound)
  app.use(makeErrorHandler('auth-service'))

  return app
}
