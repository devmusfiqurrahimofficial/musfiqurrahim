import { configureStore } from '@reduxjs/toolkit'
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE } from 'redux-persist'
import { apiSlice } from '../features/api/apiSlice'
import { listenerMiddleware } from './listenerMiddleware'
import { errorReporter } from './middleware/errorReporter'
import { rootReducer } from './rootReducer'
import { services } from './services'

// Register listeners on import
import '../features/content/contentListeners'
import '../features/errors/errorsListeners'
import '../features/notifications/notificationsListeners'
import '../features/settings/settingsListeners'
import '../features/ui/uiListeners'
import '../features/windows/windowsListeners'

export function setupStore(preloadedState?: any) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    devTools: process.env.NODE_ENV !== 'production',
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: { extraArgument: services },
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
          ignoredPaths: [/^api\.mutations\.[^.]+\.originalArgs$/],
        },
      })
        .prepend(listenerMiddleware.middleware)
        .concat(apiSlice.middleware, errorReporter),
  })
}
