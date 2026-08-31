import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Vite löser tsconfig-paths självt sedan v7. vite-tsconfig-paths behövs inte.
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globals: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
})
