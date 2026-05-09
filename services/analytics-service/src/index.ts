import { connectBus, makeLogger, STREAMS } from '@aicrm/shared'
import { connectDb } from './config/db.js'
import { env } from './config/env.js'
import { buildApp } from './app.js'
import { startSubscribers } from './events/subscribers.js'

const log = makeLogger('analytics-service')

async function start() {
  await connectDb()
  log.info('mongo connected')

  try {
    const bus = await connectBus({
      servers: env.natsUrl,
      serviceName: 'analytics-service',
      streams: [STREAMS.USERS, STREAMS.REFERRALS, STREAMS.REWARDS, STREAMS.CONTENT],
    })
    log.info('nats connected')
    await startSubscribers(bus)
  } catch (e) {
    log.warn({ err: e }, 'NATS unavailable; running without subscribers')
  }

  const app = buildApp()
  app.listen(env.port, () => log.info(`analytics-service listening on :${env.port}`))
}

start().catch((err) => {
  log.error({ err }, 'failed to start')
  process.exit(1)
})
