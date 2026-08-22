import { defineConfig } from 'vitest/config';

export default defineConfig({
  // shared/ sits above this Vite root; without an explicit allow entry Vite
  // refuses to load ../shared and ../api test files ("Does the file exist?").
  server: { fs: { allow: ['..'] } },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{js,jsx}', '../api/**/*.test.js', '../shared/**/*.test.js'],
  },
});
