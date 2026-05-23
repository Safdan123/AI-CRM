import { createServer } from 'node:http'
import { connectBus, makeLogger, STREAMS } from '@aicrm/shared'
import { connectDb } from './config/db.js'
import { env } from './config/env.js'
import { buildApp } from './app.js'
import { startSubscribers } from './events/subscribers.js'
import { attachRealtime } from './services/realtime.js'

const log = makeLogger('notification-service')

async function start() {
  await connectDb()
  log.info('mongo connected')

  const app = buildApp()
  const httpServer = createServer(app)
  attachRealtime(httpServer)

  try {
    const bus = await connectBus({
      servers: env.natsUrl,
      serviceName: 'notification-service',
      streams: [STREAMS.USERS, STREAMS.REFERRALS, STREAMS.REWARDS, STREAMS.CONTENT, STREAMS.NOTIFICATIONS],
    })
    log.info('nats connected')
    await startSubscribers(bus)
  } catch (e) {
    log.warn({ err: e }, 'NATS unavailable; running without subscribers')
  }

  httpServer.listen(env.port, () => log.info(`notification-service listening on :${env.port}`))
}

start().catch((err) => {
  log.error({ err }, 'failed to start')
  process.exit(1)
})
