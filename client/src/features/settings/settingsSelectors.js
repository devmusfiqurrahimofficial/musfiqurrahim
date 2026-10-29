export const selectTheme = (state) => state.settings.theme

// Light unless the visitor has picked dark; the OS setting is ignored.
export const selectIsDark = (state) => selectTheme(state) === 'dark'
