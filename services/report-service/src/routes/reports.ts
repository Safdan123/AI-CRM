import { Router } from 'express'
import { z } from 'zod'
import { makeRequireAuth, ok } from '@aicrm/shared'
import { env } from '../config/env.js'
import { reportQueue, reportQueueEvents } from '../queue.js'

const requireAuth = makeRequireAuth(env.jwtSecret)

export function reportsRouter() {
  const router = Router()

  router.post('/rewards', requireAuth, async (req, res) => {
    const body = z
      .object({ format: z.enum(['pdf', 'xlsx']).default('pdf') })
      .parse(req.body ?? {})
    const job = await reportQueue.add('rewards', {
      type: body.format === 'xlsx' ? 'rewards-xlsx' : 'rewards-pdf',
      userId: req.auth!.userId,
      format: body.format,
    })
    return res.status(202).json(ok({ jobId: job.id }))
  })

  router.get('/jobs/:jobId', requireAuth, async (req, res) => {
    const job = await reportQueue.getJob(req.params.jobId)
    if (!job) return res.status(404).json({ message: 'Job not found.' })
    const state = await job.getState()
    return res.json(ok({ id: job.id, state, progress: job.progress }))
  })

  router.get('/jobs/:jobId/download', requireAuth, async (req, res) => {
    const job = await reportQueue.getJob(req.params.jobId)
    if (!job) return res.status(404).json({ message: 'Job not found.' })
    const state = await job.getState()
    if (state !== 'completed') return res.status(409).json({ message: `Job is ${state}.` })
    const result = job.returnvalue as { buffer: string; contentType: string; filename: string } | undefined
    if (!result) return res.status(500).json({ message: 'No result available.' })
    res.setHeader('Content-Type', result.contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
    return res.end(Buffer.from(result.buffer, 'base64'))
  })

  router.get('/rewards.pdf', requireAuth, async (req, res) => {
    const job = await reportQueue.add('rewards-sync', {
      type: 'rewards-pdf',
      userId: req.auth!.userId,
      format: 'pdf',
    })
    const result = (await job.waitUntilFinished(reportQueueEvents)) as {
      buffer: string
      contentType: string
      filename: string
    }
    res.setHeader('Content-Type', result.contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
    return res.end(Buffer.from(result.buffer, 'base64'))
  })

  return router
}
