import dotenv from 'dotenv'
dotenv.config()

const isProd = process.env.NODE_ENV === 'production'

function required(name: string) {
  const v = process.env[name]
  if (!v?.trim()) throw new Error(`Missing required env: ${name}`)
  return v
}

export const env = {
  port: Number(process.env.PORT ?? 4008),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtSecret: isProd ? required('JWT_SECRET') : (process.env.JWT_SECRET ?? 'dev-secret-change-me'),
  natsUrl: process.env.NATS_URL ?? 'nats://127.0.0.1:4222',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  meiliHost: process.env.MEILI_HOST ?? 'http://127.0.0.1:7700',
  meiliKey: process.env.MEILI_API_KEY ?? 'masterKey-mabrook-dev',
}
