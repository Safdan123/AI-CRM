import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { makeErrorHandler, notFound, type EventBus } from '@aicrm/shared'
import { env } from './config/env.js'
import { blogsRouter } from './routes/blogs.js'
import { publicRouter } from './routes/public.js'

export function buildApp(bus: EventBus | null) {
  const app = express()
  app.use(helmet())
  app.disable('x-powered-by')
  app.use(cors({ origin: env.clientUrl, credentials: true }))
  app.use(express.json({ limit: '1mb' }))

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'content-service' }))
  app.use('/api/blogs', blogsRouter(bus))
  app.use('/api/public', publicRouter())

  app.use(notFound)
  app.use(makeErrorHandler('content-service'))
  return app
}
