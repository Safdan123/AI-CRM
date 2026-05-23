import mongoose, { Schema } from 'mongoose'

export type ScoringKind = 'lead' | 'customer'

/** Stored synthetic feature vector for a pipeline “lead” (referral-style). */
export type LeadFeatures = {
  daysInStage: number
  contactCompleteness: number
  campaignRewardBand: number
  brokerConversionProxy: number
  duplicateRiskFlag: number
  engagementVelocity: number
}

/** Stored synthetic feature vector for an end-customer churn proxy. */
export type CustomerFeatures = {
  daysSinceLastActivity: number
  acceptedCampaigns90d: number
  referralsMade90d: number
  rewardsBalanceProxy: number
  supportTicketsProxy: number
  rewardVelocity90d: number
}

export interface SyntheticScoringEntityDoc {
  _id: mongoose.Types.ObjectId
  kind: ScoringKind
  externalKey: string
  displayName: string
  brokerName?: string
  region: string
  stage?: string
  leadFeatures?: LeadFeatures
  customerFeatures?: CustomerFeatures
  createdAt: Date
  updatedAt: Date
}

const leadFeaturesSchema = new Schema<LeadFeatures>(
  {
    daysInStage: { type: Number, required: true },
    contactCompleteness: { type: Number, required: true },
    campaignRewardBand: { type: Number, required: true },
    brokerConversionProxy: { type: Number, required: true },
    duplicateRiskFlag: { type: Number, required: true },
    engagementVelocity: { type: Number, required: true },
  },
  { _id: false },
)

const customerFeaturesSchema = new Schema<CustomerFeatures>(
  {
    daysSinceLastActivity: { type: Number, required: true },
    acceptedCampaigns90d: { type: Number, required: true },
    referralsMade90d: { type: Number, required: true },
    rewardsBalanceProxy: { type: Number, required: true },
    supportTicketsProxy: { type: Number, required: true },
    rewardVelocity90d: { type: Number, required: true },
  },
  { _id: false },
)

const schema = new Schema<SyntheticScoringEntityDoc>(
  {
    kind: { type: String, enum: ['lead', 'customer'], required: true, index: true },
    externalKey: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    brokerName: { type: String },
    region: { type: String, required: true },
    stage: { type: String },
    leadFeatures: { type: leadFeaturesSchema },
    customerFeatures: { type: customerFeaturesSchema },
  },
  { timestamps: true },
)

schema.index({ kind: 1, externalKey: 1 })

export const SyntheticScoringEntityModel = mongoose.model<SyntheticScoringEntityDoc>(
  'SyntheticScoringEntity',
  schema,
)
