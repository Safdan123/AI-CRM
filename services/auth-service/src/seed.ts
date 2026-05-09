import bcrypt from 'bcryptjs'
import { connectDb } from './config/db.js'
import { UserModel } from './models/User.js'

async function run() {
  await connectDb()
  await UserModel.deleteMany({})
  const passwordHash = await bcrypt.hash('password123', 10)
  await UserModel.create([
    { fullName: 'Admin User', email: 'admin@mabrook.app', passwordHash, role: 'admin' },
    { fullName: 'Broker User', email: 'broker@mabrook.app', passwordHash, role: 'broker' },
    { fullName: 'End User', email: 'user@mabrook.app', passwordHash, role: 'user' },
    { fullName: 'Support User', email: 'support@mabrook.app', passwordHash, role: 'support' },
  ])
  // eslint-disable-next-line no-console
  console.log('auth-service seed: admin/broker/user/support @mabrook.app / password123')
  process.exit(0)
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
