import { isRejectedWithValue } from '@reduxjs/toolkit'
import { startAppListening } from '@/store/listenerMiddleware'
import { errorDetails, errorMessage, isAuthError } from '../api/apiErrors'
import { errorRaised } from './errorsReducer'

startAppListening({
  matcher: isRejectedWithValue,
  effect: ({ type, payload, meta }: any, { dispatch }) => {
    const endpoint = meta?.arg?.endpointName
    if (endpoint) {
      if (meta?.arg?.type !== 'mutation' || isAuthError(payload) || Object.keys(errorDetails(payload)).length) return
      dispatch(errorRaised({ message: errorMessage(payload), source: endpoint }))
    } else if (payload?.notify) {
      dispatch(errorRaised({ message: payload.message, source: type }))
    }
  },
})
