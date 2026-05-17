export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

const DEFAULT_REPLY =
  'Thanks for your question. I can help with referrals, campaigns, rewards, and account navigation. A live AI connection will be enabled soon — for now, try one of the suggested prompts or contact support via the Contact page.'

const KEYWORD_REPLIES: Array<{ match: RegExp; reply: string }> = [
  {
    match: /referral|refer/i,
    reply:
      'To manage referrals: open Referrals to track status, create a new referral from the create flow, and check notifications when an admin reviews or converts a lead. Brokers earn rewards after conversion.',
  },
  {
    match: /campaign/i,
    reply:
      'Campaigns list active programs with reward pools and dates. Admins and brokers can create campaigns from Campaigns → Create New Campaign. Share your referral link from the campaign detail page.',
  },
  {
    match: /reward|payout|balance/i,
    reply:
      'Rewards are credited after a referral is approved and converted. Check your rewards balance on the dashboard or Rewards page. Amounts may show in USD with multi-currency support on the ledger.',
  },
  {
    match: /insight|lead|churn|score/i,
    reply:
      'Admins can open AI Insights for synthetic lead scores and churn risk tables. Use filters by tier (high / medium / low) to prioritize follow-ups.',
  },
  {
    match: /login|password|account|profile/i,
    reply:
      'Use Settings to update your profile and change your password. If you cannot sign in, use Recover Password on the login screen, then check your email for the reset link.',
  },
  {
    match: /hello|hi|hey|help/i,
    reply:
      'Hello! I am the Mabrook assistant. Ask about referrals, campaigns, rewards, or how to navigate the portal. Full AI answers will connect to the backend shortly.',
  },
]

export function getWelcomeMessage(role: 'admin' | 'broker' | 'user' | 'support') {
  if (role === 'admin' || role === 'support') {
    return 'Hi — I can help you navigate admin tools, referrals, campaigns, and AI insights. What would you like to do?'
  }
  if (role === 'broker') {
    return 'Hi — I can help with referrals, campaigns, leaderboard rewards, and sharing referral links. How can I help?'
  }
  return 'Hi — I can help you explore campaigns, track referrals, and understand your rewards. What would you like to know?'
}

export function getSuggestedPrompts(role: 'admin' | 'broker' | 'user' | 'support') {
  if (role === 'admin' || role === 'support') {
    return [
      'How do I review a referral?',
      'Where are lead scores?',
      'How do I create a campaign?',
    ]
  }
  if (role === 'broker') {
    return [
      'How do I create a referral?',
      'How are rewards calculated?',
      'Where is my referral link?',
    ]
  }
  return [
    'How do I accept a referral?',
    'Where can I see my rewards?',
    'What campaigns are available?',
  ]
}

export async function sendMockAssistantMessage(input: string): Promise<string> {
  const text = input.trim()
  await new Promise((r) => window.setTimeout(r, 600 + Math.random() * 400))
  if (!text) return DEFAULT_REPLY
  const lower = text.toLowerCase()
  for (const { match, reply } of KEYWORD_REPLIES) {
    if (match.test(lower)) return reply
  }
  return DEFAULT_REPLY
}

export function createMessage(role: ChatMessage['role'], content: string): ChatMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  }
}
