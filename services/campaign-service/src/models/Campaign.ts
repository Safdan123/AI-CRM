import mongoose, { Schema } from 'mongoose'

export interface CampaignDoc {
  _id: mongoose.Types.ObjectId
  name: string
  description?: string
  startDate: string
  endDate: string
  totalRewardAmount: number
  rewardCurrency: string
  linkCode: string
  createdBy: string
  tags: string[]
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const campaignSchema = new Schema<CampaignDoc>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    totalRewardAmount: { type: Number, required: true, min: 0 },
    rewardCurrency: { type: String, default: 'USD', uppercase: true },
    linkCode: { type: String, required: true, unique: true, trim: true },
    createdBy: { type: String, required: true },
    tags: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)

campaignSchema.index({ active: 1, createdAt: -1 })

export const CampaignModel = mongoose.model<CampaignDoc>('Campaign', campaignSchema)
