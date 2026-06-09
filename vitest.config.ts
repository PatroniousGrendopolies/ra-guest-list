import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Unit tests live next to the code under src/. The Playwright e2e specs in
// tests/ are intentionally excluded so the two runners don't pick up each other.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
