import { connectDb } from './config/db.js'
import { BlogModel } from './models/Blog.js'
import { PublicConfigModel } from './models/PublicConfig.js'

async function run() {
  await connectDb()
  await BlogModel.deleteMany({})
  await PublicConfigModel.deleteMany({})

  await BlogModel.create([
    {
      title: 'Welcome to Mabrook Rewards',
      slug: 'welcome-to-mabrook-rewards',
      body: '# Welcome\n\nMabrook Rewards is your gateway to broker-driven referrals with transparent, multi-currency payouts.',
      excerpt: 'Kick off your journey with Mabrook Rewards.',
      authorId: 'system',
      tags: ['announcement'],
      status: 'published',
      publishedAt: new Date(),
    },
    {
      title: 'How conversion rewards work',
      slug: 'how-conversion-rewards-work',
      body: '## Rewards lifecycle\n\n1. Broker submits referral.\n2. Admin reviews.\n3. On conversion, the reward is credited automatically.',
      excerpt: 'A quick explainer on the referral lifecycle.',
      authorId: 'system',
      tags: ['guide'],
      status: 'published',
      publishedAt: new Date(),
    },
  ])

  await PublicConfigModel.create({
    key: 'contact',
    value: {
      email: 'support@mabrook.app',
      phone: '+92 300 0000000',
      address: 'Lahore, Pakistan',
      googleMapUrl: 'https://maps.google.com/?q=Lahore',
      social: {
        facebook: 'https://facebook.com',
        instagram: 'https://instagram.com',
        linkedin: 'https://linkedin.com',
      },
    },
  })

  // eslint-disable-next-line no-console
  console.log('content-service seed: 2 blogs + contact config')
  process.exit(0)
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
