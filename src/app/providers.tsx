'use client'

import { type ReactNode } from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { persistor, store } from '@/store'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      {persistor ? (
        <PersistGate loading={children} persistor={persistor}>
          {children}
        </PersistGate>
      ) : (
        children
      )}
    </Provider>
  )
}
