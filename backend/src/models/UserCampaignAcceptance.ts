import mongoose, { Schema } from 'mongoose'

export interface UserCampaignAcceptanceDoc {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  campaignId: mongoose.Types.ObjectId
  referralLinkCode: string
  acceptedAt: Date
}

const acceptanceSchema = new Schema<UserCampaignAcceptanceDoc>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  referralLinkCode: { type: String, required: true },
  acceptedAt: { type: Date, default: Date.now },
})

export const UserCampaignAcceptanceModel = mongoose.model<UserCampaignAcceptanceDoc>(
  'UserCampaignAcceptance',
  acceptanceSchema,
)
