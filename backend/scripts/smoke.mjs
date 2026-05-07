import 'dotenv/config'

const API_BASE_URL = process.env.SMOKE_API_BASE_URL ?? `http://localhost:${process.env.PORT ?? '4000'}`
const stamp = Date.now()

const ADMIN = {
  fullName: process.env.SMOKE_ADMIN_NAME ?? 'Smoke Admin',
  email: process.env.SMOKE_ADMIN_EMAIL ?? `smoke-admin-${stamp}@example.com`,
  password: process.env.SMOKE_ADMIN_PASSWORD ?? 'password123',
  role: 'admin',
}

const BROKER = {
  fullName: process.env.SMOKE_BROKER_NAME ?? 'Smoke Broker',
  email: process.env.SMOKE_BROKER_EMAIL ?? `smoke-broker-${stamp}@example.com`,
  password: process.env.SMOKE_BROKER_PASSWORD ?? 'password123',
  role: 'broker',
}

const USER = {
  fullName: process.env.SMOKE_USER_NAME ?? 'Smoke User',
  email: process.env.SMOKE_USER_EMAIL ?? `smoke-user-${stamp}@example.com`,
  password: process.env.SMOKE_USER_PASSWORD ?? 'password123',
  role: 'user',
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(`${options.method ?? 'GET'} ${path} failed: ${payload.message ?? response.statusText}`)
  }
  return payload
}

async function signupOrLogin(account) {
  try {
    const res = await request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(account),
    })
    return res.data
  } catch {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: account.email, password: account.password }),
    })
    return res.data
  }
}

async function run() {
  console.log(`Running smoke checks against ${API_BASE_URL}`)

  const admin = await signupOrLogin(ADMIN)
  const broker = await signupOrLogin(BROKER)
  const user = await signupOrLogin(USER)
  console.log('Auth login/signup: OK')

  const campaigns = await request('/api/campaigns', {
    headers: { Authorization: `Bearer ${admin.accessToken}` },
  })
  const campaignId = campaigns.data[0]?.id
  if (!campaignId) throw new Error('No campaign found. Create at least one campaign before running smoke tests.')

  const referral = await request('/api/referrals', {
    method: 'POST',
    headers: { Authorization: `Bearer ${broker.accessToken}` },
    body: JSON.stringify({
      customerName: `Smoke Customer ${stamp}`,
      phone: `+92300${String(stamp).slice(-7)}`,
      campaignId,
    }),
  })
  console.log('Create referral: OK')

  await request(`/api/admin/referrals/${referral.data.id}/review`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${admin.accessToken}` },
    body: JSON.stringify({ status: 'verified', reviewNote: 'Smoke test review' }),
  })
  console.log('Admin review referral: OK')

  const blog = await request('/api/blogs', {
    method: 'POST',
    headers: { Authorization: `Bearer ${admin.accessToken}` },
    body: JSON.stringify({
      title: `Smoke Blog ${stamp}`,
      body: 'Smoke test content for blog management endpoint verification.',
      tags: ['smoke', 'automation'],
    }),
  })
  console.log('Create blog: OK')

  await request(`/api/blogs/${blog.data._id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${admin.accessToken}` },
    body: JSON.stringify({
      title: `Smoke Blog Updated ${stamp}`,
      body: 'Updated smoke test content for blog management endpoint verification.',
      tags: ['smoke', 'update'],
    }),
  })
  await request(`/api/blogs/${blog.data._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${admin.accessToken}` },
  })
  console.log('Update/delete blog: OK')

  const notification = await request('/api/notifications', {
    method: 'POST',
    headers: { Authorization: `Bearer ${admin.accessToken}` },
    body: JSON.stringify({
      userId: user.user.id,
      title: `Smoke Notification ${stamp}`,
      body: 'Smoke test notification delivery.',
    }),
  })
  console.log('Create notification: OK')

  await request(`/api/notifications/${notification.data._id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${user.accessToken}` },
  })
  await request('/api/notifications/me/read-all', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${user.accessToken}` },
  })
  console.log('Notification read endpoints: OK')

  console.log('Smoke checks completed successfully.')
}

run().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
