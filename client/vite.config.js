import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // The Express API (../server) runs on 4000 during development; it also serves uploaded images.
    proxy: { '/api': 'http://localhost:4000' },
  },
  test: {
    // fetch in Node needs absolute URLs; tests stub fetch, so nothing is actually sent there.
    env: { VITE_API_URL: 'http://api.test' },
  },
})
