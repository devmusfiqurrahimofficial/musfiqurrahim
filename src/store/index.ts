import { setupListeners } from '@reduxjs/toolkit/query'
import { persistStore } from 'redux-persist'
import { appStarted } from '../features/app/appActions'
import { setupStore } from './setupStore'

export const store = setupStore()

setupListeners(store.dispatch)

export const persistor =
  typeof window !== 'undefined'
    ? persistStore(store, null, () => {
        store.dispatch(appStarted())
      })
    : null
