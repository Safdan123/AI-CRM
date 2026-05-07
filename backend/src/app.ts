import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env.js'
import { errorHandler, notFound } from './middleware/error.js'
import { router } from './routes.js'

export const app = express()

app.use(helmet())
app.disable('x-powered-by')
app.use(cors({ origin: env.clientUrl, credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use(morgan('dev'))

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  message: { message: 'Too many authentication attempts. Please try again later.' },
})

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
  }),
)
app.use('/api/auth', authLimiter)

app.use(router)
app.use(notFound)
app.use(errorHandler)
