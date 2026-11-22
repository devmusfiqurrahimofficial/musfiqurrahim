import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { signedOut } from '../auth/authActions'

export interface DialogOptions {
  id?: string
  title: string
  message?: string
  confirmLabel?: string
  danger?: boolean
}

export type DialogState = DialogOptions | null

export const dialogSlice = createSlice({
  name: 'dialog',
  initialState: null as DialogState,
  reducers: {
    confirmOpened: (_state, { payload }: PayloadAction<DialogOptions>) => payload,
    confirmSettled: (_state, _action: PayloadAction<{ id?: string; ok: boolean } | undefined>) => null,
  },
  extraReducers: (builder) => builder.addCase(signedOut, () => null),
  selectors: {
    selectDialog: (state) => state,
  },
})

export const { confirmOpened, confirmSettled } = dialogSlice.actions
export const { selectDialog } = dialogSlice.selectors
