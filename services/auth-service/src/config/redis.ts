import IORedis from 'ioredis'
import { env } from './env.js'

export const redis = new IORedis(env.redisUrl, { lazyConnect: true })

export async function connectRedis() {
  if (redis.status === 'ready' || redis.status === 'connecting') return
  await redis.connect()
}
