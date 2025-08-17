# TypeScript 開発ルール

## 基本原則

✅ **積極的なリファクタリング** - 技術的負債を防ぎ、健全性を維持
❌ **使われない「念のため」のコード** - YAGNI原則（Kent Beck）に反する

## コメント記述ルール
- **機能説明重視**: コードが「何をするか」を記述
- **履歴情報禁止**: 開発履歴は記載しない
- **タイムレス**: いつ読んでも有効な内容のみ記述
- **簡潔性**: 必要最小限の説明にとどめる

## 型安全性

**絶対ルール**: any型は完全禁止。型チェックが無効化され、実行時エラーの温床となる。

**any型の代替手段（優先順位順）**
1. **unknown型 + 型ガード**: 外部入力の検証に使用
2. **ジェネリクス**: 型の柔軟性が必要な場合
3. **ユニオン型・インターセクション型**: 複数の型の組み合わせ
4. **型アサーション（最終手段）**: 型が確実な場合のみ

**型ガードの実装パターン**
```typescript
// 外部入力を安全に検証
function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 
    'id' in value && 'name' in value
}
// 使用例: if (isUser(data)) { /* dataはUser型 */ }
```

**モダンな型機能の活用**
- **satisfies演算子**: 型推論を維持しつつ型チェック
  ```typescript
  const config = { port: 3000 } satisfies Config  // ✅ 型推論維持
  const config: Config = { port: 3000 }           // ❌ 型推論失われる
  ```
- **const assertion**: リテラル型で不変性を保証
  ```typescript
  const ROUTES = { HOME: '/' } as const satisfies Routes  // ✅ 不変かつ型安全
  ```
- **ブランド型**: 同じプリミティブ型でも意味を区別
  ```typescript
  type UserId = string & { __brand: 'UserId' }
  type OrderId = string & { __brand: 'OrderId' }
  // UserIdとOrderIdは互換性なし - 混同を防止
  ```
- **テンプレートリテラル型**: 文字列パターンを型で表現
  ```typescript
  type Route = `/${string}`
  type HttpMethod = 'GET' | 'POST'
  type Endpoint = `${HttpMethod} ${Route}`
  ```

**実装での型安全性**
- API通信: レスポンスは必ず`unknown`で受け、型ガードで検証
- フォーム入力: 外部入力は`unknown`、バリデーション後に型確定
- レガシー統合: `window as unknown as LegacyWindow`のように段階的アサーション
- テストコード: モックも必ず型定義、`Partial<T>`や`vi.fn<[Args], Return>()`活用

**データフローでの型安全性**
入力層（`unknown`） → 型ガード → ビジネス層（型保証） → 出力層（シリアライズ）

**型の複雑性管理**
- フィールド数: 20個まで（超えたら責務で分割、外部API型は例外）
- オプショナル率: 30%まで（超えたら必須/任意で分離）
- ネスト深さ: 3階層まで（超えたらフラット化）
- 型アサーション: 3回以上使用したら設計見直し
- **外部API型の扱い**: 制約を緩和し、実態に合わせて定義（内部では適切に変換）

## コーディング規約

**クラス使用の判断基準**
- **推奨：関数とinterfaceでの実装**
  - 背景: テスタビリティと関数合成の柔軟性が向上
- **クラス使用を許可**: 
  - フレームワーク要求時（NestJSのController/Service、TypeORMのEntity等）
  - カスタムエラークラス定義時
  - 状態とビジネスロジックが密結合している場合（例: ShoppingCart、Session、StateMachine）
- **判断基準**: 「このデータは振る舞いを持つか？」がYesならクラス検討
  ```typescript
  // ✅ 関数とinterface
  interface UserService { create(data: UserData): User }
  const userService: UserService = { create: (data) => {...} }
  // ❌ 不要なクラス
  class UserService { create(data: UserData) {...} }
  ```

**関数設計**
- **引数は0-2個まで**: 3個以上はオブジェクト化
  ```typescript
  // ✅ オブジェクト引数
  function createUser({ name, email, role }: CreateUserParams) {}
  // ❌ 多数の引数
  function createUser(name: string, email: string, role: string) {}
  ```

**依存性注入**
- **外部依存は引数で注入**: テスト可能性とモジュール性確保
  ```typescript
  // ✅ 依存性を引数で受け取る
  function createService(repository: Repository) { return {...} }
  // ❌ 直接importした実装に依存
  import { userRepository } from './infrastructure/repository'
  ```

**非同期処理**
- Promise処理: 必ず`async/await`を使用
- エラーハンドリング: 必ず`try-catch`でハンドリング
- 型定義: 戻り値の型は明示的に定義（例: `Promise<Result>`）

**フォーマット規則**
- セミコロン省略（Biomeの設定に従う）
- 型は`PascalCase`、変数・関数は`camelCase`
- インポートは絶対パス（`src/`）

**クリーンコード原則**
- ✅ 使用されていないコードは即座に削除
- ✅ デバッグ用`console.log()`は削除
- ❌ コメントアウトされたコード（バージョン管理で履歴管理）
- ✅ コメントは「なぜ」を説明（「何」ではなく）

## エラーハンドリング

**絶対ルール**: エラーの握りつぶし禁止。すべてのエラーは必ずログ出力と適切な処理を行う。

**Result型パターン**: エラーを型で表現し、明示的に処理
```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

// 使用例：エラーの可能性を型で表現
function parseUser(data: unknown): Result<User, ValidationError> {
  if (!isValid(data)) return { ok: false, error: new ValidationError() }
  return { ok: true, value: data as User }
}
```

**カスタムエラークラス**
```typescript
export class AppError extends Error {
  constructor(message: string, public readonly code: string, public readonly statusCode = 500) {
    super(message)
    this.name = this.constructor.name
  }
}
// 用途別: ValidationError(400), BusinessRuleError(400), DatabaseError(500), ExternalServiceError(502)
```

**層別エラー処理**
- API層: HTTPレスポンスに変換、機密情報を除外してログ出力
- サービス層: ビジネスルール違反を検出、AppErrorはそのまま伝播
- リポジトリ層: 技術的エラーをドメインエラーに変換

**構造化ログと機密情報保護**
機密情報（password, token, apiKey, secret, creditCard）は絶対にログに含めない

**非同期エラーハンドリング**
- グローバルハンドラー設定必須: `unhandledRejection`, `uncaughtException`
- すべてのasync/awaitでtry-catch使用
- エラーは必ずログと再スロー

## リファクタリング手法

**基本方針**
- 小さなステップ: 段階的改善により、常に動作する状態を維持
- 安全な変更: 一度に変更する範囲を最小限に抑制
- 動作保証: 既存の動作を変えないことを確認しながら進める

**実施手順**: 現状把握 → 段階的変更 → 動作確認 → 最終検証

**優先順位**: 重複コード削除 > 長大な関数分割 > 複雑な条件分岐簡素化 > 型安全性向上

## パフォーマンス最適化

- ストリーミング処理: 大きなデータセットはストリームで処理
- メモリリーク防止: 不要なオブジェクトは明示的に解放