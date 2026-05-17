import dotenv from 'dotenv'
dotenv.config()

const isProd = process.env.NODE_ENV === 'production'

function required(name: string) {
  const v = process.env[name]
  if (!v?.trim()) throw new Error(`Missing required env: ${name}`)
  return v
}

export const env = {
  port: Number(process.env.PORT ?? 4004),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongoUri: isProd
    ? required('MONGODB_URI')
    : (process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/referrals_db'),
  jwtSecret: isProd ? required('JWT_SECRET') : (process.env.JWT_SECRET ?? 'dev-secret-change-me'),
  natsUrl: process.env.NATS_URL ?? 'nats://127.0.0.1:4222',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  campaignServiceUrl: process.env.CAMPAIGN_SERVICE_URL ?? 'http://campaign-service:4003',
  authServiceUrl: process.env.AUTH_SERVICE_URL ?? 'http://auth-service:4001',
  defaultRewardAmount: Number(process.env.DEFAULT_REWARD_AMOUNT ?? 100),
  defaultRewardCurrency: process.env.DEFAULT_REWARD_CURRENCY ?? 'USD',
}
