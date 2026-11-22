import { isRejectedWithValue } from '@reduxjs/toolkit'
import { startAppListening } from '@/store/listenerMiddleware'
import { apiSlice } from '../api/apiSlice'
import { errorMessage, isAuthError } from '../api/apiErrors'
import { toastAdded } from '../notifications/notificationsSlice'
import { signedOut } from './authActions'
import { selectIsSignedIn } from './authSelectors'
import { endSession, signInWithPassword, verifySession } from './authThunks'

startAppListening({
  actionCreator: verifySession.rejected,
  effect: ({ payload, error }, { dispatch }) => {
    dispatch(endSession((payload as string) ?? error.message))
  },
})

startAppListening({
  predicate: (action, state) => isRejectedWithValue(action) && isAuthError(action.payload) && selectIsSignedIn(state),
  effect: ({ payload }, { dispatch }) => {
    dispatch(endSession(errorMessage(payload) || 'Your session ended. Sign in again.'))
  },
})

startAppListening({
  actionCreator: signedOut,
  effect: (_action, { dispatch }) => {
    dispatch(apiSlice.util.resetApiState())
  },
})

startAppListening({
  actionCreator: signInWithPassword.fulfilled,
  effect: async (_action, { take, dispatch }) => {
    const result = await take(verifySession.fulfilled.match, 10_000)
    if (result) dispatch(toastAdded(`Signed in as ${result[0].payload.email}`))
  },
})
