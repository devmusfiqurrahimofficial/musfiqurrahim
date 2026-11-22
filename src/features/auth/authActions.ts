import { createAction } from '@reduxjs/toolkit'

export const signedOut = createAction<string | undefined>('auth/signedOut')
