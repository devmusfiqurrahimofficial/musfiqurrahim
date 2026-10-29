// Separate from authSlice so core slices can react to it without importing admin code (and Firebase).
import { createAction } from '@reduxjs/toolkit'

// payload: optional reason, shown on the login screen
export const signedOut = createAction('auth/signedOut', (reason = null) => ({ payload: reason }))
