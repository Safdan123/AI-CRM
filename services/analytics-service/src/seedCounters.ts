import { connectDb } from './config/db.js'
import { CounterModel, DailyCounterModel } from './models/Counter.js'

/** Demo totals for admin dashboard KPIs (`GET /api/admin/kpis`) — hundreds-scale for a modest demo tenant. */
const KPI_COUNTERS: Record<string, number> = {
  'users.user': 428,
  'users.broker': 62,
  'users.total': 490,
  'referrals.total': 512,
  'referrals.converted': 138,
  'referrals.pending': 94,
  'rewards.credit.amount.base': 742,
  'rewards.credit.count': 186,
}

async function seedDailyUserSignups() {
  const key = 'users.user'
  const days = 30
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const date = d.toISOString().slice(0, 10)
    const wave = Math.sin(i / 5) * 2
    const value = Math.max(1, Math.round(3 + wave + i * 0.05))
    await DailyCounterModel.updateOne({ key, date }, { $set: { key, date, value } }, { upsert: true })
  }
}

async function run() {
  await connectDb()
  for (const [key, value] of Object.entries(KPI_COUNTERS)) {
    await CounterModel.updateOne({ key }, { $set: { key, value } }, { upsert: true })
  }
  await seedDailyUserSignups()
  // eslint-disable-next-line no-console
  console.log('analytics-service seed: KPI + daily users.user counters set for demo dashboard')
  process.exit(0)
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
