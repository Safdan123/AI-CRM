import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { makeErrorHandler, notFound } from '@aicrm/shared'
import { env } from './config/env.js'
import { searchRouter } from './routes/search.js'

export function buildApp() {
  const app = express()
  app.use(helmet())
  app.disable('x-powered-by')
  app.use(cors({ origin: env.clientUrl, credentials: true }))
  app.use(express.json({ limit: '1mb' }))

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'search-service' }))
  app.use('/api/search', searchRouter())

  app.use(notFound)
  app.use(makeErrorHandler('search-service'))
  return app
}
