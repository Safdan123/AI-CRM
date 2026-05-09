import { connectDb } from './config/db.js'
import { CampaignModel } from './models/Campaign.js'

async function run() {
  await connectDb()
  await CampaignModel.deleteMany({})
  await CampaignModel.create([
    {
      name: 'Mabrook Spring Drive',
      description: 'Spring 2026 broker referral campaign',
      startDate: '2026-05-05',
      endDate: '2026-06-05',
      totalRewardAmount: 250,
      rewardCurrency: 'USD',
      linkCode: 'MABROOK-SPRING-XK9Z',
      createdBy: 'system',
      tags: ['spring', 'rewards'],
    },
    {
      name: 'Eid Cashback Campaign',
      description: 'Cashback for converted referrals',
      startDate: '2026-04-01',
      endDate: '2026-05-01',
      totalRewardAmount: 200,
      rewardCurrency: 'AED',
      linkCode: 'EID-CASHBACK-R7LQ',
      createdBy: 'system',
      tags: ['eid', 'cashback'],
    },
    {
      name: 'Premium Brokers Q3',
      description: 'High-tier broker tier rewards',
      startDate: '2026-07-01',
      endDate: '2026-09-30',
      totalRewardAmount: 500,
      rewardCurrency: 'PKR',
      linkCode: 'PREMIUM-Q3-T8ZP',
      createdBy: 'system',
      tags: ['premium', 'tier'],
    },
  ])
  // eslint-disable-next-line no-console
  console.log('campaign-service seed: 3 campaigns')
  process.exit(0)
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
