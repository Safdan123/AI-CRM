import { z } from 'zod'

export const STREAMS = {
  USERS: { name: 'USERS', subjects: ['users.>'] },
  REFERRALS: { name: 'REFERRALS', subjects: ['referrals.>'] },
  REWARDS: { name: 'REWARDS', subjects: ['rewards.>'] },
  CONTENT: { name: 'CONTENT', subjects: ['content.>'] },
  CAMPAIGNS: { name: 'CAMPAIGNS', subjects: ['campaigns.>'] },
  NOTIFICATIONS: { name: 'NOTIFICATIONS', subjects: ['notifications.>'] },
} as const

export const EVENTS = {
  USER_REGISTERED: 'users.registered',
  USER_PROFILE_UPDATED: 'users.profile.updated',
  REFERRAL_CREATED: 'referrals.created',
  REFERRAL_REVIEWED: 'referrals.reviewed',
  REFERRAL_CONVERTED: 'referrals.converted',
  REFERRAL_ACCEPTED: 'referrals.accepted',
  REWARD_CREDITED: 'rewards.credited',
  REWARD_DEBITED: 'rewards.debited',
  CAMPAIGN_CREATED: 'campaigns.created',
  CONTENT_BLOG_PUBLISHED: 'content.blog.published',
  NOTIFICATION_DISPATCHED: 'notifications.dispatched',
} as const

export const userRegisteredSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  fullName: z.string(),
  role: z.enum(['admin', 'broker', 'user', 'support']),
  occurredAt: z.string(),
})
export type UserRegisteredEvent = z.infer<typeof userRegisteredSchema>

export const userProfileUpdatedSchema = z.object({
  userId: z.string(),
  fullName: z.string().optional(),
  avatarUrl: z.string().optional(),
  occurredAt: z.string(),
})
export type UserProfileUpdatedEvent = z.infer<typeof userProfileUpdatedSchema>

export const referralCreatedSchema = z.object({
  referralId: z.string(),
  brokerId: z.string(),
  campaignId: z.string(),
  customerName: z.string(),
  phone: z.string(),
  occurredAt: z.string(),
})
export type ReferralCreatedEvent = z.infer<typeof referralCreatedSchema>

export const referralReviewedSchema = z.object({
  referralId: z.string(),
  brokerId: z.string(),
  campaignId: z.string(),
  status: z.enum(['pending', 'verified', 'converted', 'rejected']),
  reviewedBy: z.string(),
  occurredAt: z.string(),
})
export type ReferralReviewedEvent = z.infer<typeof referralReviewedSchema>

export const referralConvertedSchema = z.object({
  referralId: z.string(),
  brokerId: z.string(),
  campaignId: z.string(),
  customerName: z.string(),
  rewardAmount: z.number().nonnegative(),
  rewardCurrency: z.string(),
  occurredAt: z.string(),
})
export type ReferralConvertedEvent = z.infer<typeof referralConvertedSchema>

export const referralAcceptedSchema = z.object({
  userId: z.string(),
  campaignId: z.string(),
  referralLinkCode: z.string(),
  occurredAt: z.string(),
})
export type ReferralAcceptedEvent = z.infer<typeof referralAcceptedSchema>

export const rewardCreditedSchema = z.object({
  userId: z.string(),
  amount: z.number(),
  currency: z.string(),
  description: z.string(),
  referralId: z.string().optional(),
  occurredAt: z.string(),
})
export type RewardCreditedEvent = z.infer<typeof rewardCreditedSchema>

export const campaignCreatedSchema = z.object({
  campaignId: z.string(),
  name: z.string(),
  totalRewardAmount: z.number(),
  rewardCurrency: z.string(),
  occurredAt: z.string(),
})
export type CampaignCreatedEvent = z.infer<typeof campaignCreatedSchema>

export const blogPublishedSchema = z.object({
  blogId: z.string(),
  title: z.string(),
  body: z.string(),
  tags: z.array(z.string()),
  authorId: z.string(),
  occurredAt: z.string(),
})
export type BlogPublishedEvent = z.infer<typeof blogPublishedSchema>
