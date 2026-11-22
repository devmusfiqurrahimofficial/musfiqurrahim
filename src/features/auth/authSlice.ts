import { createSlice, isAnyOf, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthUser } from '@/types/models'
import { signedOut } from './authActions'
import { requestPasswordReset, signInWithPassword, verifySession } from './authThunks'

export type AuthStatus = 'checking' | 'signedIn' | 'signedOut'
export type PendingAction = null | 'password' | 'reset'

export interface AuthState {
  status: AuthStatus
  user: AuthUser | null
  notice: string | null
  info: string | null
  pending: PendingAction
}

const initialState: AuthState = {
  status: 'checking',
  user: null,
  notice: null,
  info: null,
  pending: null,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(verifySession.pending, (state) => {
        state.status = 'checking'
        state.user = null
      })
      .addCase(verifySession.fulfilled, (state, { payload }: PayloadAction<AuthUser>) => {
        state.status = 'signedIn'
        state.user = payload
        state.notice = null
      })
      .addCase(signedOut, (state, { payload }: PayloadAction<string | undefined>) => {
        state.status = 'signedOut'
        state.user = null
        if (payload) state.notice = payload
      })
      .addCase(signInWithPassword.pending, (state) => {
        state.pending = 'password'
        state.notice = null
        state.info = null
      })
      .addCase(requestPasswordReset.pending, (state) => {
        state.pending = 'reset'
        state.notice = null
        state.info = null
      })
      .addCase(requestPasswordReset.fulfilled, (state, { payload }: PayloadAction<string>) => {
        state.info = `If ${payload} has an account, a reset link is on its way.`
      })
      .addMatcher(isAnyOf(signInWithPassword.fulfilled, requestPasswordReset.fulfilled), (state) => {
        state.pending = null
      })
      .addMatcher(isAnyOf(signInWithPassword.rejected, requestPasswordReset.rejected), (state, { payload }) => {
        state.pending = null
        state.notice = (payload as string) || 'Authentication failed'
      }),
  selectors: {
    selectAuthStatus: (state) => state.status,
    selectUser: (state) => state.user,
    selectNotice: (state) => state.notice,
    selectInfo: (state) => state.info,
    selectPending: (state) => state.pending,
  },
})

export const { selectAuthStatus, selectUser, selectNotice, selectInfo, selectPending } = authSlice.selectors
