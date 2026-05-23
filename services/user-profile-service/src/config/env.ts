import dotenv from 'dotenv'
dotenv.config()

const isProd = process.env.NODE_ENV === 'production'

function required(name: string) {
  const v = process.env[name]
  if (!v?.trim()) throw new Error(`Missing required env: ${name}`)
  return v
}

export const env = {
  port: Number(process.env.PORT ?? 4002),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongoUri: isProd ? required('MONGODB_URI') : (process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/users_db'),
  jwtSecret: isProd ? required('JWT_SECRET') : (process.env.JWT_SECRET ?? 'dev-secret-change-me'),
  natsUrl: process.env.NATS_URL ?? 'nats://127.0.0.1:4222',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  minio: {
    endpoint: process.env.MINIO_ENDPOINT ?? '127.0.0.1',
    port: Number(process.env.MINIO_PORT ?? 9000),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
    bucket: process.env.MINIO_BUCKET ?? 'avatars',
  },
  publicFilesUrl: process.env.PUBLIC_FILES_URL ?? 'http://localhost:9000',
}
