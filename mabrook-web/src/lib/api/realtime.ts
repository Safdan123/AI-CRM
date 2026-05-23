import { io, type Socket } from 'socket.io-client'
import { getAccessToken } from './http'

const WS_URL = (import.meta.env.VITE_WS_URL as string | undefined) ?? 'http://localhost:4006'

let socket: Socket | null = null

export function connectRealtime() {
  if (socket?.connected) return socket
  const token = getAccessToken()
  if (!token) return null
  socket = io(WS_URL, {
    path: '/socket.io',
    transports: ['websocket'],
    auth: { token },
    autoConnect: true,
    reconnection: true,
  })
  return socket
}

export function getRealtime() {
  return socket
}

export function disconnectRealtime() {
  socket?.disconnect()
  socket = null
}
