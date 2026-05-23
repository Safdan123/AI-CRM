import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { makeErrorHandler, notFound } from '@aicrm/shared'
import { env } from './config/env.js'
import { aiRouter } from './routes/ai.js'

export function buildApp() {
  const app = express()
  app.set('trust proxy', 1)
  app.use(helmet())
  app.disable('x-powered-by')
  app.use(cors({ origin: env.clientUrl, credentials: true }))
  app.use(express.json({ limit: '1mb' }))

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'ai-service' }))
  const router = aiRouter()
  app.use('/api', router)

  app.use(notFound)
  app.use(makeErrorHandler('ai-service'))
  return app
}
