import mongoose, { Schema } from 'mongoose'

export interface AcceptanceDoc {
  _id: mongoose.Types.ObjectId
  userId: string
  campaignId: string
  referralLinkCode: string
  acceptedAt: Date
}

const acceptanceSchema = new Schema<AcceptanceDoc>({
  userId: { type: String, required: true, index: true },
  campaignId: { type: String, required: true, index: true },
  referralLinkCode: { type: String, required: true },
  acceptedAt: { type: Date, default: Date.now },
})

acceptanceSchema.index({ userId: 1, campaignId: 1 }, { unique: true })

export const AcceptanceModel = mongoose.model<AcceptanceDoc>('UserCampaignAcceptance', acceptanceSchema)
