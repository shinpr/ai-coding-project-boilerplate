# Service-Integration E2E環境前提条件

この前提条件は`service-integration-e2e`レーンだけに適用する。このレーンには、起動済みのローカルアプリケーションスタックと、実データまたはサービスレベルのstubによるデータ状態が必要となる。`fixture-e2e`レーンは実ブラウザとモックバックエンドまたは決定論的なfixture loaderを使用するため、稼働中のサービスも実データベースも必要としない。

## Seed Data Strategy

テストデータはAPI fixtureまたはdatabase seedingで準備し、検証対象の振る舞いからテストジャーニーを開始できるようにする：

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
- テスト認証情報は設定済みのテスト環境またはsecret fixtureから読み込む
- 認証フローに特定のユーザーレコードが必要な場合はfixture内でseedする

## 環境チェックリスト

service-integration-e2eテストが成功するために、以下を確認:
- [ ] アプリケーションが`baseURL`で起動・アクセス可能
- [ ] データベースに必要なseed dataがある（テストユーザー、必要なレコード）
- [ ] テスト認証情報で実際の認証フローが動作する
- [ ] 環境変数が設定されている（`E2E_*`プレフィックス）
- [ ] 外部サービスが利用可能、またはservice-levelでスタブされている

不足する前提条件はE2Eテスト実装タスクの一部として対応するか、テスト対象の振る舞いがライブサービスを必要としないのであれば検証を `fixture-e2e` レーンへ移す。
