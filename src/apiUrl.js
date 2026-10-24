// Empty by default: the API is same-origin (Vite proxies /api in dev; the Express server serves dist/ in prod).
// Set VITE_API_URL at build time if the API lives on another domain.
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
