import mongoose, { Schema } from 'mongoose'

export interface NotificationDoc {
  _id: mongoose.Types.ObjectId
  userId: string
  title: string
  body: string
  category?: string
  link?: string
  isRead: boolean
  createdAt: Date
  updatedAt: Date
}

const notificationSchema = new Schema<NotificationDoc>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    category: { type: String },
    link: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
)

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 })

export const NotificationModel = mongoose.model<NotificationDoc>('Notification', notificationSchema)
