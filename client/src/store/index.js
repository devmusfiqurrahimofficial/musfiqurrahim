import { setupListeners } from '@reduxjs/toolkit/query'
import { persistStore } from 'redux-persist'
import { appStarted } from '../features/app/appActions.js'
import { setupStore } from './setupStore.js'

export const store = setupStore()

setupListeners(store.dispatch)

// Wait for rehydration before starting, otherwise an old saved snapshot can land on top of a fresh fetch.
export const persistor = persistStore(store, null, () => store.dispatch(appStarted()))
