import mongoose, { Schema } from 'mongoose'

export interface BrokerCampaignInviteDoc {
  _id: mongoose.Types.ObjectId
  brokerId: string
  campaignId: string
  inviteCode: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const brokerCampaignInviteSchema = new Schema<BrokerCampaignInviteDoc>(
  {
    brokerId: { type: String, required: true, index: true },
    campaignId: { type: String, required: true, index: true },
    inviteCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)

brokerCampaignInviteSchema.index({ brokerId: 1, campaignId: 1 }, { unique: true })

export const BrokerCampaignInviteModel = mongoose.model<BrokerCampaignInviteDoc>(
  'BrokerCampaignInvite',
  brokerCampaignInviteSchema,
)
