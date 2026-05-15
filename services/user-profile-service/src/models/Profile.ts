import mongoose, { Schema } from 'mongoose'
import type { UserRole } from '@aicrm/shared'

export interface ProfileDoc {
  _id: mongoose.Types.ObjectId
  userId: string
  fullName: string
  email: string
  role: UserRole
  bio?: string
  avatarUrl?: string
  phone?: string
  preferredCurrency?: string
  createdAt: Date
  updatedAt: Date
}

const profileSchema = new Schema<ProfileDoc>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    role: { type: String, enum: ['admin', 'broker', 'user', 'support'], required: true },
    bio: { type: String },
    avatarUrl: { type: String },
    phone: { type: String },
    preferredCurrency: { type: String, default: 'USD' },
  },
  { timestamps: true },
)

export const ProfileModel = mongoose.model<ProfileDoc>('Profile', profileSchema)
