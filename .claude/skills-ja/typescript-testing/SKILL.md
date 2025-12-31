---
name: typescript-testing
description: Vitestテスト設計と品質基準を適用。カバレッジ要件とモック使用ガイドを提供。ユニットテスト作成時に使用。
---

# TypeScript テストルール

## テストフレームワーク

- **Vitest**: このプロジェクトではVitestを使用
- テストのインポート: `import { describe, it, expect, beforeEach, vi } from 'vitest'`
- モックの作成: `vi.mock()` を使用

## テストの基本方針

### 品質要件
- **カバレッジ**: 単体テストのカバレッジは70%以上を必須
- **独立性**: 各テストは他のテストに依存せず実行可能
- **再現性**: テストは環境に依存せず、常に同じ結果を返す
- **可読性**: テストコードも製品コードと同様の品質を維持

### カバレッジ要件
**必須**: 単体テストのカバレッジは70%以上
**指標**: Statements（文）、Branches（分岐）、Functions（関数）、Lines（行）

### テストの種類と範囲
1. **単体テスト（Unit Tests）**
   - 個々の関数やクラスの動作を検証
   - 外部依存はすべてモック化
   - 最も数が多く、細かい粒度で実施

2. **統合テスト（Integration Tests）**
   - 複数のコンポーネントの連携を検証
   - 実際の依存関係を使用（DBやAPI等）
   - 主要な機能フローの検証

3. **E2Eテストでの機能横断検証**
   - 新機能追加時、既存機能への影響を必ず検証
   - Design Docの「統合ポイントマップ」で影響度「高」「中」の箇所をカバー
   - 検証パターン: 既存機能動作 → 新機能有効化 → 既存機能の継続性確認
   - 判定基準: レスポンス内容の変化なし、処理時間5秒以内
   - CI/CDでの自動実行を前提とした設計

## テストの実装規約

### ディレクトリ構造
```
src/
└── application/
    └── services/
        ├── __tests__/
        │   ├── service.test.ts      # 単体テスト
        │   └── service.int.test.ts  # 統合テスト
        └── service.ts
```

### 命名規則
- テストファイル: `{対象ファイル名}.test.ts`
- 統合テストファイル: `{対象ファイル名}.int.test.ts`
- テストスイート: 対象の機能や状況を説明する名前
- テストケース: 期待される動作を説明する名前

### テストコードの品質ルール

**推奨: すべてのテストを常に有効に保つ**
- メリット: テストスイートの完全性を保証
- 実践: 問題があるテストは修正して有効化

**避けるべき: test.skip()やコメントアウト**
- 理由: テストの穴が生まれ、品質チェックが不完全になる
- 対処: 不要なテストは完全に削除する

## テスト品質基準

### 境界値・異常系の網羅
正常系に加え、境界値と異常系を含める。
```typescript
it('returns 0 for empty array', () => expect(calc([])).toBe(0))
it('throws on negative price', () => expect(() => calc([{price: -1}])).toThrow())
```

### 期待値の直接記述
期待値はリテラルで記述。実装ロジックを再現しない。
**有効なテスト**: 期待値 ≠ モック戻り値（実装による変換・処理がある）
```typescript
expect(calcTax(100)).toBe(10)  // not: 100 * TAX_RATE
```

### 結果ベースの検証
呼び出し順序・回数ではなく結果を検証。
```typescript
expect(mock).toHaveBeenCalledWith('a')  // not: toHaveBeenNthCalledWith
```

### 意味あるアサーション
各テストに最低1つの検証を含める。
```typescript
it('creates user', async () => {
  const user = await createUser({name: 'test'})
  expect(user.id).toBeDefined()
})
```

### 適切なモック範囲
直接依存の外部I/Oのみモック。間接依存は実物使用。
```typescript
vi.mock('./database')  // 外部I/Oのみ
```

### Property-based Testing（fast-check）
不変条件やプロパティを検証する場合はfast-checkを使用。
```typescript
import fc from 'fast-check'

it('reverses twice equals original', () => {
  fc.assert(fc.property(fc.array(fc.integer()), (arr) => {
    return JSON.stringify(arr.reverse().reverse()) === JSON.stringify(arr)
  }))
})
```

**使用条件**: Design DocのACにProperty注釈が付与されている場合に使用。

## モックの型安全性

### 必要最小限の型定義
```typescript
// 必要な部分のみ
type TestRepo = Pick<Repository, 'find' | 'save'>
const mock: TestRepo = { find: vi.fn(), save: vi.fn() }

// やむを得ない場合のみ、理由明記
const sdkMock = {
  call: vi.fn()
} as unknown as ExternalSDK // 外部SDKの複雑な型のため
```

## Vitestの基本例

```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('./userService', () => ({
  getUserById: vi.fn(),
  updateUser: vi.fn()
}))

describe('ComponentName', () => {
  it('should follow AAA pattern', () => {
    const input = 'test'
    const result = someFunction(input)
    expect(result).toBe('expected')
  })
})
```
