import mongoose, { Schema } from 'mongoose'

export interface RewardLedgerDoc {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  referralId?: mongoose.Types.ObjectId
  amount: number
  entryType: 'credit' | 'debit'
  description: string
  createdAt: Date
  updatedAt: Date
}

const rewardLedgerSchema = new Schema<RewardLedgerDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    referralId: { type: Schema.Types.ObjectId, ref: 'Referral' },
    amount: { type: Number, required: true },
    entryType: { type: String, enum: ['credit', 'debit'], required: true },
    description: { type: String, required: true },
  },
  { timestamps: true },
)

export const RewardLedgerModel = mongoose.model<RewardLedgerDoc>('RewardLedger', rewardLedgerSchema)
