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
      rewardPerConversion: 250,
      minInvestmentAmount: 1000,
      requireVerifiedBeforeConvert: true,
      leaderboardTiers: [
        { rank: 1, rewardAmount: 500 },
        { rank: 2, rewardAmount: 300 },
        { rank: 3, rewardAmount: 200 },
        { rank: 4, rewardAmount: 100 },
        { rank: 5, rewardAmount: 50 },
      ],
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
      rewardPerConversion: 200,
      minInvestmentAmount: 500,
      requireVerifiedBeforeConvert: true,
      leaderboardTiers: [
        { rank: 1, rewardAmount: 400 },
        { rank: 2, rewardAmount: 250 },
        { rank: 3, rewardAmount: 150 },
      ],
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
      rewardPerConversion: 500,
      minInvestmentAmount: 0,
      requireVerifiedBeforeConvert: false,
      leaderboardTiers: [
        { rank: 1, rewardAmount: 1000 },
        { rank: 2, rewardAmount: 750 },
        { rank: 3, rewardAmount: 500 },
      ],
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
