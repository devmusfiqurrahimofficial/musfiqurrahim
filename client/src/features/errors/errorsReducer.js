// Filled by errorsListeners.js. Mostly there so DevTools shows what failed; also drives the error toasts.
import { createAction, createReducer, nanoid } from '@reduxjs/toolkit'
import { signedOut } from '../auth/authActions.js'

const MAX_ERRORS = 20

export const errorRaised = createAction('errors/raised', ({ message, source }) => ({
  payload: { id: nanoid(), message, source, at: new Date().toISOString() },
}))

export const errorsReducer = createReducer({ items: [] }, (builder) =>
  builder
    .addCase(errorRaised, (state, { payload }) => {
      state.items.push(payload)
      if (state.items.length > MAX_ERRORS) state.items.shift()
    })
    .addCase(signedOut, (state) => {
      state.items = []
    })
)
