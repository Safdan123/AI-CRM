import mongoose, { Schema } from 'mongoose'
import type { UserRole } from '../types/index.js'

export interface UserDoc {
  _id: mongoose.Types.ObjectId
  fullName: string
  email: string
  passwordHash: string
  role: UserRole
  bio?: string
  avatarUrl?: string
  phone?: string
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<UserDoc>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'broker', 'user', 'support'], default: 'user' },
    bio: { type: String },
    avatarUrl: { type: String },
    phone: { type: String },
  },
  { timestamps: true },
)

export const UserModel = mongoose.model<UserDoc>('User', userSchema)
