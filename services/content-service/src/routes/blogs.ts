import { Router } from 'express'
import DOMPurify from 'isomorphic-dompurify'
import { marked } from 'marked'
import slugify from 'slugify'
import { z } from 'zod'
import {
  EVENTS,
  makeRequireAuth,
  ok,
  requireRole,
  type BlogPublishedEvent,
  type EventBus,
} from '@aicrm/shared'
import { env } from '../config/env.js'
import { BlogModel } from '../models/Blog.js'

const requireAuth = makeRequireAuth(env.jwtSecret)

const upsertSchema = z.object({
  title: z.string().min(2),
  body: z.string().min(10),
  excerpt: z.string().max(500).optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published']).default('published'),
})

async function uniqueSlug(title: string) {
  const base = slugify(title, { lower: true, strict: true }).slice(0, 80)
  for (let i = 0; i < 5; i++) {
    const candidate = i === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`
    const exists = await BlogModel.findOne({ slug: candidate })
    if (!exists) return candidate
  }
  return `${base}-${Date.now()}`
}

function renderHtml(body: string) {
  const raw = marked.parse(body, { async: false }) as string
  return DOMPurify.sanitize(raw)
}

function shape(b: NonNullable<Awaited<ReturnType<typeof BlogModel.findOne>>>) {
  return {
    _id: b.id,
    id: b.id,
    title: b.title,
    slug: b.slug,
    body: b.body,
    bodyHtml: renderHtml(b.body),
    excerpt: b.excerpt ?? '',
    authorId: b.authorId,
    tags: b.tags,
    status: b.status,
    publishedAt: b.publishedAt?.toISOString(),
    createdAt: b.createdAt.toISOString(),
  }
}

export function blogsRouter(bus: EventBus | null) {
  const router = Router()

  router.get('/', async (req, res) => {
    const tag = String(req.query.tag ?? '').trim()
    const filter: Record<string, unknown> = { status: 'published' }
    if (tag) filter.tags = tag
    const blogs = await BlogModel.find(filter).sort({ publishedAt: -1, createdAt: -1 }).limit(50)
    return res.json(ok(blogs.map(shape)))
  })

  router.get('/:slugOrId', async (req, res) => {
    const isObjectId = /^[a-f0-9]{24}$/i.test(req.params.slugOrId)
    const blog = isObjectId
      ? await BlogModel.findById(req.params.slugOrId)
      : await BlogModel.findOne({ slug: req.params.slugOrId })
    if (!blog) return res.status(404).json({ message: 'Blog not found.' })
    return res.json(ok(shape(blog)))
  })

  router.post('/', requireAuth, requireRole(['admin', 'support']), async (req, res) => {
    const body = upsertSchema.parse(req.body)
    const slug = await uniqueSlug(body.title)
    const blog = await BlogModel.create({
      ...body,
      slug,
      authorId: req.auth!.userId,
      publishedAt: body.status === 'published' ? new Date() : undefined,
    })

    if (bus && blog.status === 'published') {
      const evt: BlogPublishedEvent = {
        blogId: blog.id,
        title: blog.title,
        body: blog.body,
        tags: blog.tags,
        authorId: blog.authorId,
        occurredAt: new Date().toISOString(),
      }
      await bus.publish(EVENTS.CONTENT_BLOG_PUBLISHED, evt)
    }

    return res.status(201).json(ok(shape(blog)))
  })

  router.put('/:blogId', requireAuth, requireRole(['admin', 'support']), async (req, res) => {
    const body = upsertSchema.parse(req.body)
    const updated = await BlogModel.findByIdAndUpdate(
      req.params.blogId,
      { $set: body },
      { new: true, runValidators: true },
    )
    if (!updated) return res.status(404).json({ message: 'Blog not found.' })
    return res.json(ok(shape(updated)))
  })

  router.delete('/:blogId', requireAuth, requireRole(['admin', 'support']), async (req, res) => {
    const deleted = await BlogModel.findByIdAndDelete(req.params.blogId)
    if (!deleted) return res.status(404).json({ message: 'Blog not found.' })
    return res.json(ok({ id: deleted.id, deleted: true }))
  })

  return router
}
