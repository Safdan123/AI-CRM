import { makeLogger } from '@aicrm/shared'
import { env } from './config/env.js'
import { buildApp } from './app.js'
import { startWorker } from './queue.js'

const log = makeLogger('report-service')

async function start() {
  startWorker()
  log.info('bullmq worker started')

  const app = buildApp()
  app.listen(env.port, () => log.info(`report-service listening on :${env.port}`))
}

start().catch((err) => {
  log.error({ err }, 'failed to start')
  process.exit(1)
})
