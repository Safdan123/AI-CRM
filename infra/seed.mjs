#!/usr/bin/env node
import { execSync } from 'node:child_process'

const cmd = (svc, script = 'seed') =>
  `docker compose -f infra/docker-compose.yml exec -T ${svc} npm run ${script}`

const services = ['auth-service', 'campaign-service', 'content-service']

for (const svc of services) {
  console.log(`\n--- Seeding ${svc} ---`)
  try {
    execSync(cmd(svc), { stdio: 'inherit' })
  } catch (err) {
    console.error(`Seed failed for ${svc}:`, err.message)
    process.exitCode = 1
  }
}

console.log('\nDone. Demo accounts: admin/broker/user/support @mabrook.app password: password123')
