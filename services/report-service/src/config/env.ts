import dotenv from 'dotenv'
dotenv.config()

const isProd = process.env.NODE_ENV === 'production'

function required(name: string) {
  const v = process.env[name]
  if (!v?.trim()) throw new Error(`Missing required env: ${name}`)
  return v
}

export const env = {
  port: Number(process.env.PORT ?? 4011),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtSecret: isProd ? required('JWT_SECRET') : (process.env.JWT_SECRET ?? 'dev-secret-change-me'),
  redisUrl: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  rewardServiceUrl: process.env.REWARD_SERVICE_URL ?? 'http://127.0.0.1:4005',
}
