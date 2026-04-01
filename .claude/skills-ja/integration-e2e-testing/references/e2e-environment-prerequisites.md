# E2E環境前提条件

E2Eテストはリアルなデータ状態で動作するアプリケーションが必要です。ユニット/統合テストと異なり、環境セットアップはE2Eテスト実装スコープの一部です。

## Seed Data Strategy

テストデータはAPI callまたはdatabase seedingで準備する — UI操作によるデータ作成は行わない:

```typescript
// fixtures/seed.fixture.ts
import { test as base } from '@playwright/test'

export const test = base.extend<{ seededData: SeedResult }>({
  seededData: async ({ request }, use) => {
    // Arrange: テスト前にAPI経由でテストデータを作成
    // 例: プロジェクトの実際のseeding機構に合わせて調整
    const result = await request.post('/api/test/seed', {
      data: { scenario: 'e2e-user-with-subscription' }
    })
    const seedData = await result.json()

    await use(seedData)

    // Cleanup: テスト後にテストデータを削除
    await request.delete(`/api/test/seed/${seedData.id}`)
  },
})
```

**原則**:
- アプリケーションに既存のseeding機構がある場合はそれを使用する。代替手段がない場合のみ新規seedエンドポイントを作成
- seed dataのセットアップはtest fixturesに属する。手動ステップとして分離しない
- 各テストは自己完結: 自身のデータを作成し、テスト後にクリーンアップ
- seedingにはAPIエンドポイントまたは直接DB操作を使用 — UIフローは使わない

## Authentication Fixture

アプリケーションの実際のログインフローに合わせたauth fixtureを実装:

```typescript
// fixtures/auth.fixture.ts
export const test = base.extend<{ playerPage: Page }>({
  playerPage: async ({ page, request }, use) => {
    // アプリケーションの既存認証エンドポイントを使用 — admin backdoorは使わない
    // 例: プロジェクトの実際のログインフローに合わせてURL・payloadを調整
    await request.post('/api/login', {
      data: { loginId: E2E_LOGIN_ID, password: E2E_PASSWORD }
    })
    // セッションをブラウザコンテキストに移行
    await page.goto('/')
    await use(page)
  },
})
```

**原則**:
- アプリケーションの既存認証フローを使用する。auth fixtureは実ユーザーと同じ経路を通ること
- テスト認証情報は環境変数に格納し、ハードコードしない
- 認証フローに特定のユーザーレコードが必要な場合はfixture内でseedする

## 環境チェックリスト

E2Eテストがパスするために、以下を確認:
- [ ] アプリケーションが`baseURL`で起動・アクセス可能
- [ ] データベースに必要なseed dataがある（テストユーザー、サブスクリプション、コンテンツ）
- [ ] テスト認証情報で認証フローが動作する
- [ ] 環境変数が設定されている（`E2E_*`プレフィックス）
- [ ] 外部サービスが利用可能、または`page.route()`でモック済み

作業計画に専用の環境セットアップタスク（Phase 0）が含まれる場合はそれに従う。計画にセットアップタスクがない場合は、E2Eテスト実装タスクの一部として不足する前提条件に対応する。
