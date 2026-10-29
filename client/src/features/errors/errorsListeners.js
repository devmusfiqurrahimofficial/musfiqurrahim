// What gets logged (and so toasted):
// - failed mutations, except 422s with field details (forms show those inline) and 401/403
//   (authListeners ends the session). Failed queries are skipped, the page shows its own retry.
// - thunks that reject with { message, notify: true }
import { isRejectedWithValue } from '@reduxjs/toolkit'
import { startAppListening } from '../../store/listenerMiddleware.js'
import { errorDetails, errorMessage, isAuthError } from '../api/apiErrors.js'
import { errorRaised } from './errorsReducer.js'

startAppListening({
  matcher: isRejectedWithValue,
  effect: ({ type, payload, meta }, { dispatch }) => {
    const endpoint = meta.arg?.endpointName
    if (endpoint) {
      if (meta.arg.type !== 'mutation' || isAuthError(payload) || Object.keys(errorDetails(payload)).length) return
      dispatch(errorRaised({ message: errorMessage(payload), source: endpoint }))
    } else if (payload?.notify) {
      dispatch(errorRaised({ message: payload.message, source: type }))
    }
  },
})
