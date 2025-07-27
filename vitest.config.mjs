import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // プロセス管理の改善
    testTimeout: 10000,        // 10秒でタイムアウト
    hookTimeout: 10000,        // フック処理も10秒
    teardownTimeout: 5000,     // 終了処理5秒
    pool: 'threads',           // プロセスプールの明示
    poolOptions: {
      threads: {
        singleThread: false,   // 並列実行許可
        isolate: true,         // テスト間分離
      }
    },
    coverage: {
      enabled: false,  // デフォルトではカバレッジを無効化
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      clean: true,             // カバレッジファイルをクリアしてプロセス残留を防ぐ
      include: ['src/**/*.{js,ts,jsx,tsx}'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        '**/__mocks__/**',
      ],
      // ボイラープレートとしてはカバレッジ閾値を設定しない
      // 各プロジェクトで適切な値を設定してください
    },
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src'),
    },
  },
})