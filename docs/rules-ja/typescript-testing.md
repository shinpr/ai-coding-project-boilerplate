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

### カバレッジの確認方法

```bash
# 正確なカバレッジ計測（推奨）
npm run test:coverage:fresh

# HTMLレポートで詳細確認
open coverage/index.html
```

**カバレッジ指標**: Statements（文）、Branches（分岐）、Functions（関数）、Lines（行）

### テストの種類と範囲
1. **単体テスト（Unit Tests）**
   - 個々の関数やクラスの動作を検証
   - 外部依存はすべてモック化
   - 最も数が多く、細かい粒度で実施

2. **統合テスト（Integration Tests）**
   - 複数のコンポーネントの連携を検証
   - 実際の依存関係を使用（DBやAPI等）
   - 主要な機能フローの検証

## テストの設計原則

### Red-Green-Refactorプロセス（TDD - Kent Beck による手法）

#### 基本原則
**すべての新機能・バグ修正はテストから始める**。実装コードを書く前に、必ず失敗するテストを書く。

#### プロセスの詳細手順

1. **Red（失敗するテストを書く）**
   - 実装前に期待される動作をテストで定義
   - この時点ではテストは必ず失敗する

2. **Green（最小限の実装でテストを通す）**
   - テストが通る最小限の実装を行う
   - ハードコーディングでも構わない

3. **Refactor（コードを改善）**
   - テストが通る状態を維持しながらコードを改善
   - 各段階でテストを実行し、動作を確認

#### テストファースト適用の例外

1. **純粋な設定変更**: 環境変数、ビルド設定、依存パッケージ更新
2. **ドキュメント更新**: README、コメント、型定義のみの変更
3. **リファクタリング**: 既存テストでカバー済み、外部インターフェース不変
4. **緊急対応**: 本番障害修正（修正後は必ずテスト追加）

#### 既存コードへのテスト追加戦略

1. **新機能追加時**: 必ずテストファーストで実装
2. **バグ修正時**: バグを再現するテストを先に書く
3. **リファクタリング時**: 現在の動作を保護するテストを先に作成

### テストケースの構造
- テストは「準備（Arrange）」「実行（Act）」「検証（Assert）」の3段階で構成
- 各テストの目的が明確に分かる命名
- 1つのテストケースでは1つの振る舞いのみを検証

### テストデータ管理
- テストデータは専用ディレクトリで管理
- 環境変数はテスト用の値を定義
- 機密情報は必ずモック化
- テストデータは最小限に保ち、テストケースの検証目的に直接関連するデータのみ使用

### モックとスタブの使用方針

✅ **推奨: 単体テストでの外部依存モック化**
- メリット: テストの独立性と再現性を確保
- 実践: DB、API、ファイルシステム等の外部依存をモック化

❌ **避けるべき: 単体テストでの実際の外部接続**
- 理由: テスト速度が遅くなり、環境依存の問題が発生するため

✅ **推奨: モックの型安全性確保**
- メリット: テストコードでも型エラーを検出可能
- 実践: モックやスタブでも適切な型定義を使用

❌ **避けるべき: テストコードでのany型使用**
- 理由: テストの信頼性が低下し、バグを見逃す可能性がある

### テスト失敗時の対応判断基準

#### テストを修正すべきケース
1. **明らかに間違った期待値**: 技術的に誤っている場合
2. **存在しない機能への参照**: リファクタリングで変更された関数
3. **実装の詳細への過度な依存**: 内部実装に依存しすぎている
4. **テストのためだけの実装**: テストを通すためだけの不要なコード

#### 実装を修正すべきケース
1. **仕様として妥当なテスト**: 動作が妥当な仕様を表現
2. **ビジネスロジックのテスト**: 重要なビジネスロジックの検証
3. **エッジケースの処理**: 重要なエッジケースの検証

#### 判断に迷った場合
必ずユーザーに確認を取る

## テストヘルパーの活用ルール

### 基本原則
- **テストヘルパーの共通化**: 3箇所以上で重複するパターンは共通化を検討（Rule of Three - Martin Fowler「Refactoring」）
- **判断基準**: シンプルで安定的なものは共通化、複雑・変更頻度の高いものは個別実装

### 判断基準
| モックの特性 | 対応方針 |
|-------------|---------|
| **単純で安定** | 共通ヘルパーに集約 |
| **複雑または変更頻度高** | 個別実装 |
| **3箇所以上で重複** | 共通化を検討 |
| **テスト固有ロジック** | 個別実装 |

### テストヘルパー活用例
```typescript
// ✅ 推奨: ビルダーパターンの活用
const testData = new TestDataBuilder()
  .withDefaults()
  .withName('Test User')
  .build()

// ✅ 推奨: カスタムアサーション
function assertValidUser(user: unknown): asserts user is User {
  // バリデーションロジック
}

// ❌ 避ける: 重複する複雑なモックの個別実装
```

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

### エラーケースのテスト
- 正常系と異常系の両方をテスト
- エラー発生時の挙動を明確に検証
- エラーメッセージの内容も検証

### テストコードの品質ルール

✅ **推奨: すべてのテストを常に有効に保つ**
- メリット: テストスイートの完全性を保証
- 実践: 問題があるテストは修正して有効化

❌ **避けるべき: test.skip()やコメントアウト**
- 理由: テストの穴が生まれ、品質保証が不完全になる
- 対処: 不要なテストは完全に削除する

### Vitestプロセス管理ルール

```bash
# テスト実行後のクリーンアップ（必須）
npm run cleanup:processes

# または安全な実行
npm run test:safe
```

## Vitestの基本例

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

// モックの設定例
vi.mock('./userService', () => ({
  getUserById: vi.fn(),
  updateUser: vi.fn()
}))

describe('ComponentName', () => {
  it('should follow AAA pattern', () => {
    // Arrange
    const input = 'test'
    
    // Act
    const result = someFunction(input)
    
    // Assert
    expect(result).toBe('expected')
  })
})
```

## 参照した手法
- **Red-Green-Refactor**: Kent Beck「Test-Driven Development」