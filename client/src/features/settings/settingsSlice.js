// theme stays null until the visitor picks one; until then the site is light (selectIsDark).
import { createSlice } from '@reduxjs/toolkit'

export const settingsSlice = createSlice({
  name: 'settings',
  initialState: { theme: null },
  reducers: {
    // payload = selectIsDark() at click time, so the toggle flips what's on screen
    themeToggled: (state, { payload: isDark }) => {
      state.theme = isDark ? 'light' : 'dark'
    },
  },
})

export const { themeToggled } = settingsSlice.actions
