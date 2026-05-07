import mongoose, { Schema } from 'mongoose'

export interface NotificationDoc {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  title: string
  body: string
  isRead: boolean
  createdAt: Date
  updatedAt: Date
}

const notificationSchema = new Schema<NotificationDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export const NotificationModel = mongoose.model<NotificationDoc>('Notification', notificationSchema)
