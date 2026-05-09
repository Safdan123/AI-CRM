import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { makeErrorHandler, notFound, type EventBus } from '@aicrm/shared'
import { env } from './config/env.js'
import { rewardsRouter } from './routes/rewards.js'

export function buildApp(bus: EventBus | null) {
  const app = express()
  app.use(helmet())
  app.disable('x-powered-by')
  app.use(cors({ origin: env.clientUrl, credentials: true }))
  app.use(express.json({ limit: '1mb' }))

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'reward-service' }))
  app.use('/api/rewards', rewardsRouter(bus))

  app.use(notFound)
  app.use(makeErrorHandler('reward-service'))
  return app
}
