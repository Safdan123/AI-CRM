import mongoose, { Schema } from 'mongoose'

export interface AcceptanceDoc {
  _id: mongoose.Types.ObjectId
  userId: string
  brokerId: string
  campaignId: string
  inviteCode: string
  referralId?: string
  referralLinkCode?: string
  acceptedAt: Date
}

const acceptanceSchema = new Schema<AcceptanceDoc>({
  userId: { type: String, required: true, index: true },
  brokerId: { type: String, required: true, index: true },
  campaignId: { type: String, required: true, index: true },
  inviteCode: { type: String, required: true, trim: true },
  referralId: { type: String },
  referralLinkCode: { type: String },
  acceptedAt: { type: Date, default: Date.now },
})

acceptanceSchema.index({ userId: 1, campaignId: 1 }, { unique: true })

export const AcceptanceModel = mongoose.model<AcceptanceDoc>('UserCampaignAcceptance', acceptanceSchema)
