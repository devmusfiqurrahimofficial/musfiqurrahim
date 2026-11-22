import { isFulfilled } from '@reduxjs/toolkit'
import { startAppListening } from '@/store/listenerMiddleware'
import { errorRaised } from '../errors/errorsReducer'
import { toastAdded, toastDismissed } from './notificationsSlice'
import { SUCCESS_MESSAGES } from './successMessages'

const TOAST_MS = 3500

startAppListening({
  actionCreator: errorRaised,
  effect: ({ payload }, { dispatch }) => {
    dispatch(toastAdded(payload.message, 'error'))
  },
})

startAppListening({
  matcher: isFulfilled,
  effect: ({ type, payload, meta }: any, { dispatch }) => {
    const key = meta?.arg?.endpointName ?? type.replace(/\/fulfilled$/, '')
    const entry = SUCCESS_MESSAGES[key]
    if (!entry || meta?.arg?.type === 'query') return
    const message = typeof entry === 'function' ? entry(meta?.arg?.originalArgs ?? meta?.arg, payload) : entry
    if (message) dispatch(toastAdded(message))
  },
})

startAppListening({
  actionCreator: toastAdded,
  effect: async ({ payload }, { delay, dispatch }) => {
    await delay(TOAST_MS)
    dispatch(toastDismissed(payload.id))
  },
})
