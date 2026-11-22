import { createAction, createReducer, nanoid } from '@reduxjs/toolkit'
import { signedOut } from '../auth/authActions'

const MAX_ERRORS = 20

export interface ErrorItem {
  id: string
  message: string
  source?: string
  at: string
}

export interface ErrorsState {
  items: ErrorItem[]
}

export const errorRaised = createAction('errors/raised', ({ message, source }: { message: string; source?: string }) => ({
  payload: { id: nanoid(), message, source, at: new Date().toISOString() },
}))

export const errorsReducer = createReducer<ErrorsState>({ items: [] }, (builder) =>
  builder
    .addCase(errorRaised, (state, { payload }) => {
      state.items.push(payload)
      if (state.items.length > MAX_ERRORS) state.items.shift()
    })
    .addCase(signedOut, (state) => {
      state.items = []
    })
)
