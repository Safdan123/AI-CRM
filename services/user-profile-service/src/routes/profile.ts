import { Router } from 'express'
import multer from 'multer'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { EVENTS, makeRequireAuth, ok, type EventBus, type UserProfileUpdatedEvent } from '@aicrm/shared'
import { env } from '../config/env.js'
import { storage } from '../config/storage.js'
import { ProfileModel } from '../models/Profile.js'

const requireAuth = makeRequireAuth(env.jwtSecret)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

const updateSchema = z.object({
  fullName: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().max(40).optional(),
  preferredCurrency: z.string().length(3).optional(),
  /** Client may send a data URL from My Profile; cap keeps oversized payloads out of Mongo. */
  avatarUrl: z.string().max(4_000_000).optional(),
})

function shape(p: NonNullable<Awaited<ReturnType<typeof ProfileModel.findOne>>>) {
  return {
    id: p.userId,
    fullName: p.fullName,
    email: p.email,
    role: p.role,
    bio: p.bio ?? '',
    avatarUrl: p.avatarUrl ?? '',
    phone: p.phone ?? '',
    preferredCurrency: p.preferredCurrency ?? 'USD',
  }
}

export function profileRouter(bus: EventBus | null) {
  const router = Router()

  router.get('/me', requireAuth, async (req, res) => {
    let profile = await ProfileModel.findOne({ userId: req.auth!.userId })
    if (!profile) {
      profile = await ProfileModel.create({
        userId: req.auth!.userId,
        fullName: req.auth!.email.split('@')[0],
        email: req.auth!.email,
        role: req.auth!.role,
      })
    }
    return res.json(ok(shape(profile)))
  })

  router.patch('/me', requireAuth, async (req, res) => {
    const body = updateSchema.parse(req.body)
    const profile = await ProfileModel.findOneAndUpdate(
      { userId: req.auth!.userId },
      { $set: body },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )
    if (!profile) return res.status(500).json({ message: 'Failed to update profile.' })

    if (bus) {
      const evt: UserProfileUpdatedEvent = {
        userId: req.auth!.userId,
        fullName: body.fullName,
        avatarUrl: profile.avatarUrl,
        occurredAt: new Date().toISOString(),
      }
      await bus.publish(EVENTS.USER_PROFILE_UPDATED, evt)
    }

    return res.json(ok(shape(profile)))
  })

  router.post('/me/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' })
    const ext = (req.file.originalname.split('.').pop() ?? 'png').toLowerCase()
    const objectName = `${req.auth!.userId}/${nanoid(10)}.${ext}`
    await storage.putObject(env.minio.bucket, objectName, req.file.buffer, req.file.size, {
      'Content-Type': req.file.mimetype,
    })
    const url = `${env.publicFilesUrl}/${env.minio.bucket}/${objectName}`
    const profile = await ProfileModel.findOneAndUpdate(
      { userId: req.auth!.userId },
      { $set: { avatarUrl: url } },
      { new: true, upsert: true },
    )

    if (bus && profile) {
      const evt: UserProfileUpdatedEvent = {
        userId: req.auth!.userId,
        avatarUrl: url,
        occurredAt: new Date().toISOString(),
      }
      await bus.publish(EVENTS.USER_PROFILE_UPDATED, evt)
    }

    return res.json(ok({ avatarUrl: url }))
  })

  router.get('/by-user/:userId', requireAuth, async (req, res) => {
    const p = await ProfileModel.findOne({ userId: req.params.userId })
    if (!p) return res.status(404).json({ message: 'User not found.' })
    return res.json(ok(shape(p)))
  })

  router.get('/_internal/list', async (req, res) => {
    if (req.header('x-internal-key') !== env.jwtSecret) {
      return res.status(403).json({ message: 'Forbidden.' })
    }
    const ids = String(req.query.ids ?? '').split(',').filter(Boolean)
    const profiles = await ProfileModel.find(ids.length ? { userId: { $in: ids } } : {}).limit(500)
    return res.json(ok(profiles.map(shape)))
  })

  return router
}
