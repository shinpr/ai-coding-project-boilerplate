---
name: typescript-testing
description: Vitestテスト設計と品質基準を適用。カバレッジ要件とモック使用ガイドを提供。ユニットテスト作成時に使用。
---

# TypeScript テストルール

## 前提条件の検出

フレームワークやコマンドを選択する前に、`package.json`、ロックファイル、テスト設定、既存テストのimportを確認する。Vitest固有のルールはVitestが設定されている場合にのみ適用する。それ以外は、以下の振る舞い、独立性、証跡に関するルールを維持しつつ、リポジトリで設定済みのTypeScriptテストハーネスを使用する。実行可能なハーネスを特定できない場合は、確認したパスと不足しているコマンドまたは設定を報告する。

## テストフレームワーク

- **Vitest**: リポジトリ設定または既存テストで選択されている場合に使用
- テストのインポート: `import { describe, it, expect, beforeEach, vi } from 'vitest'`
- モックの作成: `vi.mock()` を使用

## テストの基本方針

### 品質要件
- **カバレッジ**: カバレッジは目標ではなく未テスト領域を見つける診断シグナルとして扱う（目標化すると自明なテストに歪む — グッドハートの法則）。クリティカルパス・ビジネスロジック・リグレッションが問題になる振る舞いにテストを集中させる。数値しきい値はプロジェクトの CI 設定に委ねる
- **独立性**: 各テストは他のテストに依存せず実行可能
- **再現性**: 時刻、乱数、環境値、外部I/Oを制御し、同一の入力から同一の観測可能な結果を得る
- **可読性**: 各テストは1つの振る舞いを名前で示し、setup・action・assertionを分け、その振る舞いで使用する値だけをfixtureに含める

### カバレッジ
- カバレッジ数値よりも意味のあるアサーションを優先する。パーセンテージ達成のためではなく、ギャップが実際のリグレッションを無防備にしている箇所でカバレッジを上げる
- **指標**（カバレッジレポートの内訳）: Statements（文）、Branches（分岐）、Functions（関数）、Lines（行）

### テストの種類と範囲
1. **単体テスト（Unit Tests）**
   - 個々の関数やクラスの動作を検証
   - 外部依存はすべてモック化
   - 最も数が多く、細かい粒度で実施

2. **統合テスト（Integration Tests）**
   - 複数のコンポーネントの連携を検証
   - テスト対象の振る舞いを構成するin-processコンポーネントは実物を使用
   - 外部I/O境界は、その境界の実装または契約自体がテスト対象の場合にのみ実物を使用する。それ以外は決定的な代替を使用し、境界のrequest/response契約を検証する
   - 主要な受け入れ基準を実装するフロー、またはin-processコンポーネントの境界をまたぐフローを検証

3. **E2Eテストでの機能横断検証**
   - 新機能追加時、既存機能への影響を必ず検証
   - Design Docの「統合ポイントマップ」で影響度「高」「中」の箇所をカバー。Design Docがない場合は、主要なユーザージャーニーまたは公開契約が失敗する箇所を「高」、副次的な観測可能な振る舞いが劣化する箇所を「中」とする
   - 検証パターン: 既存機能動作 → 新機能有効化 → 既存機能の継続性確認
   - 判定基準: 元の受け入れ基準で指定されたレスポンスフィールドと観測可能な振る舞いを維持する。処理時間のしきい値は、要件またはプロジェクト設定で値と計測方法が定義されている場合にのみ適用する
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

コミットするテストはすべて有効に保つ。現行の振る舞いを保護するテストは修復する。テストを削除するのは、対象の振る舞いが不要になったことを元の要件または実装契約で確認できる場合に限る。

## テスト品質基準

### 境界値・異常系の網羅
正常系に加え、境界値と異常系を含める。
```typescript
it('returns 0 for empty array', () => expect(calc([])).toBe(0))
it('throws on negative price', () => expect(() => calc([{price: -1}])).toThrow())
```

### 期待値の直接記述
期待値は実装上の計算から独立させる。契約を直接表現できる場合はリテラルを優先し、それ以外は独立した正規のfixtureまたは仕様から導出する。
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

### モック範囲の判断
連携がテスト対象となるin-processコンポーネントにはすべて実物を使用する。上位層の振る舞いをテストする場合は、直接依存する外部I/Oを代替する。外部アダプター、query、migration、service契約自体がテスト対象の場合は、実エンジンまたは本番相当のテストインスタンスを使用する。
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

// テスト対象が使用するSDKの範囲だけを型付けする
const sdkMock = {
  call: vi.fn()
} satisfies Pick<ExternalSDK, 'call'>
```

## データ層テスト

### データ層に対するモックの限界

モックは呼び出しパターンを検証するが、データ層の正確性は検証できない。モックのみのテストでは以下が検出されずに通過する:
- スキーマの不一致（テーブル名、カラム名、データ型）
- クエリの正確性（JOIN、フィルタ、集約、グルーピング）
- データベース制約（NOT NULL、UNIQUE、外部キー）
- マイグレーションの乖離（スキーマ変更によるコードとの不整合）

### モックを使用するデータアクセステスト

- データ層からデータを受け取るビジネスロジックのテスト（repositoryをモック、serviceをテスト）
- エラーハンドリングパスのテスト（接続失敗、タイムアウトのシミュレーション）
- データアクセスがテスト対象ではなく依存先であるユニットテスト

### データアクセスにモックが不十分な場合

- repositoryやデータアクセス実装自体のテスト
- クエリの正確性の検証（JOIN、フィルタ、集約、グルーピング）
- データ整合性制約のテスト
- マイグレーション互換性のテスト

### 実データベーステスト（環境依存）

実データベースエンジンに対するデータ層の正確性を検証するオプション:
- CI環境向けの**コンテナ化されたデータベース**
- 高速フィードバック用の**インメモリデータベース**（注: dialect差異が問題を隠す場合がある）
- seed data付きの**専用テストデータベース**

リポジトリの根拠に合う最初の選択肢を使用する：
1. CI用のデータベースハーネスが設定されている場合は、それを使用する。
2. それ以外でcontainerを実行できる場合は、同じデータベースエンジンをcontainerで使用する。
3. 検証対象の振る舞いがdialect非依存の場合にのみin-memory databaseを使用し、未検証となるdialect固有の振る舞いを記録する。
4. リポジトリですでに専用テストデータベースのprovisioningと分離が行われている場合は、それを使用する。

いずれも利用できず、データ層の正確性がテスト対象である場合は作業を止め、不足している環境前提条件を報告する。モックだけの結果は、query、schema、constraint、migrationの正確性を示す証跡にはならない。

### AI生成コードとスキーマ認識

- AI生成のデータアクセスコードはスキーマのhallucinationリスクが高い
- 生成されたクエリは正しい構文でも、存在しないスキーマ要素を参照する場合がある
- モックベースのテストはスキーマの正確性に関わらずパスする
- 緩和策: Design Docに明示的なスキーマ参照を含めることで、レビュー時にドキュメント化されたスキーマとデータアクセスコードを照合可能にする

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
