---
name: frontend-typescript-testing
description: リポジトリで設定済みのReactテスト・ブラウザハーネスを使用してフロントエンドテストを設計。RTL、MSW、Vitest、Playwrightが存在する場合に適用。コンポーネント、loading/error state、統合、フロントエンドE2Eテストの追加・レビュー時に使用。
---

# TypeScript テストルール（フロントエンド）

## 前提条件の検出

フレームワークやコマンドを選択する前に、`package.json`、ロックファイル、テスト設定、既存テストのimportを確認する。Vitest、React Testing Library、MSW、Playwright固有のルールは、依存または設定が存在する場合にのみ適用する。異なるフレームワークが設定されている場合は、リポジトリの同等機能を使用する。実行可能なハーネスを特定できない場合は、作り出さずに、確認したpathと不足しているフレームワークまたはコマンドを報告する。

## 参照

| テスト種別 | 参照先 | 用途 |
|-----------|--------|------|
| **ユニット / 統合** | 本ドキュメント | RTL + Vitest + MSW での React コンポーネントテスト |
| **E2E** | [references/e2e.md](references/e2e.md) | Playwright によるブラウザレベル E2E テスト |

## テストフレームワーク
- **Vitest**: リポジトリ設定または既存テストで選択されている場合に使用
- **React Testing Library**: コンポーネントテスト用
- **MSW (Mock Service Worker)**: APIモック用
- テストのインポート: `import { describe, it, expect, beforeEach, vi } from 'vitest'`
- コンポーネントテストのインポート: `import { render, screen } from '@testing-library/react'`
- ユーザー操作: `import userEvent from '@testing-library/user-event'`
- モックの作成: `vi.mock()` を使用

## テストの基本方針

### 品質要件
- **カバレッジ**: クリティカルパスと再利用度の高いコンポーネントでは、明記された受け入れ結果、公開分岐、失敗状態を検証する。カバレッジは目標ではなくギャップ検出のシグナルとして扱う。数値しきい値はプロジェクトのCI設定に従う
- **独立性**: 各テストは他のテストに依存せず実行可能
- **再現性**: 時刻、乱数、環境値、ネットワークレスポンス、ブラウザstateを制御し、同一の入力から同一の観測可能な結果を得る
- **可読性**: 各テストはユーザーから見える振る舞いを1つだけ名前で示し、setup・action・assertionを分け、その振る舞いで使用する値だけをfixtureに含める

### テストの重点配分
複数の機能で再利用される共有コンポーネント、Custom hook、utilityは、リグレッションの影響範囲が広いため、公開分岐、error state、境界の契約を検証する。振る舞いが複数のrender済みユニットに依存するページ単位の構成は、統合/E2Eテストで検証する。数値しきい値はプロジェクトのCI設定に従う。

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
   - 主要な受け入れ基準を実装するフロー、または複数のrender済みコンポーネントが連携するフローを検証

3. **E2Eテストでの機能横断検証**
   - 新機能追加時、既存機能への影響を必ず検証
   - Design Docの「統合ポイントマップ」で影響度「高」「中」の箇所をカバー。Design Docがない場合は、失敗によって主要なユーザージャーニーまたは契約が壊れる統合点を「高」、副次的な観測可能な振る舞いが劣化する統合点を「中」とする
   - 検証パターン: 既存機能動作 → 新機能有効化 → 既存機能の継続性確認
   - 判定基準: 元の受け入れ基準で指定された表示内容とインタラクションの振る舞いを維持する。レンダリング時間のしきい値は、プロジェクト設定または要件で値と計測方法が定義されている場合にのみ適用する
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
- 対象のコンポーネントの振る舞いを検証するテストを、対応する実装の近くで見つけられる
- Co-location原則: テストはそれがカバーする実装と同じ場所に置く
- 実装と一緒にテストを見つけやすく、保守しやすい

### 命名規則
- テストファイル: `{ComponentName}.test.tsx`
- 統合テストファイル: `{FeatureName}.integration.test.tsx`
- テストスイート: 対象のコンポーネントや機能を説明する名前
- テストケース: ユーザー視点から期待される動作を説明する名前

### テストコードの品質ルール

コミットするテストはすべて有効に保つ。現行の振る舞いを保護するテストは修復する。テストを削除するのは、対象の振る舞いが不要になったことを元の要件または実装契約で確認できる場合に限る。

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

// テスト対象が使用するRouterの範囲だけを型付けする
const mockRouter = {
  push: vi.fn()
} satisfies Pick<Router, 'push'>
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

必要なUI state、accessible name、外部契約が不明な場合は、そのアサーションのテスト設計を止め、必要なUI Spec、受け入れ基準、実装契約、ユーザー判断を具体的に示す。期待する振る舞いを確認済みの独立したアサーションは継続する。

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
