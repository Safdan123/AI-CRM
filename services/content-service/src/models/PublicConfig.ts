import mongoose, { Schema } from 'mongoose'

export interface PublicConfigDoc {
  _id: mongoose.Types.ObjectId
  key: string
  value: unknown
  updatedAt: Date
  createdAt: Date
}

const schema = new Schema<PublicConfigDoc>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
)

export const PublicConfigModel = mongoose.model<PublicConfigDoc>('PublicConfig', schema)
