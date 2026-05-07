import bcrypt from 'bcryptjs'
import { connectDb } from './config/db.js'
import { CampaignModel } from './models/Campaign.js'
import { ReferralModel } from './models/Referral.js'
import { RewardLedgerModel } from './models/RewardLedger.js'
import { UserModel } from './models/User.js'

async function run() {
  await connectDb()
  await Promise.all([
    UserModel.deleteMany({}),
    CampaignModel.deleteMany({}),
    ReferralModel.deleteMany({}),
    RewardLedgerModel.deleteMany({}),
  ])

  const passwordHash = await bcrypt.hash('password123', 10)
  const [admin, broker, user] = await UserModel.create([
    { fullName: 'Admin User', email: 'admin@mabrook.app', passwordHash, role: 'admin' },
    { fullName: 'Broker User', email: 'broker@mabrook.app', passwordHash, role: 'broker' },
    { fullName: 'End User', email: 'user@mabrook.app', passwordHash, role: 'user' },
  ])

  const [campaign10, campaign9] = await CampaignModel.create([
    {
      name: 'Campaign 10',
      startDate: '2026-05-05',
      endDate: '2026-06-05',
      totalRewardAmount: 250,
      linkCode: 'BROKER-10-XK9Z',
      createdBy: admin._id,
    },
    {
      name: 'Campaign 9',
      startDate: '2026-04-01',
      endDate: '2026-05-01',
      totalRewardAmount: 200,
      linkCode: 'BROKER-9-R7LQ',
      createdBy: admin._id,
    },
  ])

  const referrals = await ReferralModel.create(
    Array.from({ length: 12 }, (_, i) => ({
      brokerId: broker._id,
      customerName: `Customer ${i + 1}`,
      phone: `+92 301 0000${String(i + 1).padStart(3, '0')}`,
      campaignId: i % 2 === 0 ? campaign10._id : campaign9._id,
      status: ['pending', 'verified', 'converted', 'rejected'][i % 4],
    })),
  )

  await RewardLedgerModel.create({
    userId: broker._id,
    referralId: referrals[2]._id,
    amount: 100,
    entryType: 'credit',
    description: 'Seed conversion reward',
  })

  // eslint-disable-next-line no-console
  console.log('Seed complete.')
  // eslint-disable-next-line no-console
  console.log('Demo users: admin@mabrook.app, broker@mabrook.app, user@mabrook.app')
  // eslint-disable-next-line no-console
  console.log('Password: password123')
  process.exit(0)
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
