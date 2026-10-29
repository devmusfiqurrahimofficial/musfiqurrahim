import { isFulfilled } from '@reduxjs/toolkit'
import { startAppListening } from '../../store/listenerMiddleware.js'
import { errorRaised } from '../errors/errorsReducer.js'
import { toastAdded, toastDismissed } from './notificationsSlice.js'
import { SUCCESS_MESSAGES } from './successMessages.js'

const TOAST_MS = 3500

startAppListening({
  actionCreator: errorRaised,
  effect: ({ payload }, { dispatch }) => {
    dispatch(toastAdded(payload.message, 'error'))
  },
})

startAppListening({
  matcher: isFulfilled,
  effect: ({ type, payload, meta }, { dispatch }) => {
    const key = meta.arg?.endpointName ?? type.replace(/\/fulfilled$/, '')
    const entry = SUCCESS_MESSAGES[key]
    // queries never toast, even if a name ever collides
    if (!entry || meta.arg?.type === 'query') return
    const message = typeof entry === 'function' ? entry(meta.arg?.originalArgs ?? meta.arg, payload) : entry
    if (message) dispatch(toastAdded(message))
  },
})

// no cancelActiveListeners here: each toast needs its own timer
startAppListening({
  actionCreator: toastAdded,
  effect: async ({ payload }, { delay, dispatch }) => {
    await delay(TOAST_MS)
    dispatch(toastDismissed(payload.id))
  },
})
