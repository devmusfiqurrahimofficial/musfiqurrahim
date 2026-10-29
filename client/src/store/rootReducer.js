// auth isn't listed here on purpose: the admin chunk injects it (features/auth/authSlice.js),
// which keeps Firebase out of the visitor bundle.
import { combineSlices } from '@reduxjs/toolkit'
import { persistReducer } from 'redux-persist'
import storage from 'redux-persist/es/storage'
import { apiSlice } from '../features/api/apiSlice.js'
import { contactSlice } from '../features/contact/contactSlice.js'
import { contentSlice } from '../features/content/contentSlice.js'
import { dialogSlice } from '../features/dialog/dialogSlice.js'
import { errorsReducer } from '../features/errors/errorsReducer.js'
import { notificationsSlice } from '../features/notifications/notificationsSlice.js'
import { settingsSlice } from '../features/settings/settingsSlice.js'
import { uiSlice } from '../features/ui/uiSlice.js'
import { windowsSlice } from '../features/windows/windowsSlice.js'

// public/theme.js reads persist:settings directly to pick the theme before React loads
const settingsPersist = { key: 'settings', storage }
// keep the data, not the fetch status
const contentPersist = { key: 'content', storage, whitelist: ['data'] }

export const rootReducer = combineSlices(apiSlice, windowsSlice, uiSlice, contactSlice, notificationsSlice, dialogSlice, {
  settings: persistReducer(settingsPersist, settingsSlice.reducer),
  content: persistReducer(contentPersist, contentSlice.reducer),
  errors: errorsReducer,
})
