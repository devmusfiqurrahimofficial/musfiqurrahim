import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'

export interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error'
}

export type NotificationsState = ToastItem[]

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: [] as NotificationsState,
  reducers: {
    toastAdded: {
      reducer: (state, { payload }: PayloadAction<ToastItem>) => {
        state.push(payload)
      },
      prepare: (message: string, type: 'success' | 'error' = 'success') => ({
        payload: { id: nanoid(), message, type },
      }),
    },
    toastDismissed: (state, { payload: id }: PayloadAction<string>) =>
      state.filter((t) => t.id !== id),
  },
  selectors: {
    selectToasts: (state) => state,
  },
})

export const { toastAdded, toastDismissed } = notificationsSlice.actions
export const { selectToasts } = notificationsSlice.selectors
