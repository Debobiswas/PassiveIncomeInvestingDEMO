import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The consolidated .env.local lives at the repo root so that Vercel
  // functions in api/ can read the same file.
  envDir: '..',
  optimizeDeps: {
    force: true,
  },
  server: {
    port: 5173,
    proxy: { '/api': 'http://127.0.0.1:3000' },
  },
})
