import { connectBus, makeLogger, STREAMS } from '@aicrm/shared'
import { ensureIndices } from './config/meili.js'
import { env } from './config/env.js'
import { buildApp } from './app.js'
import { startSubscribers } from './events/subscribers.js'

const log = makeLogger('search-service')

async function start() {
  await ensureIndices().catch((err) => log.warn({ err }, 'meili setup failed; will retry on writes'))
  log.info('meili indices ready')

  try {
    const bus = await connectBus({
      servers: env.natsUrl,
      serviceName: 'search-service',
      streams: [STREAMS.REFERRALS, STREAMS.CAMPAIGNS, STREAMS.CONTENT],
    })
    log.info('nats connected')
    await startSubscribers(bus)
  } catch (e) {
    log.warn({ err: e }, 'NATS unavailable; running without subscribers')
  }

  const app = buildApp()
  app.listen(env.port, () => log.info(`search-service listening on :${env.port}`))
}

start().catch((err) => {
  log.error({ err }, 'failed to start')
  process.exit(1)
})
