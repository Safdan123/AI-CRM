import mongoose, { Schema } from 'mongoose'

export interface CounterDoc {
  _id: mongoose.Types.ObjectId
  key: string
  value: number
  updatedAt: Date
  createdAt: Date
}

const counterSchema = new Schema<CounterDoc>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
)

export const CounterModel = mongoose.model<CounterDoc>('Counter', counterSchema)

export interface DailyCounterDoc {
  _id: mongoose.Types.ObjectId
  key: string
  date: string
  value: number
}

const dailySchema = new Schema<DailyCounterDoc>({
  key: { type: String, required: true, index: true },
  date: { type: String, required: true, index: true },
  value: { type: Number, required: true, default: 0 },
})
dailySchema.index({ key: 1, date: 1 }, { unique: true })

export const DailyCounterModel = mongoose.model<DailyCounterDoc>('DailyCounter', dailySchema)
