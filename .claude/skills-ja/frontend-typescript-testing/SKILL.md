---
name: frontend-typescript-testing
description: React Testing Library、MSW、Playwright E2Eでテストを設計。コンポーネントテストとE2Eテストパターンを適用。
---

# TypeScript テストルール（フロントエンド）

## 参照

| テスト種別 | 参照先 | 用途 |
|-----------|--------|------|
| **ユニット / 統合** | 本ドキュメント | RTL + Vitest + MSW での React コンポーネントテスト |
| **E2E** | [references/e2e.md](references/e2e.md) | Playwright によるブラウザレベル E2E テスト |

## テストフレームワーク
- **Vitest**: このプロジェクトではVitestを使用
- **React Testing Library**: コンポーネントテスト用
- **MSW (Mock Service Worker)**: APIモック用
- テストのインポート: `import { describe, it, expect, beforeEach, vi } from 'vitest'`
- コンポーネントテストのインポート: `import { render, screen } from '@testing-library/react'`
- ユーザー操作: `import userEvent from '@testing-library/user-event'`
- モックの作成: `vi.mock()` を使用

## テストの基本方針

### 品質要件
- **カバレッジ**: クリティカルパスと高再利用コンポーネントに対する意味のあるアサーションを優先する。カバレッジは目標ではなくギャップ検出のシグナルとして扱う（目標化すると自明なテストに歪む — グッドハートの法則）。数値しきい値はプロジェクトの CI 設定に委ねる
- **独立性**: 各テストは他のテストに依存せず実行可能
- **再現性**: テストは環境に依存せず、常に同じ結果を返す
- **可読性**: テストコードも製品コードと同様の品質を維持

### テストの重点配分
基盤的で再利用度の高いユニット（共有コンポーネント、カスタムフック、utils）を最も厚くテストする。多くの機能から再利用されるものほど、リグレッション時の影響範囲が広いためである。合成度の高い面（organisms、ページ）は統合/E2Eのカバレッジに委ねる。数値しきい値はプロジェクトの CI 設定に委ねる。

**指標**（カバレッジレポートの内訳）: Statements（文）、Branches（分岐）、Functions（関数）、Lines（行）

### テストの種類と範囲
1. **単体テスト（React Testing Library）**
   - 個々のコンポーネントや関数の動作を検証
   - 外部依存はすべてモック化
   - 最も数が多く、細かい粒度で実施
   - ユーザーから観測可能な振る舞いに焦点を当てる

2. **統合テスト（React Testing Library + MSW）**
   - 複数のコンポーネントの連携を検証
   - MSW（Mock Service Worker）でAPIをモック
   - 実際のDB接続なし（DBはバックエンドが管理）
   - 主要な機能フローの検証

3. **E2Eテストでの機能横断検証**
   - 新機能追加時、既存機能への影響を必ず検証
   - Design Docの「統合ポイントマップ」で影響度「高」「中」の箇所をカバー
   - 検証パターン: 既存機能動作 → 新機能有効化 → 既存機能の継続性確認
   - 判定基準: 表示内容の変化なし、レンダリング時間5秒以内
   - CI/CDでの自動実行を前提とした設計

## テストの実装規約

### ディレクトリ構造（Co-location原則）
```
src/
└── components/
    └── Button/
        ├── Button.tsx
        ├── Button.test.tsx  # コンポーネントと同じ場所に配置
        └── index.ts
```

**理由**:
- React Testing Libraryのベストプラクティス
- Co-location原則: テストはそれがカバーする実装と同じ場所に置く
- 実装と一緒にテストを見つけやすく、保守しやすい

### 命名規則
- テストファイル: `{ComponentName}.test.tsx`
- 統合テストファイル: `{FeatureName}.integration.test.tsx`
- テストスイート: 対象のコンポーネントや機能を説明する名前
- テストケース: ユーザー視点から期待される動作を説明する名前

### テストコードの品質ルール

**推奨: すべてのテストを常に有効に保つ**
- メリット: テストスイートの完全性を保証
- 実践: 問題があるテストは修正して有効化

**避けるべき: test.skip()やコメントアウト**
- 理由: テストの穴が生まれ、品質チェックが不完全になる
- 対処: 不要なテストは完全に削除する

## モックの型安全性の徹底

### MSW（Mock Service Worker）セットアップ
```typescript
// 型安全なMSWハンドラー（MSW v2）
import { http, HttpResponse } from 'msw'

const handlers = [
  http.get('/api/users/:id', () => {
    return HttpResponse.json({ id: '1', name: 'John' } satisfies User)
  })
]
```

### コンポーネントモックの型安全性
```typescript
// 必要な部分のみ
type TestProps = Pick<ButtonProps, 'label' | 'onClick'>
const mockProps: TestProps = { label: 'Click', onClick: vi.fn() }

// やむを得ない場合のみ、理由明記
const mockRouter = {
  push: vi.fn()
} as unknown as Router // 複雑なRouter型構造のため
```

## React Testing Libraryの基本例

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('should call onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button label="Click me" onClick={onClick} />)
    await user.click(screen.getByRole('button', { name: 'Click me' }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
```

## テスト設計パターン

実装詳細ではなくユーザーから見える結果を検証する。クエリはアクセシビリティ優先（`getByRole`/`getByLabelText`/`getByText`）で、`getByTestId` や `container.querySelector` に依存しない。正常系だけでなく空・エラー・ローディング/非同期の状態も網羅し、非同期UIは `findBy*` で待機する。

```typescript
// ユーザーから見える結果を検証
it('increments count when clicked', async () => {
  const user = userEvent.setup()
  render(<Counter />)
  await user.click(screen.getByRole('button', { name: '+' }))
  expect(screen.getByText('Count: 1')).toBeInTheDocument()
})

// エラー状態: 1テストだけハンドラを上書き
it('shows an error message on API failure', async () => {
  server.use(http.get('/api/users', () => new HttpResponse(null, { status: 500 })))
  render(<UserList />)
  expect(await screen.findByText('エラーが発生しました')).toBeInTheDocument()
})
```
