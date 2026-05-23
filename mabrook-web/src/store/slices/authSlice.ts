import { createSlice } from '@reduxjs/toolkit'
import { getTokenPayload, setAccessToken, setRefreshToken } from '../../lib/api/http'
import type { UserRole } from '../../lib/api/types'

type AuthState = {
  isAuthenticated: boolean
  user: { userId: string; role: UserRole; email: string } | null
}

const payload = getTokenPayload()

const initialState: AuthState = {
  isAuthenticated: Boolean(payload),
  user: payload
    ? { userId: payload.userId, role: payload.role, email: payload.email }
    : null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    syncFromToken(state) {
      const next = getTokenPayload()
      state.isAuthenticated = Boolean(next)
      state.user = next
        ? { userId: next.userId, role: next.role, email: next.email }
        : null
    },
    logout(state) {
      setAccessToken(null)
      setRefreshToken(null)
      state.isAuthenticated = false
      state.user = null
    },
  },
})

export const { syncFromToken, logout } = authSlice.actions
export const authReducer = authSlice.reducer
