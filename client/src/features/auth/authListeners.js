import { isRejectedWithValue } from '@reduxjs/toolkit'
import { startAppListening } from '../../store/listenerMiddleware.js'
import { apiSlice } from '../api/apiSlice.js'
import { errorMessage, isAuthError } from '../api/apiErrors.js'
import { toastAdded } from '../notifications/notificationsSlice.js'
import { signedOut } from './authActions.js'
import { selectIsSignedIn } from './authSelectors.js'
import { endSession, signInWithPassword, verifySession } from './authThunks.js'

// Firebase let them in but the API didn't (not on the allowlist): sign out of Firebase too.
startAppListening({
  actionCreator: verifySession.rejected,
  effect: ({ payload, error }, { dispatch }) => {
    dispatch(endSession(payload ?? error.message))
  },
})

// a 401/403 from any request means the session is dead, not just that call
startAppListening({
  predicate: (action, state) => isRejectedWithValue(action) && isAuthError(action.payload) && selectIsSignedIn(state),
  effect: ({ payload }, { dispatch }) => {
    dispatch(endSession(errorMessage(payload) || 'Your session ended. Sign in again.'))
  },
})

// don't leave the previous account's data sitting in the cache
startAppListening({
  actionCreator: signedOut,
  effect: (action, { dispatch }) => {
    dispatch(apiSlice.util.resetApiState())
  },
})

// Only greet on an actual sign-in, not when a saved session is restored on load.
startAppListening({
  actionCreator: signInWithPassword.fulfilled,
  effect: async (action, { take, dispatch }) => {
    const result = await take(verifySession.fulfilled.match, 10_000)
    if (result) dispatch(toastAdded(`Signed in as ${result[0].payload.email}`))
  },
})
