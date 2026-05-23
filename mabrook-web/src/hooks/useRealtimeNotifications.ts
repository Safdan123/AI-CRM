import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { connectRealtime, disconnectRealtime } from '../lib/api/realtime'
import type { NotificationPayload } from '../lib/api/realServices'
import type { AppDispatch, RootState } from '../store'
import { receiveNotification } from '../store/slices/notificationsSlice'

export function useRealtimeNotifications() {
  const dispatch = useDispatch<AppDispatch>()
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectRealtime()
      return
    }
    const socket = connectRealtime()
    if (!socket) return
    const handler = (payload: NotificationPayload) => dispatch(receiveNotification(payload))
    socket.on('notification:new', handler)
    return () => {
      socket.off('notification:new', handler)
    }
  }, [dispatch, isAuthenticated])
}
