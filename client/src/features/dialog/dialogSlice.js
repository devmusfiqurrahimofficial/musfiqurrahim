// Only what's on screen. The promise callers await lives in confirm() (dialogThunks.js).
import { createSlice } from '@reduxjs/toolkit'
import { signedOut } from '../auth/authActions.js'

export const dialogSlice = createSlice({
  name: 'dialog',
  initialState: null,
  reducers: {
    // { id, title, message, confirmLabel, danger }
    confirmOpened: (state, { payload }) => payload,
    // { id, ok }
    confirmSettled: () => null,
  },
  // don't leave a dialog hanging around after sign-out
  extraReducers: (builder) => builder.addCase(signedOut, () => null),
  selectors: {
    selectDialog: (state) => state,
  },
})

export const { confirmOpened, confirmSettled } = dialogSlice.actions
export const { selectDialog } = dialogSlice.selectors
