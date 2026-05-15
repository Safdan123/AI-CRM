import dotenv from 'dotenv'
dotenv.config()

const isProd = process.env.NODE_ENV === 'production'

function required(name: string) {
  const v = process.env[name]
  if (!v?.trim()) throw new Error(`Missing required env: ${name}`)
  return v
}

export const env = {
  port: Number(process.env.PORT ?? 4001),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongoUri: isProd ? required('MONGODB_URI') : (process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/auth_db'),
  jwtSecret: isProd ? required('JWT_SECRET') : (process.env.JWT_SECRET ?? 'dev-secret-change-me'),
  jwtRefreshSecret: isProd
    ? required('JWT_REFRESH_SECRET')
    : (process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-me'),
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? '15m',
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL ?? '7d',
  natsUrl: process.env.NATS_URL ?? 'nats://127.0.0.1:4222',
  redisUrl: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  allowSignupRoleSelection:
    process.env.SIGNUP_ALLOW_ROLE_SELECTION != null
      ? process.env.SIGNUP_ALLOW_ROLE_SELECTION === 'true'
      : !isProd,
}
