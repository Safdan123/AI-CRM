import mongoose, { Schema } from 'mongoose'

export type ReferralStatus = 'pending' | 'verified' | 'converted' | 'rejected'

export type ReferralSource = 'manual' | 'invite_link'

export interface ReferralDoc {
  _id: mongoose.Types.ObjectId
  brokerId: string
  customerUserId?: string
  customerName: string
  phone: string
  phoneE164?: string
  campaignId: string
  source: ReferralSource
  inviteCode?: string
  relationship?: string
  notes?: string
  status: ReferralStatus
  investmentAmount?: number
  investmentCurrency?: string
  investmentAt?: Date
  rewardAmount?: number
  rewardCurrency?: string
  reviewNote?: string
  reviewedBy?: string
  reviewedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const referralSchema = new Schema<ReferralDoc>(
  {
    brokerId: { type: String, required: true, index: true },
    customerUserId: { type: String, index: true },
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    phoneE164: { type: String, index: true },
    campaignId: { type: String, required: true, index: true },
    source: { type: String, enum: ['manual', 'invite_link'], default: 'manual', index: true },
    inviteCode: { type: String, trim: true, index: true },
    relationship: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'verified', 'converted', 'rejected'],
      default: 'pending',
      index: true,
    },
    investmentAmount: { type: Number, min: 0 },
    investmentCurrency: { type: String, uppercase: true },
    investmentAt: { type: Date },
    rewardAmount: { type: Number, min: 0 },
    rewardCurrency: { type: String, uppercase: true },
    reviewNote: { type: String },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
)

referralSchema.index({ brokerId: 1, status: 1, createdAt: -1 })
referralSchema.index({ campaignId: 1, phoneE164: 1 }, { unique: true, sparse: true })
referralSchema.index(
  { campaignId: 1, customerUserId: 1 },
  { unique: true, sparse: true },
)
referralSchema.index({ campaignId: 1, status: 1, createdAt: -1 })

export const ReferralModel = mongoose.model<ReferralDoc>('Referral', referralSchema)
