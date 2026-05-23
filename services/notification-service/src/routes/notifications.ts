import { Router } from 'express'
import { z } from 'zod'
import { makeRequireAuth, ok, requireRole } from '@aicrm/shared'
import { env } from '../config/env.js'
import { NotificationModel } from '../models/Notification.js'
import { pushToUser } from '../services/realtime.js'

const requireAuth = makeRequireAuth(env.jwtSecret)

const createSchema = z.object({
  userId: z.string(),
  title: z.string().min(2),
  body: z.string().min(2),
  category: z.string().optional(),
  link: z.string().optional(),
})

export function notificationsRouter() {
  const router = Router()

  router.get('/me', requireAuth, async (req, res) => {
    const list = await NotificationModel.find({ userId: req.auth!.userId }).sort({ createdAt: -1 }).limit(100)
    return res.json(ok(list))
  })

  router.post('/', requireAuth, requireRole(['admin', 'support']), async (req, res) => {
    const body = createSchema.parse(req.body)
    const note = await NotificationModel.create(body)
    pushToUser(body.userId, 'notification:new', note.toObject())
    return res.status(201).json(ok(note))
  })

  router.patch('/:id/read', requireAuth, async (req, res) => {
    const note = await NotificationModel.findById(req.params.id)
    if (!note) return res.status(404).json({ message: 'Notification not found.' })
    if (note.userId !== req.auth!.userId) return res.status(403).json({ message: 'Forbidden.' })
    if (!note.isRead) {
      note.isRead = true
      await note.save()
    }
    return res.json(ok(note))
  })

  router.patch('/me/read-all', requireAuth, async (req, res) => {
    const result = await NotificationModel.updateMany(
      { userId: req.auth!.userId, isRead: false },
      { $set: { isRead: true } },
    )
    return res.json(ok({ updatedCount: result.modifiedCount }))
  })

  return router
}
