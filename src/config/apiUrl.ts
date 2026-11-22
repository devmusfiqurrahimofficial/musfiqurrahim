// Empty by default: the API is same-origin in Next.js.
// Set NEXT_PUBLIC_API_URL or VITE_API_URL if the API lives on another domain.
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof process !== 'undefined' && process.env?.VITE_API_URL) ||
  (typeof window === 'undefined' ? 'http://localhost:3000' : '')
).replace(/\/$/, '')
