import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { PersistGate } from 'redux-persist/integration/react'
import App from './App.jsx'
import { persistor, store } from './store/index.js'
import './index.css'

// Loaded only on /admin, so visitors never download Firebase or the admin UI.
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      {/* Saved state comes from localStorage, so this waits a tick at most. */}
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route
              path="/admin/*"
              element={
                <Suspense fallback={null}>
                  <AdminApp />
                </Suspense>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </StrictMode>
)
