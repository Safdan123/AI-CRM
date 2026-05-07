import mongoose, { Schema } from 'mongoose'

export interface CampaignDoc {
  _id: mongoose.Types.ObjectId
  name: string
  startDate: string
  endDate: string
  totalRewardAmount: number
  linkCode: string
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const campaignSchema = new Schema<CampaignDoc>(
  {
    name: { type: String, required: true, trim: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    totalRewardAmount: { type: Number, required: true, min: 0 },
    linkCode: { type: String, required: true, unique: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
)

export const CampaignModel = mongoose.model<CampaignDoc>('Campaign', campaignSchema)
