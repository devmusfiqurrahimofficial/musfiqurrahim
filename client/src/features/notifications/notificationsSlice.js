import { createSlice, nanoid } from '@reduxjs/toolkit'

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: [],
  reducers: {
    toastAdded: {
      reducer: (state, { payload }) => {
        state.push(payload)
      },
      prepare: (message, type = 'success') => ({ payload: { id: nanoid(), message, type } }),
    },
    toastDismissed: (state, { payload: id }) => state.filter((t) => t.id !== id),
  },
  selectors: {
    selectToasts: (state) => state,
  },
})

export const { toastAdded, toastDismissed } = notificationsSlice.actions
export const { selectToasts } = notificationsSlice.selectors
