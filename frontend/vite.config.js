import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// /api is proxied to Flask, so no keys or backend URLs live in the browser bundle.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } } },
})
