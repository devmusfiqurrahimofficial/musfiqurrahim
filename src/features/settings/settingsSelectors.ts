import type { SettingsState } from './settingsSlice'

export const selectTheme = (state: { settings: SettingsState }) => state.settings.theme

export const selectIsDark = (state: { settings: SettingsState }) => selectTheme(state) === 'dark'
