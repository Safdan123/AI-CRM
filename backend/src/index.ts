import { connectDb } from './config/db.js'
import { env } from './config/env.js'
import { app } from './app.js'

async function start() {
  await connectDb()
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend running on http://localhost:${env.port}`)
  })
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start backend', err)
  process.exit(1)
})
