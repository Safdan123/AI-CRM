import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { makeErrorHandler, notFound } from '@aicrm/shared'
import { env } from './config/env.js'
import { notificationsRouter } from './routes/notifications.js'

export function buildApp() {
  const app = express()
  app.use(helmet())
  app.disable('x-powered-by')
  app.use(cors({ origin: env.clientUrl, credentials: true }))
  app.use(express.json({ limit: '1mb' }))

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'notification-service' }))
  app.use('/api/notifications', notificationsRouter())

  app.use(notFound)
  app.use(makeErrorHandler('notification-service'))
  return app
}
