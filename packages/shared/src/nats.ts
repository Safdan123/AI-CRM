import { connect, JSONCodec, type NatsConnection, type JetStreamClient, type JetStreamManager } from 'nats'

const codec = JSONCodec()

export type EventBus = {
  nc: NatsConnection
  js: JetStreamClient
  jsm: JetStreamManager
  publish: <T>(subject: string, data: T) => Promise<void>
  subscribe: <T>(opts: {
    stream: string
    durable: string
    subject: string
    handler: (data: T, subject: string) => Promise<void> | void
  }) => Promise<void>
  close: () => Promise<void>
}

export async function connectBus(opts: {
  servers: string
  serviceName: string
  streams?: Array<{ name: string; subjects: string[] }>
}): Promise<EventBus> {
  const nc = await connect({ servers: opts.servers, name: opts.serviceName })
  const jsm = await nc.jetstreamManager()
  const js = nc.jetstream()

  for (const s of opts.streams ?? []) {
    try {
      await jsm.streams.add({ name: s.name, subjects: s.subjects })
    } catch (err: unknown) {
      const code = (err as { api_error?: { err_code?: number } })?.api_error?.err_code
      if (code !== 10058) throw err
    }
  }

  return {
    nc,
    js,
    jsm,
    async publish(subject, data) {
      await js.publish(subject, codec.encode(data))
    },
    async subscribe({ stream, durable, subject, handler }) {
      try {
        await jsm.consumers.add(stream, {
          durable_name: durable,
          ack_policy: 'explicit' as never,
          filter_subject: subject,
        })
      } catch (err: unknown) {
        const code = (err as { api_error?: { err_code?: number } })?.api_error?.err_code
        if (code !== 10148 && code !== 10013) throw err
      }
      const consumer = await js.consumers.get(stream, durable)
      const messages = await consumer.consume()
      ;(async () => {
        for await (const m of messages) {
          try {
            const data = codec.decode(m.data) as unknown
            await handler(data as never, m.subject)
            m.ack()
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error(`[bus] handler error for ${m.subject}:`, e)
            m.nak()
          }
        }
      })()
    },
    async close() {
      await nc.drain()
    },
  }
}
