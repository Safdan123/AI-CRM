import { EVENTS, STREAMS, userRegisteredSchema, type EventBus, makeLogger } from '@aicrm/shared'
import { ProfileModel } from '../models/Profile.js'

const log = makeLogger('user-profile-service')

export async function startSubscribers(bus: EventBus) {
  await bus.subscribe({
    stream: STREAMS.USERS.name,
    durable: 'user-profile-on-registered',
    subject: EVENTS.USER_REGISTERED,
    handler: async (raw) => {
      const evt = userRegisteredSchema.parse(raw)
      await ProfileModel.updateOne(
        { userId: evt.userId },
        {
          $setOnInsert: {
            userId: evt.userId,
            fullName: evt.fullName,
            email: evt.email,
            role: evt.role,
          },
        },
        { upsert: true },
      )
      log.info({ userId: evt.userId }, 'profile created')
    },
  })
}
