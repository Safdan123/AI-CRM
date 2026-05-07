import mongoose, { Schema } from 'mongoose'

export interface BlogDoc {
  _id: mongoose.Types.ObjectId
  title: string
  body: string
  authorId: mongoose.Types.ObjectId
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

const blogSchema = new Schema<BlogDoc>(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
)

export const BlogModel = mongoose.model<BlogDoc>('Blog', blogSchema)
