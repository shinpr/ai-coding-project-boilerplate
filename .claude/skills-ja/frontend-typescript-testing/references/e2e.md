# PlaywrightによるE2Eテスト実装

## テストフレームワーク
- **Playwright Test**: `@playwright/test`
- テストインポート: `import { test, expect } from '@playwright/test'`

## テスト構成

### ディレクトリ構成
```
tests/
└── e2e/
    ├── pages/              # ページオブジェクト
    │   ├── login.page.ts
    │   └── dashboard.page.ts
    ├── fixtures/           # テストFixture
    │   └── auth.fixture.ts
    └── *.e2e.test.ts       # テストファイル
```

### 命名規則
- テストファイル: `{FeatureName}.e2e.test.ts`
- ページオブジェクト: `{PageName}.page.ts`
- Fixture: `{Purpose}.fixture.ts`

## ページオブジェクトパターン

再利用性と保守性のためにページ操作をカプセル化:

```typescript
import { type Page, type Locator } from '@playwright/test'

export class LoginPage {
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator

  constructor(private page: Page) {
    this.emailInput = page.getByLabel('Email')
    this.passwordInput = page.getByLabel('Password')
    this.submitButton = page.getByRole('button', { name: 'Sign in' })
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
}
```

## テストパターン

### 基本テスト
```typescript
import { test, expect } from '@playwright/test'

test('ログイン後にダッシュボードに遷移できる', async ({ page }) => {
  // Arrange
  await page.goto('/login')

  // Act
  await page.getByLabel('Email').fill('user@example.com')
  await page.getByLabel('Password').fill('password')
  await page.getByRole('button', { name: 'Sign in' }).click()

  // Assert
  await expect(page).toHaveURL('/dashboard')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
})
```

### ページオブジェクト使用
```typescript
import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/login.page'
import { DashboardPage } from './pages/dashboard.page'

test('購入フローを完了できる', async ({ page }) => {
  const loginPage = new LoginPage(page)
  const dashboardPage = new DashboardPage(page)

  await page.goto('/login')
  await loginPage.login('user@example.com', 'password')
  await expect(dashboardPage.heading).toBeVisible()
})
```

### 認証Fixture
```typescript
import { test as base } from '@playwright/test'

export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('user@example.com')
    await page.getByLabel('Password').fill('password')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL('/dashboard')
    await use(page)
  },
})
```

## Locator戦略

アクセシブルなLocatorを以下の優先順位で使用:
1. `page.getByRole()` — アクセシビリティに最適
2. `page.getByLabel()` — フォーム要素
3. `page.getByText()` — 表示テキスト
4. `page.getByTestId()` — 最終手段

```typescript
// 推奨
await page.getByRole('button', { name: 'Submit' }).click()

// 非推奨
await page.locator('#submit-btn').click()
await page.locator('.btn-primary').click()
```

## Assertion

```typescript
// 表示確認
await expect(page.getByText('Success')).toBeVisible()
await expect(page.getByText('Error')).not.toBeVisible()

// ナビゲーション
await expect(page).toHaveURL('/dashboard')
await expect(page).toHaveTitle('Dashboard')

// 要素状態
await expect(page.getByRole('button')).toBeEnabled()
await expect(page.getByRole('button')).toBeDisabled()

// コンテンツ
await expect(page.getByRole('heading')).toHaveText('Welcome')
```

## Viewportテスト

UI Specでレスポンシブ動作が定義されている場合:

```typescript
test.describe('レスポンシブナビゲーション', () => {
  test('モバイルでハンバーガーメニューを表示', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible()
    await expect(page.getByRole('navigation')).not.toBeVisible()
  })

  test('デスクトップでフルナビゲーションを表示', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/')
    await expect(page.getByRole('navigation')).toBeVisible()
  })
})
```

## テスト分離

- 各テストはクリーンなブラウザコンテキストから開始
- テスト間で状態を共有しない
- 共通セットアップ（認証、ナビゲーション）には`beforeEach`を使用
- セットアップステップではテスト内ナビゲーションより`page.goto()`を優先

## スケルトンコメント形式

E2Eテストスケルトンは統合テストと同じアノテーション形式に従う:

```typescript
// AC: [元の受入条件テキスト]
// Behavior: [ユーザーアクション] → [システムレスポンス] → [観測可能な結果]
// @category: e2e
// @dependency: full-system
// @complexity: high
// ROI: [スコア]
test('AC1: [説明]', async ({ page }) => {
  // Arrange: [セットアップの説明]
  // Act: [操作の説明]
  // Assert: [検証の説明]
})
```
