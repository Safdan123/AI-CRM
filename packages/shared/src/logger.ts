import pino from 'pino'

export function makeLogger(serviceName: string) {
  const isDev = process.env.NODE_ENV !== 'production'
  return pino({
    name: serviceName,
    level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
    base: { service: serviceName },
    transport: isDev
      ? {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss', singleLine: true },
        }
      : undefined,
  })
}
