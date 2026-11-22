import { combineSlices } from '@reduxjs/toolkit'
import { persistReducer } from 'redux-persist'
import createWebStorage from 'redux-persist/lib/storage/createWebStorage'
import { apiSlice } from '../features/api/apiSlice'
import { authSlice } from '../features/auth/authSlice'
import { contactSlice } from '../features/contact/contactSlice'
import { contentSlice } from '../features/content/contentSlice'
import { dialogSlice } from '../features/dialog/dialogSlice'
import { errorsReducer } from '../features/errors/errorsReducer'
import { notificationsSlice } from '../features/notifications/notificationsSlice'
import { settingsSlice } from '../features/settings/settingsSlice'
import { uiSlice } from '../features/ui/uiSlice'
import { windowsSlice } from '../features/windows/windowsSlice'

const createNoopStorage = () => ({
  getItem(_key: string) {
    return Promise.resolve(null)
  },
  setItem(_key: string, value: any) {
    return Promise.resolve(value)
  },
  removeItem(_key: string) {
    return Promise.resolve()
  },
})

const storage = typeof window !== 'undefined' ? createWebStorage('local') : createNoopStorage()

const settingsPersist = { key: 'settings', storage }
const contentPersist = { key: 'content', storage, whitelist: ['data'] }

export const rootReducer = combineSlices(
  apiSlice,
  authSlice,
  windowsSlice,
  uiSlice,
  contactSlice,
  notificationsSlice,
  dialogSlice,
  {
    settings: persistReducer(settingsPersist, settingsSlice.reducer),
    content: persistReducer(contentPersist, contentSlice.reducer),
    errors: errorsReducer,
  }
)
