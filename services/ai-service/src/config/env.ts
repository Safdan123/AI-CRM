import dotenv from 'dotenv'
dotenv.config()

const isProd = process.env.NODE_ENV === 'production'

function required(name: string) {
  const v = process.env[name]
  if (!v?.trim()) throw new Error(`Missing required env: ${name}`)
  return v
}

export const env = {
  port: Number(process.env.PORT ?? 4010),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongoUri: isProd ? required('MONGODB_URI') : (process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/ai_db'),
  jwtSecret: isProd ? required('JWT_SECRET') : (process.env.JWT_SECRET ?? 'dev-secret-change-me'),
  natsUrl: process.env.NATS_URL ?? 'nats://127.0.0.1:4222',
  redisUrl: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  campaignServiceUrl: process.env.CAMPAIGN_SERVICE_URL ?? 'http://127.0.0.1:4003',
  referralServiceUrl: process.env.REFERRAL_SERVICE_URL ?? 'http://127.0.0.1:4004',
  provider: (process.env.AI_PROVIDER ?? 'ollama') as 'ollama' | 'openai',
  ollama: {
    url: process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434',
    model: process.env.OLLAMA_MODEL ?? 'llama3.2',
    embedModel: process.env.OLLAMA_EMBED_MODEL ?? 'nomic-embed-text',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    embedModel: process.env.OPENAI_EMBED_MODEL ?? 'text-embedding-3-small',
  },
}
