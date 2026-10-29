// Fired once persisted state is back; listeners start fetching / watching media queries off this.
import { createAction } from '@reduxjs/toolkit'

export const appStarted = createAction('app/started')
