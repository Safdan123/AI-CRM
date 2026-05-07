import mongoose, { Schema } from 'mongoose'
import type { ReferralStatus } from '../types/index.js'

export interface ReferralDoc {
  _id: mongoose.Types.ObjectId
  brokerId: mongoose.Types.ObjectId
  customerName: string
  phone: string
  campaignId: mongoose.Types.ObjectId
  status: ReferralStatus
  createdAt: Date
  updatedAt: Date
}

const referralSchema = new Schema<ReferralDoc>(
  {
    brokerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    status: {
      type: String,
      enum: ['pending', 'verified', 'converted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true },
)

export const ReferralModel = mongoose.model<ReferralDoc>('Referral', referralSchema)
