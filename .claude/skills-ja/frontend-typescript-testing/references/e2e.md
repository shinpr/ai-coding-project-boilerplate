# PlaywrightによるE2Eテスト実装

## レーン選択

本ワークフローのE2Eテストは2つのレーンに分割される:

| レーン | バックエンド構成 | 使用するパターン |
|------|---------------|----------------|
| **fixture-e2e** | `page.route()` またはフィクスチャローダーでモック化、ライブサービスなし | ページオブジェクトパターン、Locator戦略、アサーション、後述の **フィクスチャベースのバックエンド** セクション |
| **service-integration-e2e** | 実サービスを伴うローカルスタックでライブ実行 | 上記の全パターンに加えて、アプリケーションのログインフローに対する実認証Fixture と seed済みのテストデータ |

スケルトンの `@lane:` アノテーションがテストの所属レーンを宣言する。これに合わせて実装パターンを選択する。

## テストフレームワーク
- **Playwright Test**: `@playwright/test`
- テストインポート: `import { test, expect } from '@playwright/test'`

## テスト構成

### ディレクトリ構成
```
tests/
└── e2e/
    ├── pages/                       # ページオブジェクト（レーン間で共通）
    │   ├── login.page.ts
    │   └── dashboard.page.ts
    ├── fixtures/                    # テストFixture（auth、seed）
    │   └── auth.fixture.ts
    ├── data/                        # fixture-e2e用の静的フィクスチャデータ
    │   └── *.fixture.json
    ├── *.fixture-e2e.test.ts        # fixture-e2eテストファイル
    └── *.service-e2e.test.ts        # service-integration-e2eテストファイル
```

### 命名規則
- fixture-e2eファイル: `{FeatureName}.fixture-e2e.test.ts`
- service-integration-e2eファイル: `{FeatureName}.service-e2e.test.ts`
- ページオブジェクト: `{PageName}.page.ts`
- Fixture: `{Purpose}.fixture.ts`
- 静的フィクスチャデータ: `{scenario}.fixture.json`

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

## フィクスチャベースのバックエンド（fixture-e2e）

fixture-e2eテストは決定論的フィクスチャに対して実ブラウザを動かす（ライブバックエンドなし、DBなし、外部サービスなし）。ネットワークをフェイクするには以下のパターンのいずれかを使用する:

### パターンA: page.route() による傍受

```typescript
import { test, expect } from '@playwright/test'
import cardsFixture from './data/cards.fixture.json'

test('Dismissしてからのundoでカードが復元される', async ({ page }) => {
  // Arrange: 全てのバックエンド呼び出しを決定論的レスポンスで傍受
  await page.route('**/api/cards', async (route) => {
    await route.fulfill({ json: cardsFixture })
  })
  await page.route('**/api/cards/*/dismiss', async (route) => {
    await route.fulfill({ status: 204 })
  })

  await page.goto('/cards')
  await page.getByRole('button', { name: 'Dismiss' }).first().click()
  await page.getByRole('button', { name: 'Undo' }).click()

  await expect(page.getByText(cardsFixture[0].title)).toBeVisible()
})
```

### パターンB: フィクスチャローダーの注入

```typescript
// data/cards-with-dismiss.fixture.json — テストと一緒にコミット
// ルートヘルパーまたはアプリレベルのテストモード経由でロード
```

**fixture-e2e の原則**:
- バックエンドはフェイクされ、稼働していない。これらのテストの実行に `npm run start:backend` は不要
- フィクスチャはリポジトリ内（`tests/e2e/data/`）にバージョン管理される。マシンを越えて決定論的なテストになる
- 認証が必要な場合もフェイクする（`page.context().addCookies()` でテストCookieをセット、またはfixtureモードのバイパスを使用）
- 外部インフラのプロビジョニングなしにCIで実行可能

## E2E環境前提条件（service-integration-e2e のみ）

service-integration-e2eテストは実データ状態を持つ起動済みアプリケーションを必要とする。fixture-e2eと異なり、環境セットアップはテスト実装スコープの一部である。

service-integration-e2eテストがパスする前に確認すべき項目:
- [ ] アプリケーションが起動しており`baseURL`でアクセス可能
- [ ] データベースに必要な seed data がある（テストユーザー、必要なレコード）
- [ ] テストクレデンシャルで実認証フローが動作する
- [ ] 環境変数が設定されている（`E2E_*` プレフィックス）
- [ ] 外部サービスが利用可能、またはスタブされている

作業計画書に環境セットアップ用の専用タスク（Phase 0）が含まれる場合、それに従う。計画にセットアップタスクがない場合、テスト実装タスク自体の中で不足する前提条件に対処するか、検証を fixture-e2e に移せないか検討する。

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

E2Eテストスケルトンは統合テストと同じアノテーション形式に従う。レーンを宣言する `@lane:` アノテーションを必ず付与する（上記「レーン選択」参照）:

```typescript
// AC: [元の受入条件テキスト]
// Behavior: [ユーザーアクション] → [システムレスポンス] → [観測可能な結果]
// @category: fixture-e2e | service-integration-e2e
// @lane: fixture-e2e | service-integration-e2e
// @dependency: full-ui (mocked backend) | full-system
// @complexity: high
// ROI: [スコア]
test('AC1: [説明]', async ({ page }) => {
  // Arrange: [セットアップの説明]
  // Act: [操作の説明]
  // Assert: [検証の説明]
})
```

**レーン別の `@dependency` 選択**:
- `fixture-e2e` → `@dependency: full-ui (mocked backend)`（ライブサービスなし、`page.route()` またはフィクスチャローダーでネットワークを傍受）
- `service-integration-e2e` → `@dependency: full-system`（起動済みのローカルスタックが必要）
