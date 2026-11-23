import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { configDefaults, defineConfig } from 'vitest/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Playwright runs tests/e2e; Vitest would otherwise load those *.test.ts files
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
    // Process management improvements
    testTimeout: 10000, // 10 second timeout
    hookTimeout: 10000, // Hook processing timeout 10 seconds
    teardownTimeout: 5000, // Teardown timeout 5 seconds
    pool: 'threads', // Explicit process pool specification
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src'),
    },
  },
})
