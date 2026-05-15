import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationPayload,
} from '../../lib/api/realServices'

type NotificationsState = {
  items: NotificationPayload[]
  loading: boolean
  error: string
}

const initialState: NotificationsState = {
  items: [],
  loading: false,
  error: '',
}

export const fetchMyNotifications = createAsyncThunk('notifications/fetch', async () => {
  const response = await listMyNotifications()
  return response.data
})

export const markNotificationReadThunk = createAsyncThunk(
  'notifications/markRead',
  async (notificationId: string) => {
    const response = await markNotificationRead(notificationId)
    return response.data
  },
)

export const markAllNotificationsReadThunk = createAsyncThunk(
  'notifications/markAllRead',
  async () => {
    await markAllNotificationsRead()
    return true
  },
)

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    receiveNotification(state, action: { payload: NotificationPayload }) {
      const exists = state.items.some((n) => n._id === action.payload._id)
      if (!exists) {
        state.items = [action.payload, ...state.items]
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyNotifications.pending, (state) => {
        state.loading = true
        state.error = ''
      })
      .addCase(fetchMyNotifications.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchMyNotifications.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Failed to load notifications.'
      })
      .addCase(markNotificationReadThunk.fulfilled, (state, action) => {
        state.items = state.items.map((item) =>
          item._id === action.payload._id ? action.payload : item,
        )
      })
      .addCase(markAllNotificationsReadThunk.fulfilled, (state) => {
        state.items = state.items.map((item) => ({ ...item, isRead: true }))
      })
  },
})

export const { receiveNotification } = notificationsSlice.actions
export const notificationsReducer = notificationsSlice.reducer
