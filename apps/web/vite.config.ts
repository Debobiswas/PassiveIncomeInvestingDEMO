import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Reference documents and local secrets must never be served by the dev server.
  server: {
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${process.env.PII_API_PORT === '3002' ? '3002' : '3001'}`,
        changeOrigin: false,
      },
    },
    fs: {
      deny: [
        '.env',
        '.env.*',
        '*.{crt,pem}',
        '**/.git/**',
        '**/docs/reference/**',
      ],
    },
  },
  // WebKit can retain failed modulepreloads across reloads (WebKit bug 270357).
  // Native dynamic imports recover correctly; retain lazy routes without preload.
  build: { manifest: true, modulePreload: false },
});
