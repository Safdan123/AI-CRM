import dotenv from 'dotenv'
dotenv.config()

const isProd = process.env.NODE_ENV === 'production'

function required(name: string) {
  const v = process.env[name]
  if (!v?.trim()) throw new Error(`Missing required env: ${name}`)
  return v
}

export const env = {
  port: Number(process.env.PORT ?? 4009),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongoUri: isProd
    ? required('MONGODB_URI')
    : (process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/analytics_db'),
  jwtSecret: isProd ? required('JWT_SECRET') : (process.env.JWT_SECRET ?? 'dev-secret-change-me'),
  natsUrl: process.env.NATS_URL ?? 'nats://127.0.0.1:4222',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  authServiceUrl: process.env.AUTH_SERVICE_URL ?? 'http://127.0.0.1:4001',
  rewardServiceUrl: process.env.REWARD_SERVICE_URL ?? 'http://127.0.0.1:4005',
}
