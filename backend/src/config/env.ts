import dotenv from 'dotenv'

dotenv.config()

const nodeEnv = process.env.NODE_ENV ?? 'development'
const isProduction = nodeEnv === 'production'

function required(name: string) {
  const value = process.env[name]
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: isProduction
    ? required('MONGODB_URI')
    : (process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/ai_crm'),
  jwtSecret: isProduction
    ? required('JWT_SECRET')
    : (process.env.JWT_SECRET ?? 'dev-secret-change-me'),
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  nodeEnv,
  allowSignupRoleSelection:
    process.env.SIGNUP_ALLOW_ROLE_SELECTION != null
      ? process.env.SIGNUP_ALLOW_ROLE_SELECTION === 'true'
      : !isProduction,
}
