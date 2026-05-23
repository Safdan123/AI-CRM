import type { CustomerFeatures, LeadFeatures } from '../models/SyntheticScoringEntity.js'

export type ScoreTier = 'high' | 'medium' | 'low'

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function leadTier(score: number): ScoreTier {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

function churnTier(risk: number): ScoreTier {
  if (risk >= 65) return 'high'
  if (risk >= 35) return 'medium'
  return 'low'
}

/**
 * Lead priority score (0–100, higher = more worth pursuing now).
 * Uses only synthetic / operational proxies — no interest-like signals.
 */
export function computeLeadScore(f: LeadFeatures): { score: number; tier: ScoreTier; reasons: string[] } {
  const reasons: string[] = []
  let raw = 0

  raw += f.brokerConversionProxy * 32
  if (f.brokerConversionProxy >= 0.65) reasons.push('Broker quality proxy is strong (synthetic).')
  else if (f.brokerConversionProxy < 0.35) reasons.push('Broker quality proxy is weak (synthetic).')

  raw += f.contactCompleteness * 28
  if (f.contactCompleteness >= 0.85) reasons.push('Contact details look complete.')
  else if (f.contactCompleteness < 0.45) reasons.push('Missing key contact signals (synthetic).')

  raw += (f.campaignRewardBand / 5) * 15
  if (f.campaignRewardBand >= 4) reasons.push('Campaign reward band is high (stated pool, Shariah-framed).')

  raw += f.engagementVelocity * 18
  if (f.engagementVelocity >= 0.6) reasons.push('Engagement velocity proxy is positive.')

  const stalePenalty = Math.min(28, f.daysInStage * 0.55)
  raw -= stalePenalty
  if (f.daysInStage > 21) reasons.push('Lead has been in stage for a while — prioritise follow-up.')

  if (f.duplicateRiskFlag >= 0.5) {
    raw -= 14
    reasons.push('Duplicate / collision risk flag raised (synthetic).')
  }

  const score = clamp(Math.round(raw), 0, 100)
  return { score, tier: leadTier(score), reasons: reasons.slice(0, 5) }
}

/**
 * Churn-style disengagement risk (0–100, higher = higher risk).
 */
export function computeChurnRisk(f: CustomerFeatures): { risk: number; tier: ScoreTier; reasons: string[] } {
  const reasons: string[] = []
  let raw = 0

  raw += clamp(f.daysSinceLastActivity * 0.55, 0, 42)
  if (f.daysSinceLastActivity > 45) reasons.push('No recent activity window is wide (synthetic).')
  else if (f.daysSinceLastActivity < 10) reasons.push('Recent activity within window (synthetic).')

  raw += f.supportTicketsProxy * 22
  if (f.supportTicketsProxy >= 0.55) reasons.push('Support friction proxy elevated (synthetic).')

  raw -= f.acceptedCampaigns90d * 4.5
  if (f.acceptedCampaigns90d === 0) reasons.push('No campaign acceptances in 90d window (synthetic).')

  raw -= f.referralsMade90d * 3.5
  raw -= clamp(f.rewardVelocity90d * 0.35, -12, 12)
  if (f.rewardVelocity90d <= 0) reasons.push('Reward velocity flat or negative (synthetic).')

  raw -= clamp(f.rewardsBalanceProxy * 0.08, 0, 8)
  if (f.rewardsBalanceProxy >= 40) reasons.push('Meaningful rewards balance proxy — stickiness signal.')

  const risk = clamp(Math.round(raw), 0, 100)
  return { risk, tier: churnTier(risk), reasons: reasons.slice(0, 5) }
}

export function summarizeTiers<T extends { tier: ScoreTier }>(items: T[]) {
  return {
    total: items.length,
    high: items.filter((i) => i.tier === 'high').length,
    medium: items.filter((i) => i.tier === 'medium').length,
    low: items.filter((i) => i.tier === 'low').length,
  }
}
