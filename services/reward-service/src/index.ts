import { connectBus, makeLogger, STREAMS } from '@aicrm/shared'
import { connectDb } from './config/db.js'
import { connectRedis } from './config/redis.js'
import { env } from './config/env.js'
import { buildApp } from './app.js'
import { startSubscribers } from './events/subscribers.js'

const log = makeLogger('reward-service')

async function start() {
  await connectDb()
  log.info('mongo connected')
  await connectRedis()

  let bus = null
  try {
    bus = await connectBus({
      servers: env.natsUrl,
      serviceName: 'reward-service',
      streams: [STREAMS.REFERRALS, STREAMS.REWARDS],
    })
    log.info('nats connected')
    await startSubscribers(bus)
  } catch (e) {
    log.warn({ err: e }, 'NATS unavailable; running without subscribers')
  }

  const app = buildApp(bus)
  app.listen(env.port, () => log.info(`reward-service listening on :${env.port}`))
}

start().catch((err) => {
  log.error({ err }, 'failed to start')
  process.exit(1)
})
