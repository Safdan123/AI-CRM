import { Router } from 'express'
import { z } from 'zod'
import { makeRequireAuth, ok, requireRole } from '@aicrm/shared'
import { env } from '../config/env.js'
import { PublicConfigModel } from '../models/PublicConfig.js'

const requireAuth = makeRequireAuth(env.jwtSecret)

const DEFAULT_CONTACT = {
  email: 'support@mabrook.app',
  phone: '+92 300 0000000',
  address: 'Lahore, Pakistan',
  googleMapUrl: 'https://maps.google.com/?q=Lahore',
  social: {
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    linkedin: 'https://linkedin.com',
  },
}

export function publicRouter() {
  const router = Router()

  router.get('/contact', async (_req, res) => {
    const doc = await PublicConfigModel.findOne({ key: 'contact' })
    return res.json(ok(doc ? doc.value : DEFAULT_CONTACT))
  })

  router.put('/contact', requireAuth, requireRole(['admin', 'support']), async (req, res) => {
    const body = z
      .object({
        email: z.string().email(),
        phone: z.string(),
        address: z.string(),
        googleMapUrl: z.string().url(),
        social: z.object({
          facebook: z.string().url(),
          instagram: z.string().url(),
          linkedin: z.string().url(),
        }),
      })
      .parse(req.body)
    const doc = await PublicConfigModel.findOneAndUpdate(
      { key: 'contact' },
      { $set: { value: body } },
      { upsert: true, new: true },
    )
    return res.json(ok(doc.value))
  })

  return router
}
