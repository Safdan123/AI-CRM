import { connectBus, makeLogger, STREAMS } from '@aicrm/shared'
import { connectDb } from './config/db.js'
import { env } from './config/env.js'
import { buildApp } from './app.js'

const log = makeLogger('referral-service')

async function start() {
  await connectDb()
  log.info('mongo connected')

  let bus = null
  try {
    bus = await connectBus({
      servers: env.natsUrl,
      serviceName: 'referral-service',
      streams: [STREAMS.REFERRALS],
    })
    log.info('nats connected')
  } catch (e) {
    log.warn({ err: e }, 'NATS unavailable; running degraded')
  }

  const app = buildApp(bus)
  app.listen(env.port, () => log.info(`referral-service listening on :${env.port}`))
}

start().catch((err) => {
  log.error({ err }, 'failed to start')
  process.exit(1)
})
