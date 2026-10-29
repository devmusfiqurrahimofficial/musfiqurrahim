import { addListener, createListenerMiddleware } from '@reduxjs/toolkit'

export const listenerMiddleware = createListenerMiddleware()
export const startAppListening = listenerMiddleware.startListening
// for short-lived listeners added from a thunk, e.g. confirm() in dialogThunks.js
export const addAppListener = addListener
