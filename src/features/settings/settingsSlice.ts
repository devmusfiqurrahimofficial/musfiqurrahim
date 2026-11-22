import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface SettingsState {
  theme: 'light' | 'dark' | null
}

const initialState: SettingsState = { theme: null }

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    themeToggled: (state, { payload: isDark }: PayloadAction<boolean>) => {
      state.theme = isDark ? 'light' : 'dark'
    },
  },
})

export const { themeToggled } = settingsSlice.actions
