import { createSlice, isAnyOf } from '@reduxjs/toolkit'
import { rootReducer } from '../../store/rootReducer.js'
import { signedOut } from './authActions.js'
import { requestPasswordReset, signInWithPassword, verifySession } from './authThunks.js'

const initialState = {
  // checking | signedIn | signedOut
  status: 'checking',
  user: null,
  // login screen messages: why the last session ended / sign-in failed, and "reset link sent"
  notice: null,
  info: null,
  // which login button is busy: null | 'password' | 'reset'
  pending: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(verifySession.pending, (state) => {
        state.status = 'checking'
        state.user = null
      })
      .addCase(verifySession.fulfilled, (state, { payload }) => {
        state.status = 'signedIn'
        state.user = payload
        state.notice = null
      })
      // verifySession.rejected is handled in authListeners.js (it ends the session)
      .addCase(signedOut, (state, { payload: reason }) => {
        state.status = 'signedOut'
        state.user = null
        if (reason) state.notice = reason
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
      .addCase(requestPasswordReset.fulfilled, (state, { payload: email }) => {
        state.info = `If ${email} has an account, a reset link is on its way.`
      })
      .addMatcher(isAnyOf(signInWithPassword.fulfilled, requestPasswordReset.fulfilled), (state) => {
        state.pending = null
      })
      .addMatcher(isAnyOf(signInWithPassword.rejected, requestPasswordReset.rejected), (state, { payload }) => {
        state.pending = null
        state.notice = payload
      }),
  selectors: {
    selectAuthStatus: (state) => state.status,
    selectUser: (state) => state.user,
    selectNotice: (state) => state.notice,
    selectInfo: (state) => state.info,
    selectPending: (state) => state.pending,
  },
})

// Injected rather than listed in rootReducer, so visitors' stores never have it.
export const injectedAuthSlice = authSlice.injectInto(rootReducer)
