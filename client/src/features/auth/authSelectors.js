// These come from the injected slice, so they return initialState until state.auth exists.
import { createSelector } from '@reduxjs/toolkit'
import { injectedAuthSlice } from './authSlice.js'

export const { selectAuthStatus, selectUser, selectNotice, selectInfo, selectPending } = injectedAuthSlice.selectors

export const selectIsSignedIn = createSelector([selectAuthStatus], (status) => status === 'signedIn')
