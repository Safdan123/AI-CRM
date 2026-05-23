import mongoose, { Schema } from 'mongoose'

export interface LoginActivityDoc {
  _id: mongoose.Types.ObjectId
  userId?: string
  email: string
  success: boolean
  failureReason?: string
  ip: string
  userAgent: string
  country?: string
  city?: string
  createdAt: Date
}

const loginActivitySchema = new Schema<LoginActivityDoc>(
  {
    userId: { type: String, index: true },
    email: { type: String, required: true, index: true },
    success: { type: Boolean, required: true, index: true },
    failureReason: { type: String },
    ip: { type: String, required: true },
    userAgent: { type: String, required: true },
    country: { type: String },
    city: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

loginActivitySchema.index({ createdAt: -1 })

export const LoginActivityModel = mongoose.model<LoginActivityDoc>('LoginActivity', loginActivitySchema)
