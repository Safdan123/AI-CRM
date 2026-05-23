import { makeLogger } from '@aicrm/shared'
import { connectDb } from '../config/db.js'
import type { CustomerFeatures, LeadFeatures } from '../models/SyntheticScoringEntity.js'
import { SyntheticScoringEntityModel } from '../models/SyntheticScoringEntity.js'

const log = makeLogger('ai-service-synthetic-seed')

/** Serializes concurrent first-hit seeding from parallel GET handlers. */
let seedChain: Promise<void> = Promise.resolve()

const FIRST = [
  'Ayesha',
  'Omar',
  'Sara',
  'Hassan',
  'Fatima',
  'Zain',
  'Noor',
  'Bilal',
  'Maryam',
  'Yusuf',
  'Layla',
  'Ibrahim',
  'Hana',
  'Khalid',
  'Amna',
]
const LAST = ['Rahman', 'Khan', 'Malik', 'Abbas', 'Hussain', 'Farooq', 'Siddiqui', 'Qureshi', 'Mirza', 'Butt']
const REGIONS = ['Lahore', 'Karachi', 'Islamabad', 'Faisalabad', 'Multan', 'Peshawar']
const BROKERS = ['Al Mabrook Partner East', 'Al Mabrook Partner North', 'Community Broker Desk', 'Retail Referral Hub']

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(rnd: () => number, arr: T[]) {
  return arr[Math.floor(rnd() * arr.length)]!
}

function rnd(rnd: () => number, lo: number, hi: number) {
  return lo + rnd() * (hi - lo)
}

function genLeadFeatures(r: () => number): LeadFeatures {
  return {
    daysInStage: Math.round(rnd(r, 1, 55)),
    contactCompleteness: rnd(r, 0.2, 1),
    campaignRewardBand: Math.max(1, Math.min(5, Math.round(rnd(r, 1, 5.4)))),
    brokerConversionProxy: rnd(r, 0.15, 0.92),
    duplicateRiskFlag: r() < 0.12 ? 1 : 0,
    engagementVelocity: rnd(r, 0.05, 0.95),
  }
}

function genCustomerFeatures(r: () => number): CustomerFeatures {
  return {
    daysSinceLastActivity: Math.round(rnd(r, 2, 95)),
    acceptedCampaigns90d: Math.round(rnd(r, 0, 6)),
    referralsMade90d: Math.round(rnd(r, 0, 4)),
    rewardsBalanceProxy: rnd(r, 0, 95),
    supportTicketsProxy: rnd(r, 0, 1),
    rewardVelocity90d: rnd(r, -12, 38),
  }
}

function buildRows() {
  const LEAD_COUNT = 260
  const CUSTOMER_COUNT = 260
  const rndLead = mulberry32(0x11ead)
  const rndCust = mulberry32(0xc85701)

  const leads = [] as Array<{
    kind: 'lead'
    externalKey: string
    displayName: string
    brokerName: string
    region: string
    stage: string
    leadFeatures: LeadFeatures
  }>

  for (let i = 0; i < LEAD_COUNT; i++) {
    const r = rndLead
    const stage = r() < 0.55 ? 'pending' : 'verified'
    leads.push({
      kind: 'lead',
      externalKey: `syn-lead-${String(i + 1).padStart(5, '0')}`,
      displayName: `${pick(r, FIRST)} ${pick(r, LAST)}`,
      brokerName: pick(r, BROKERS),
      region: pick(r, REGIONS),
      stage,
      leadFeatures: genLeadFeatures(r),
    })
  }

  const customers = [] as Array<{
    kind: 'customer'
    externalKey: string
    displayName: string
    region: string
    customerFeatures: CustomerFeatures
  }>

  for (let i = 0; i < CUSTOMER_COUNT; i++) {
    const r = rndCust
    customers.push({
      kind: 'customer',
      externalKey: `syn-cust-${String(i + 1).padStart(5, '0')}`,
      displayName: `${pick(r, FIRST)} ${pick(r, LAST)}`,
      region: pick(r, REGIONS),
      customerFeatures: genCustomerFeatures(r),
    })
  }

  return [...leads, ...customers]
}

/** If the scoring collection is empty, insert demo rows (local / first visit). */
export function ensureSyntheticScoringSeeded(): Promise<void> {
  seedChain = seedChain.then(async () => {
    await connectDb()
    const count = await SyntheticScoringEntityModel.estimatedDocumentCount()
    if (count > 0) return
    log.info('synthetic scoring collection empty; inserting demo rows')
    try {
      await SyntheticScoringEntityModel.insertMany(buildRows())
    } catch (err) {
      log.warn({ err }, 'synthetic scoring insert skipped (race or duplicate)')
    }
  })
  return seedChain
}

/** Replace all rows (used by npm run seed:synthetic). */
export async function resetSyntheticScoringSeed() {
  await connectDb()
  await SyntheticScoringEntityModel.deleteMany({})
  log.info('cleared synthetic scoring entities')
  await SyntheticScoringEntityModel.insertMany(buildRows())
  log.info('synthetic scoring seed complete')
}
