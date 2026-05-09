import mongoose, { Schema } from 'mongoose'
import type { ReferralStatus } from '@aicrm/shared'

export interface ReferralDoc {
  _id: mongoose.Types.ObjectId
  brokerId: string
  customerName: string
  phone: string
  phoneE164?: string
  campaignId: string
  status: ReferralStatus
  reviewNote?: string
  reviewedBy?: string
  reviewedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const referralSchema = new Schema<ReferralDoc>(
  {
    brokerId: { type: String, required: true, index: true },
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    phoneE164: { type: String, index: true },
    campaignId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'verified', 'converted', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewNote: { type: String },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
)

referralSchema.index({ brokerId: 1, status: 1, createdAt: -1 })
referralSchema.index({ campaignId: 1, phoneE164: 1 }, { unique: true, sparse: true })

export const ReferralModel = mongoose.model<ReferralDoc>('Referral', referralSchema)
