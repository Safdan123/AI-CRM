import mongoose, { Schema } from 'mongoose'

export interface BlogDoc {
  _id: mongoose.Types.ObjectId
  title: string
  slug: string
  body: string
  excerpt?: string
  authorId: string
  tags: string[]
  status: 'draft' | 'published'
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const blogSchema = new Schema<BlogDoc>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    body: { type: String, required: true },
    excerpt: { type: String },
    authorId: { type: String, required: true },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    publishedAt: { type: Date },
  },
  { timestamps: true },
)

blogSchema.index({ status: 1, publishedAt: -1 })

export const BlogModel = mongoose.model<BlogDoc>('Blog', blogSchema)
