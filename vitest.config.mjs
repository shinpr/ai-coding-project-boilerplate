import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Process management improvements
    testTimeout: 10000,        // 10 second timeout
    hookTimeout: 10000,        // Hook processing timeout 10 seconds
    teardownTimeout: 5000,     // Teardown timeout 5 seconds
    pool: 'threads',           // Explicit process pool specification
    poolOptions: {
      threads: {
        singleThread: false,   // Allow parallel execution
        isolate: true,         // Isolate between tests
      }
    },
    coverage: {
      enabled: false,  // Disable coverage by default
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      clean: true,             // Clear coverage files to prevent process residue
      include: ['src/**/*.{js,ts,jsx,tsx}'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        '**/__mocks__/**',
      ],
      // No coverage thresholds set for boilerplate
      // Set appropriate values for each project
    },
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src'),
    },
  },
})