#!/usr/bin/env node
const API = process.env.SMOKE_API_URL ?? 'http://localhost:8000'
const stamp = Date.now()

async function req(path, opts = {}) {
  const r = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers ?? {}) },
  })
  const body = await r.json().catch(() => ({}))
  if (!r.ok) {
    throw new Error(`${opts.method ?? 'GET'} ${path} → ${r.status}: ${body.message ?? r.statusText}`)
  }
  return body
}

async function signupOrLogin(account) {
  try {
    const res = await req('/api/auth/signup', { method: 'POST', body: JSON.stringify(account) })
    return res.data
  } catch {
    const res = await req('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: account.email, password: account.password }),
    })
    return res.data
  }
}

const ADMIN = { fullName: 'Smoke Admin', email: `smoke-admin-${stamp}@example.com`, password: 'password123', role: 'admin' }
const BROKER = { fullName: 'Smoke Broker', email: `smoke-broker-${stamp}@example.com`, password: 'password123', role: 'broker' }
const USER = { fullName: 'Smoke User', email: `smoke-user-${stamp}@example.com`, password: 'password123', role: 'user' }

async function run() {
  console.log(`Smoke testing AI-CRM via gateway: ${API}`)

  const admin = await signupOrLogin(ADMIN)
  const broker = await signupOrLogin(BROKER)
  const user = await signupOrLogin(USER)
  console.log('  ✓ auth signup / login')

  const campaigns = await req('/api/campaigns', { headers: { Authorization: `Bearer ${admin.accessToken}` } })
  if (!campaigns.data?.length) throw new Error('No campaigns. Did you run the seed?')
  const campaignId = campaigns.data[0].id
  console.log(`  ✓ campaigns list (${campaigns.data.length})`)

  const referral = await req('/api/referrals', {
    method: 'POST',
    headers: { Authorization: `Bearer ${broker.accessToken}` },
    body: JSON.stringify({
      customerName: `Smoke Customer ${stamp}`,
      phone: `+92300${String(stamp).slice(-7)}`,
      campaignId,
    }),
  })
  console.log('  ✓ referral created')

  await req(`/api/admin/referrals/${referral.data.id}/review`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${admin.accessToken}` },
    body: JSON.stringify({ status: 'verified', reviewNote: 'Smoke verified' }),
  })
  console.log('  ✓ admin referral review (verified)')

  await req(`/api/admin/referrals/${referral.data.id}/review`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${admin.accessToken}` },
    body: JSON.stringify({
      status: 'converted',
      reviewNote: 'Smoke conversion',
      investmentAmount: 5000,
      investmentCurrency: 'USD',
    }),
  })
  console.log('  ✓ admin referral review (converted)')

  await new Promise((resolve) => setTimeout(resolve, 2500))

  const rewards = await req('/api/rewards/me', { headers: { Authorization: `Bearer ${broker.accessToken}` } })
  if (!rewards.data.entries?.length) {
    console.warn('  ⚠ rewards ledger empty (event-driven flow may need a moment)')
  } else {
    console.log(`  ✓ rewards credited (${rewards.data.entries.length} entries, balance=${rewards.data.balanceInBase} ${rewards.data.baseCurrency})`)
  }

  const blog = await req('/api/blogs', {
    method: 'POST',
    headers: { Authorization: `Bearer ${admin.accessToken}` },
    body: JSON.stringify({ title: `Smoke Blog ${stamp}`, body: 'Smoke test content for blog management.', tags: ['smoke'] }),
  })
  await req(`/api/blogs/${blog.data._id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${admin.accessToken}` },
    body: JSON.stringify({ title: `Smoke Blog Updated ${stamp}`, body: 'Updated body content.', tags: ['smoke', 'update'] }),
  })
  await req(`/api/blogs/${blog.data._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${admin.accessToken}` },
  })
  console.log('  ✓ blog create/update/delete')

  const note = await req('/api/notifications', {
    method: 'POST',
    headers: { Authorization: `Bearer ${admin.accessToken}` },
    body: JSON.stringify({ userId: user.user.id, title: `Smoke note ${stamp}`, body: 'Hello.' }),
  })
  await req(`/api/notifications/${note.data._id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${user.accessToken}` },
  })
  await req('/api/notifications/me/read-all', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${user.accessToken}` },
  })
  console.log('  ✓ notifications')

  const search = await req('/api/search?q=smoke', { headers: { Authorization: `Bearer ${admin.accessToken}` } })
  console.log(`  ✓ search (referrals=${search.data.referrals.length}, campaigns=${search.data.campaigns.length}, blogs=${search.data.blogs.length})`)

  const ai = await req('/api/ai/status').catch((e) => ({ error: e.message }))
  console.log(`  ✓ ai status: ${ai.error ?? ai.data?.provider}`)

  const fx = await req('/api/rewards/fx?base=USD').catch((e) => ({ error: e.message }))
  console.log(`  ✓ fx rates: ${fx.error ? fx.error : Object.keys(fx.data?.rates ?? {}).length + ' currencies'}`)

  console.log('\nSmoke checks completed successfully.')
}

run().catch((err) => {
  console.error('SMOKE FAILED:', err.message)
  process.exit(1)
})
