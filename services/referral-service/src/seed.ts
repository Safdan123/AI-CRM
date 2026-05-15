import { connectDb } from './config/db.js'
import { ReferralModel } from './models/Referral.js'

async function run() {
  await connectDb()
  await ReferralModel.deleteMany({})
  // eslint-disable-next-line no-console
  console.log('referral-service seed: cleared (real data populated via app flows)')
  process.exit(0)
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
