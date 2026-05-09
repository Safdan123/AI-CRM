import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import { verifyToken } from '@aicrm/shared'
import { env } from '../config/env.js'

let io: Server | null = null

export function attachRealtime(server: HttpServer) {
  io = new Server(server, {
    cors: { origin: env.clientUrl, credentials: true },
    path: '/socket.io',
  })
  io.use((socket, next) => {
    const token = (socket.handshake.auth?.token as string | undefined) ?? socket.handshake.query?.token
    if (!token || typeof token !== 'string') return next(new Error('Missing token'))
    try {
      const payload = verifyToken(token, env.jwtSecret)
      socket.data.userId = payload.userId
      socket.join(`user:${payload.userId}`)
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })
  io.on('connection', (socket) => {
    socket.on('disconnect', () => {})
  })
  return io
}

export function pushToUser(userId: string, event: string, payload: unknown) {
  if (!io) return
  io.to(`user:${userId}`).emit(event, payload)
}
