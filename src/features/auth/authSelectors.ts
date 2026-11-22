import { createSelector } from '@reduxjs/toolkit'
import { selectAuthStatus } from './authSlice'

export { selectAuthStatus, selectUser, selectNotice, selectInfo, selectPending } from './authSlice'

export const selectIsSignedIn = createSelector([selectAuthStatus], (status) => status === 'signedIn')
