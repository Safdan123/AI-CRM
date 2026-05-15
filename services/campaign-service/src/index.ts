import { connectBus, makeLogger, STREAMS } from '@aicrm/shared'
import { connectDb } from './config/db.js'
import { env } from './config/env.js'
import { buildApp } from './app.js'

const log = makeLogger('campaign-service')

async function start() {
  await connectDb()
  log.info('mongo connected')

  let bus = null
  try {
    bus = await connectBus({
      servers: env.natsUrl,
      serviceName: 'campaign-service',
      streams: [STREAMS.CAMPAIGNS],
    })
    log.info('nats connected')
  } catch (e) {
    log.warn({ err: e }, 'NATS unavailable; running degraded')
  }

  const app = buildApp(bus)
  app.listen(env.port, () => log.info(`campaign-service listening on :${env.port}`))
}

start().catch((err) => {
  log.error({ err }, 'failed to start')
  process.exit(1)
})
