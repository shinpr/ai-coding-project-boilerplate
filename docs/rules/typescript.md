# TypeScript 開発ルール

## 基本原則

### コードの進化と保守性

- ✅ **積極的なリファクタリング** - 技術的負債を防ぎ、健全性を維持
- ❌ **使われない「念のため」のコード** - YAGNI原則（Kent Beck）に反する

## コメント記述ルール
- **機能説明重視**: コードが「何をするか」を記述
- **履歴情報禁止**: 開発履歴は記載しない
- **タイムレス**: いつ読んでも有効な内容のみ記述
- **簡潔性**: 必要最小限の説明にとどめる

## 型システムの活用

### 型安全性の原則

- ✅ **unknown型と型ガード** - 型安全性を保ちながら柔軟に対応
- ❌ **any型の使用** - 型チェック無効化により実行時エラーの原因
- ✅ **型推論の活用** - 冗長な型注釈を省略し可読性向上

### 型安全性の確保
```typescript
// 型ガードによる安全な型絞り込み
function isUser(value: unknown): value is User {
  return typeof value === "object" && value !== null && "id" in value
}

// Discriminated Unionsで状態管理
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }
```

### any型使用ガイドライン

❌ **any型は完全禁止** - 型チェックが無効化され、実行時エラーの温床となる

#### 代替手段（優先順位順）
1. **unknown型 + 型ガード** - 型が不明な値の安全な処理
2. **ジェネリクス** - 型の柔軟性が必要な場合
3. **ユニオン型・インターセクション型** - 複数の型の組み合わせ
4. **型アサーション（as）** - 型の保証が確実な場合のみ

```typescript
// ❌ 禁止: any型
const result = (window as any).legacyLibFunction()

// ✅ 推奨: unknown型と型アサーション
const result = (window as unknown as { legacyLibFunction: () => string }).legacyLibFunction()
```

## コーディング規約

### 非同期処理
- **Promise処理**: 必ず`async/await`を使用
- **エラーハンドリング**: 必ず`try-catch`でハンドリング
- **型定義**: 戻り値の型は明示的に定義（例: `Promise<Result>`）

### コードスタイル

**フォーマット規則**
- セミコロン省略（Biomeの設定に従う）
- 型は`PascalCase`、変数・関数は`camelCase`
- インポートは絶対パス（`src/`）

**クリーンコード原則**
- ✅ 使用されていないコードは即座に削除
- ✅ デバッグ用`console.log()`は削除
- ❌ コメントアウトされたコード（バージョン管理で履歴管理）
- ✅ コメントは「なぜ」を説明（「何」ではなく）

### 日付・時刻処理

```typescript
// ✅ 推奨: タイムゾーン明示的指定
const dateStr = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })

// ❌ 避ける: タイムゾーンなし（環境依存）
const dateStr = new Date().toLocaleString('ja-JP')

// ✅ 推奨: データ保存はUTC
const timestamp = new Date().toISOString()
```

## エラーハンドリング

### 基本方針
- カスタムエラークラスを使用
- エラーは発生した層で処理（ドメイン層のエラーはドメイン層で、インフラ層のエラーはインフラ層で）
- ログは構造化して出力（JSON形式でコンテキスト情報を含める）

```typescript
// ✅ 推奨: カスタムエラー
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ✅ 推奨: 構造化ログ
logger.error('API Error:', {
  code: error.code,
  statusCode: error.statusCode,
  message: error.message,
})
```

## リファクタリング手法

### 基本方針
- **テストファースト**: 既存動作を保護するテストを先に作成
- **小さなステップ**: 段階的改善により、常に動作する状態を維持
- **安全な変更**: 一度に変更する範囲を最小限に抑制

### 実施手順
1. **現状把握**: 変更対象の動作を理解し、既存テストを確認
2. **保護テスト作成**: リファクタリング対象の現在の動作を保護するテスト追加
3. **段階的変更**: 小さな単位で構造を改善
4. **検証**: 各段階でテスト実行し、動作に変更がないことを確認
5. **最終確認**: 全体テストを実行し、意図しない影響がないことを検証

### 優先すべきリファクタリング
- **重複コード削除**: DRY原則（Don't Repeat Yourself - Andy Hunt & Dave Thomas）に基づく共通化
- **長大な関数分割**: 単一責任原則（Single Responsibility Principle - Robert C. Martin）に基づく機能分割
- **複雑な条件分岐簡素化**: 早期リターンやガード節の活用
- **型安全性向上**: any型の排除、unknown型と型ガードの活用

## 型複雑性チェックルール（YAGNI原則 - Kent Beck の具体化）

### 型の複雑性制限

| 項目 | 推奨 | 警告 | 禁止 |
|------|------|------|------|
| フィールド数 | 20以下 | 30超 | 50超 |
| オプショナルフィールド比率 | 30%以下 | 50%超 | - |
| 型階層の深さ | 3階層まで | - | 5階層超 |

*例外: 外部ライブラリの型を拡張する場合

### 型設計のベストプラクティス

責務ごとに型を分割し、継承やコンポジションを活用して複雑性を管理する。上記の数値基準（フィールド数20以下、オプショナル比率30%以下、階層3まで）を超えた場合は即座にリファクタリングを実施。

## パフォーマンス最適化

### 基本原則
- **ストリーミング処理** - 大きなデータセットはストリームで処理
- **メモリリーク防止** - 不要なオブジェクトは明示的に解放
- **シンプル性優先** - 過度な最適化より保守性を重視

## 参照した原則
- **YAGNI原則**: Kent Beck「Extreme Programming Explained」
- **DRY原則**: Andy Hunt & Dave Thomas「The Pragmatic Programmer」
- **単一責任原則**: Robert C. Martin「Clean Code」