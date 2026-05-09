import mongoose, { Schema } from 'mongoose'

export interface EmbeddingDoc {
  _id: mongoose.Types.ObjectId
  type: 'campaign' | 'blog'
  refId: string
  text: string
  vector: number[]
  meta: Record<string, unknown>
  updatedAt: Date
  createdAt: Date
}

const schema = new Schema<EmbeddingDoc>(
  {
    type: { type: String, enum: ['campaign', 'blog'], required: true, index: true },
    refId: { type: String, required: true, index: true },
    text: { type: String, required: true },
    vector: { type: [Number], required: true },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
)

schema.index({ type: 1, refId: 1 }, { unique: true })

export const EmbeddingModel = mongoose.model<EmbeddingDoc>('Embedding', schema)
