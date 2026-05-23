import mongoose, { Schema } from 'mongoose'

export interface RewardLedgerDoc {
  _id: mongoose.Types.ObjectId
  userId: string
  referralId?: string
  amount: number
  currency: string
  amountInBase: number
  baseCurrency: string
  fxRate: number
  entryType: 'credit' | 'debit'
  description: string
  createdAt: Date
  updatedAt: Date
}

const ledgerSchema = new Schema<RewardLedgerDoc>(
  {
    userId: { type: String, required: true, index: true },
    referralId: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, uppercase: true, length: 3 },
    amountInBase: { type: Number, required: true },
    baseCurrency: { type: String, required: true, uppercase: true, length: 3 },
    fxRate: { type: Number, required: true },
    entryType: { type: String, enum: ['credit', 'debit'], required: true },
    description: { type: String, required: true },
  },
  { timestamps: true },
)

ledgerSchema.index({ userId: 1, createdAt: -1 })
ledgerSchema.index({ referralId: 1 }, { unique: false, sparse: true })

export const RewardLedgerModel = mongoose.model<RewardLedgerDoc>('RewardLedger', ledgerSchema)
