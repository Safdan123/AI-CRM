import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { makeErrorHandler, notFound, type EventBus } from '@aicrm/shared'
import { env } from './config/env.js'
import { acceptanceRouter, adminReferralsRouter, referralsRouter } from './routes/referrals.js'

export function buildApp(bus: EventBus | null) {
  const app = express()
  app.use(helmet())
  app.disable('x-powered-by')
  app.use(cors({ origin: env.clientUrl, credentials: true }))
  app.use(express.json({ limit: '1mb' }))

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'referral-service' }))
  app.use('/api/referrals', referralsRouter(bus))
  app.use('/api/admin/referrals', adminReferralsRouter(bus))
  app.use('/api', acceptanceRouter(bus))

  app.use(notFound)
  app.use(makeErrorHandler('referral-service'))
  return app
}
