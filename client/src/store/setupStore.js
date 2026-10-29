// Tests build their own store with this; the app's one lives in index.js.
import { configureStore } from '@reduxjs/toolkit'
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE } from 'redux-persist'
import { apiSlice } from '../features/api/apiSlice.js'
import { listenerMiddleware } from './listenerMiddleware.js'
import { errorReporter } from './middleware/errorReporter.js'
import { rootReducer } from './rootReducer.js'
import { services } from './services.js'
// these register their listeners on import
import '../features/content/contentListeners.js'
import '../features/errors/errorsListeners.js'
import '../features/notifications/notificationsListeners.js'
import '../features/settings/settingsListeners.js'
import '../features/ui/uiListeners.js'
import '../features/windows/windowsListeners.js'

// dynamic import so the logger never ends up in the prod bundle
const devMiddleware = []
if (import.meta.env.DEV && import.meta.env.MODE !== 'test') {
  const { createLogger } = await import('redux-logger')
  // Dragging a window dispatches on every pointer move; leave those out of the console.
  devMiddleware.push(createLogger({ collapsed: true, predicate: (_, action) => action.type !== 'windows/windowMoved' }))
}

export function setupStore(preloadedState) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    devTools: import.meta.env.DEV,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: { extraArgument: services },
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
          // Image uploads send FormData, which RTK Query keeps as the mutation's argument.
          ignoredPaths: [/^api\.mutations\.[^.]+\.originalArgs$/],
        },
      })
        // listeners go first so they see every action, thunks included
        .prepend(listenerMiddleware.middleware)
        .concat(apiSlice.middleware, errorReporter, ...devMiddleware),
  })
}
