import { configureStore } from '@reduxjs/toolkit'
import { authReducer } from './slices/authSlice'
import { blogsReducer } from './slices/blogsSlice'
import { notificationsReducer } from './slices/notificationsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    blogs: blogsReducer,
    notifications: notificationsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
