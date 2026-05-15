import { connectBus, makeLogger, STREAMS } from '@aicrm/shared'
import { connectDb } from './config/db.js'
import { connectRedis } from './config/redis.js'
import { env } from './config/env.js'
import { buildApp } from './app.js'

const log = makeLogger('auth-service')

async function start() {
  await connectDb()
  log.info('mongo connected')
  await connectRedis()
  log.info('redis connected')

  let bus = null
  try {
    bus = await connectBus({
      servers: env.natsUrl,
      serviceName: 'auth-service',
      streams: [STREAMS.USERS],
    })
    log.info('nats connected')
  } catch (e) {
    log.warn({ err: e }, 'NATS unavailable; continuing without event bus')
  }

  const app = buildApp(bus)
  app.listen(env.port, () => log.info(`auth-service listening on :${env.port}`))
}

start().catch((err) => {
  log.error({ err }, 'failed to start')
  process.exit(1)
})
