import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // The Express API (server/) runs on 4000 during development.
    proxy: { '/api': 'http://localhost:4000' },
  },
})
