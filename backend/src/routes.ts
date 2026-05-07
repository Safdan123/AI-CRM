import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { z } from 'zod'
import PDFDocument from 'pdfkit'
import { requireAuth, requireRole } from './middleware/auth.js'
import { env } from './config/env.js'
import { BlogModel } from './models/Blog.js'
import { CampaignModel } from './models/Campaign.js'
import { NotificationModel } from './models/Notification.js'
import { ReferralModel } from './models/Referral.js'
import { RewardLedgerModel } from './models/RewardLedger.js'
import { UserCampaignAcceptanceModel } from './models/UserCampaignAcceptance.js'
import { UserModel } from './models/User.js'
import { signToken } from './utils/jwt.js'
import { ok } from './utils/api.js'

const signupSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'broker', 'user', 'support']).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const campaignSchema = z.object({
  name: z.string().min(2),
  startDate: z.string().min(4),
  endDate: z.string().min(4),
  totalRewardAmount: z.number().nonnegative(),
})

const referralCreateSchema = z.object({
  customerName: z.string().min(2),
  phone: z.string().min(5),
  campaignId: z.string().min(1),
})

const reviewSchema = z.object({
  status: z.enum(['pending', 'verified', 'converted', 'rejected']),
  reviewNote: z.string().optional(),
})

const blogUpsertSchema = z.object({
  title: z.string().min(2),
  body: z.string().min(10),
  tags: z.array(z.string()).default([]),
})

const router = Router()

router.get('/health', (_req, res) => res.json({ ok: true }))

router.post('/api/auth/signup', async (req, res) => {
  const input = signupSchema.parse(req.body)
  const exists = await UserModel.findOne({ email: input.email })
  if (exists) return res.status(409).json({ message: 'Email already exists.' })

  const passwordHash = await bcrypt.hash(input.password, 10)
  const user = await UserModel.create({
    fullName: input.fullName,
    email: input.email,
    passwordHash,
    role: env.allowSignupRoleSelection ? (input.role ?? 'user') : 'user',
  })

  const payload = { userId: user.id, role: user.role, email: user.email }
  const accessToken = signToken(payload)
  return res.status(201).json(
    ok({
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
      accessToken,
    }),
  )
})

router.post('/api/auth/login', async (req, res) => {
  const input = loginSchema.parse(req.body)
  const user = await UserModel.findOne({ email: input.email })
  if (!user) return res.status(401).json({ message: 'Invalid credentials.' })
  const isValid = await bcrypt.compare(input.password, user.passwordHash)
  if (!isValid) return res.status(401).json({ message: 'Invalid credentials.' })

  const payload = { userId: user.id, role: user.role, email: user.email }
  const accessToken = signToken(payload)
  return res.json(ok({ user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role }, accessToken }))
})

router.get('/api/auth/me', requireAuth, async (req, res) => {
  const user = await UserModel.findById(req.auth!.userId)
  if (!user) return res.status(404).json({ message: 'User not found.' })
  return res.json(ok({ id: user.id, fullName: user.fullName, email: user.email, role: user.role }))
})

router.post('/api/auth/logout', requireAuth, (_req, res) => {
  return res.json(ok({ ok: true }))
})

router.get('/api/campaigns', requireAuth, async (_req, res) => {
  const campaigns = await CampaignModel.find().sort({ createdAt: -1 })
  return res.json(ok(campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    startDate: c.startDate,
    endDate: c.endDate,
    totalRewardAmount: c.totalRewardAmount,
    linkCode: c.linkCode,
  }))))
})

router.get('/api/campaigns/:campaignId', requireAuth, async (req, res) => {
  const campaign = await CampaignModel.findById(req.params.campaignId)
  if (!campaign) return res.status(404).json({ message: 'Campaign not found.' })
  return res.json(ok({
    id: campaign.id,
    name: campaign.name,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    totalRewardAmount: campaign.totalRewardAmount,
    linkCode: campaign.linkCode,
  }))
})

router.post('/api/campaigns', requireAuth, requireRole(['admin']), async (req, res) => {
  const input = campaignSchema.parse(req.body)
  const linkCode = `${input.name.toUpperCase().replace(/\s+/g, '-')}-${Math.floor(Math.random() * 10000)}`
  const campaign = await CampaignModel.create({ ...input, linkCode, createdBy: req.auth!.userId })
  return res.status(201).json(ok({
    id: campaign.id,
    name: campaign.name,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    totalRewardAmount: campaign.totalRewardAmount,
    linkCode: campaign.linkCode,
  }))
})

router.get('/api/referrals', requireAuth, async (req, res) => {
  const page = Number(req.query.page ?? 1)
  const pageSize = Number(req.query.pageSize ?? 10)
  const query = String(req.query.query ?? '').toLowerCase().trim()
  const status = String(req.query.status ?? '').toLowerCase()
  const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : null
  const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : null

  const filter: Record<string, unknown> = {}
  if (req.auth!.role === 'broker') filter.brokerId = req.auth!.userId
  if (status && status !== 'all') filter.status = status

  const all = await ReferralModel.find(filter).sort({ createdAt: -1 })
  let filtered = all
  if (query) {
    filtered = filtered.filter((r) =>
      r.id.toLowerCase().includes(query) ||
      r.customerName.toLowerCase().includes(query) ||
      r.phone.includes(query))
  }
  if (startDate) filtered = filtered.filter((r) => r.createdAt >= startDate)
  if (endDate) filtered = filtered.filter((r) => r.createdAt <= endDate)

  const start = (page - 1) * pageSize
  const items = filtered.slice(start, start + pageSize).map((r) => ({
    id: r.id,
    brokerId: r.brokerId.toString(),
    customerName: r.customerName,
    phone: r.phone,
    campaignId: r.campaignId.toString(),
    status: r.status,
    createdAt: r.createdAt.toISOString().slice(0, 10),
  }))
  return res.json(ok({ items, page, pageSize, total: filtered.length }))
})

router.get('/api/referrals/:referralId', requireAuth, async (req, res) => {
  const r = await ReferralModel.findById(req.params.referralId)
  if (!r) return res.status(404).json({ message: 'Referral not found.' })
  return res.json(ok({
    id: r.id,
    brokerId: r.brokerId.toString(),
    customerName: r.customerName,
    phone: r.phone,
    campaignId: r.campaignId.toString(),
    status: r.status,
    createdAt: r.createdAt.toISOString().slice(0, 10),
  }))
})

router.post('/api/referrals', requireAuth, requireRole(['admin', 'broker']), async (req, res) => {
  const input = referralCreateSchema.parse(req.body)
  const duplicate = await ReferralModel.findOne({ phone: input.phone, campaignId: input.campaignId })
  if (duplicate) return res.status(409).json({ message: 'Duplicate referral.' })
  const referral = await ReferralModel.create({
    brokerId: req.auth!.userId,
    customerName: input.customerName,
    phone: input.phone,
    campaignId: input.campaignId,
    status: 'pending',
  })
  return res.status(201).json(ok({
    id: referral.id,
    brokerId: referral.brokerId.toString(),
    customerName: referral.customerName,
    phone: referral.phone,
    campaignId: referral.campaignId.toString(),
    status: referral.status,
    createdAt: referral.createdAt.toISOString().slice(0, 10),
  }))
})

router.get('/api/admin/kpis', requireAuth, requireRole(['admin', 'support']), async (_req, res) => {
  const totalCustomers = await UserModel.countDocuments({ role: 'user' })
  const activeBrokers = await UserModel.countDocuments({ role: 'broker' })
  const totalReferrals = await ReferralModel.countDocuments()
  const conversions = await ReferralModel.countDocuments({ status: 'converted' })
  const rewards = await RewardLedgerModel.aggregate([
    { $match: { entryType: 'credit' } },
    { $group: { _id: null, sum: { $sum: '$amount' } } },
  ])
  const rewardsDistributed = rewards[0]?.sum ?? 0
  return res.json(ok({ totalCustomers, activeBrokers, totalReferrals, conversions, rewardsDistributed }))
})

router.get('/api/admin/referrals/review', requireAuth, requireRole(['admin', 'support']), async (_req, res) => {
  const referrals = await ReferralModel.find().sort({ createdAt: -1 }).limit(30)
  return res.json(ok(referrals.map((r) => ({
    id: r.id,
    brokerId: r.brokerId.toString(),
    customerName: r.customerName,
    phone: r.phone,
    campaignId: r.campaignId.toString(),
    status: r.status,
    createdAt: r.createdAt.toISOString().slice(0, 10),
  }))))
})

router.get('/api/admin/users', requireAuth, requireRole(['admin', 'support']), async (_req, res) => {
  const users = await UserModel.find().sort({ createdAt: -1 }).limit(300)
  return res.json(
    ok(
      users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
      })),
    ),
  )
})

router.patch('/api/admin/referrals/:referralId/review', requireAuth, requireRole(['admin', 'support']), async (req, res) => {
  const input = reviewSchema.parse(req.body)
  const referral = await ReferralModel.findById(req.params.referralId)
  if (!referral) return res.status(404).json({ message: 'Referral not found.' })
  referral.status = input.status
  await referral.save()

  if (input.status === 'converted') {
    await RewardLedgerModel.create({
      userId: referral.brokerId,
      referralId: referral._id,
      amount: 100,
      entryType: 'credit',
      description: `Conversion reward for ${referral.customerName}`,
    })
  }

  return res.json(ok({
    id: referral.id,
    status: input.status,
    reviewNote: input.reviewNote,
    reviewedBy: req.auth!.userId,
    reviewedAt: new Date().toISOString(),
  }))
})

router.post('/api/ref/:code/accept', requireAuth, requireRole(['user']), async (req, res) => {
  const body = z.object({ referralLinkCode: z.string(), campaignId: z.string() }).parse(req.body)
  await UserCampaignAcceptanceModel.create({
    userId: req.auth!.userId,
    campaignId: body.campaignId,
    referralLinkCode: body.referralLinkCode || req.params.code,
  })
  return res.status(201).json(ok({
    userId: req.auth!.userId,
    campaignId: body.campaignId,
    referralLinkCode: body.referralLinkCode || req.params.code,
    acceptedAt: new Date().toISOString(),
  }))
})

router.get('/api/users/:userId/accepted-campaigns', requireAuth, async (req, res) => {
  if (req.auth!.role === 'user' && req.auth!.userId !== req.params.userId) {
    return res.status(403).json({ message: 'Forbidden.' })
  }
  const accepted = await UserCampaignAcceptanceModel.find({ userId: req.params.userId })
  const ids = accepted.map((a) => a.campaignId)
  const campaigns = await CampaignModel.find({ _id: { $in: ids } })
  return res.json(ok(campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    startDate: c.startDate,
    endDate: c.endDate,
    totalRewardAmount: c.totalRewardAmount,
    linkCode: c.linkCode,
  }))))
})

router.get('/api/profile/me', requireAuth, async (req, res) => {
  const user = await UserModel.findById(req.auth!.userId)
  if (!user) return res.status(404).json({ message: 'User not found.' })
  return res.json(ok({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    bio: user.bio ?? '',
    avatarUrl: user.avatarUrl ?? '',
    phone: user.phone ?? '',
  }))
})

router.patch('/api/profile/me', requireAuth, async (req, res) => {
  const body = z.object({
    fullName: z.string().min(2).optional(),
    bio: z.string().optional(),
    avatarUrl: z.string().optional(),
    phone: z.string().optional(),
  }).parse(req.body)
  const user = await UserModel.findByIdAndUpdate(req.auth!.userId, { $set: body }, { new: true })
  if (!user) return res.status(404).json({ message: 'User not found.' })
  return res.json(ok({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    bio: user.bio ?? '',
    avatarUrl: user.avatarUrl ?? '',
    phone: user.phone ?? '',
  }))
})

router.get('/api/blogs', async (_req, res) => {
  const blogs = await BlogModel.find().sort({ createdAt: -1 }).limit(50)
  return res.json(ok(blogs))
})

router.post('/api/blogs', requireAuth, requireRole(['admin', 'support']), async (req, res) => {
  const body = blogUpsertSchema.parse(req.body)
  const blog = await BlogModel.create({ ...body, authorId: req.auth!.userId })
  return res.status(201).json(ok(blog))
})

router.put('/api/blogs/:blogId', requireAuth, requireRole(['admin', 'support']), async (req, res) => {
  const body = blogUpsertSchema.parse(req.body)
  const updated = await BlogModel.findByIdAndUpdate(
    req.params.blogId,
    { $set: body },
    { new: true, runValidators: true },
  )
  if (!updated) return res.status(404).json({ message: 'Blog not found.' })
  return res.json(ok(updated))
})

router.delete('/api/blogs/:blogId', requireAuth, requireRole(['admin', 'support']), async (req, res) => {
  const deleted = await BlogModel.findByIdAndDelete(req.params.blogId)
  if (!deleted) return res.status(404).json({ message: 'Blog not found.' })
  return res.json(ok({ id: deleted.id, deleted: true }))
})

router.get('/api/notifications/me', requireAuth, async (req, res) => {
  const list = await NotificationModel.find({ userId: req.auth!.userId }).sort({ createdAt: -1 }).limit(50)
  return res.json(ok(list))
})

router.post('/api/notifications', requireAuth, requireRole(['admin', 'support']), async (req, res) => {
  const body = z.object({ userId: z.string(), title: z.string(), body: z.string() }).parse(req.body)
  const notification = await NotificationModel.create(body)
  return res.status(201).json(ok(notification))
})

router.patch('/api/notifications/:id/read', requireAuth, async (req, res) => {
  const notification = await NotificationModel.findById(req.params.id)
  if (!notification) return res.status(404).json({ message: 'Notification not found.' })
  if (notification.userId.toString() !== req.auth!.userId) {
    return res.status(403).json({ message: 'Forbidden.' })
  }
  if (!notification.isRead) {
    notification.isRead = true
    await notification.save()
  }
  return res.json(ok(notification))
})

router.patch('/api/notifications/me/read-all', requireAuth, async (req, res) => {
  const result = await NotificationModel.updateMany(
    { userId: req.auth!.userId, isRead: false },
    { $set: { isRead: true } },
  )
  return res.json(ok({ updatedCount: result.modifiedCount }))
})

router.get('/api/analytics/summary', requireAuth, requireRole(['admin', 'support']), async (_req, res) => {
  const users = await UserModel.countDocuments()
  const blogs = await BlogModel.countDocuments()
  const notifications = await NotificationModel.countDocuments()
  const referrals = await ReferralModel.countDocuments()
  return res.json(ok({ users, blogs, notifications, referrals }))
})

router.get('/api/search', requireAuth, async (req, res) => {
  const q = String(req.query.q ?? '').trim()
  if (!q) return res.json(ok({ referrals: [], campaigns: [], blogs: [] }))
  const regex = new RegExp(q, 'i')
  const [referrals, campaigns, blogs] = await Promise.all([
    ReferralModel.find({ customerName: regex }).limit(10),
    CampaignModel.find({ name: regex }).limit(10),
    BlogModel.find({ title: regex }).limit(10),
  ])
  return res.json(ok({ referrals, campaigns, blogs }))
})

router.get('/api/rewards/cashflow', requireAuth, requireRole(['admin', 'support']), async (_req, res) => {
  const [credit, debit] = await Promise.all([
    RewardLedgerModel.aggregate([{ $match: { entryType: 'credit' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    RewardLedgerModel.aggregate([{ $match: { entryType: 'debit' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ])
  return res.json(ok({
    credit: credit[0]?.total ?? 0,
    debit: debit[0]?.total ?? 0,
  }))
})

router.get('/api/recommendations/:userId', requireAuth, async (req, res) => {
  const accepted = await UserCampaignAcceptanceModel.find({ userId: req.params.userId }).limit(5)
  const campaignIds = accepted.map((a) => a.campaignId.toString())
  const campaigns = await CampaignModel.find(campaignIds.length > 0 ? { _id: { $nin: campaignIds } } : {}).limit(5)
  return res.json(ok(campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    startDate: c.startDate,
    endDate: c.endDate,
    totalRewardAmount: c.totalRewardAmount,
    linkCode: c.linkCode,
  }))))
})

router.get('/api/public/contact', (_req, res) => {
  return res.json(ok({
    email: 'support@mabrook.app',
    phone: '+92 300 0000000',
    address: 'Lahore, Pakistan',
    googleMapUrl: 'https://maps.google.com/?q=Lahore',
    social: {
      facebook: 'https://facebook.com',
      instagram: 'https://instagram.com',
      linkedin: 'https://linkedin.com',
    },
  }))
})

router.get('/api/reports/rewards.pdf', requireAuth, async (req, res) => {
  const ledger = await RewardLedgerModel.find({ userId: req.auth!.userId }).sort({ createdAt: -1 }).limit(100)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'attachment; filename="rewards-report.pdf"')
  const doc = new PDFDocument()
  doc.pipe(res)
  doc.fontSize(18).text('AI CRM Rewards Report')
  doc.moveDown()
  doc.fontSize(12).text(`Generated for user: ${req.auth!.userId}`)
  doc.text(`Generated at: ${new Date().toISOString()}`)
  doc.moveDown()
  ledger.forEach((entry) => {
    doc.text(`${entry.createdAt.toISOString()} | ${entry.entryType.toUpperCase()} | ${entry.amount} | ${entry.description}`)
  })
  doc.end()
})

export { router }
