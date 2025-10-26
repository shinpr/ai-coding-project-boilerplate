# TypeScript開発ルール（フロントエンド）

## 基本原則

✅ **積極的なリファクタリング** - 技術的負債を防ぎ、健全性を維持
❌ **「念のため」の未使用コード** - YAGNI原則違反（Kent Beck）

## コメント記述ルール
- **機能説明に集中**: コードが「何をするか」を説明
- **履歴情報なし**: 開発経緯は記録しない
- **時間に依存しない**: いつ読んでも有効な内容のみ記載
- **簡潔性**: 必要最小限の説明に留める

## 型安全性

**絶対ルール**: any型は完全禁止。型チェックを無効化し、実行時エラーの元凶となる。

**any型の代替策（優先順位順）**
1. **unknown型 + 型ガード**: 外部入力の検証に使用（APIレスポンス、localStorage、URLパラメータ）
2. **ジェネリクス**: 型の柔軟性が必要な場合
3. **Union Types・Intersection Types**: 複数の型の組み合わせ
4. **型アサーション（最終手段）**: 型が確実な場合のみ

**型ガード実装パターン**
```typescript
function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'id' in value && 'name' in value
}
```

**モダンな型機能**
- **satisfies演算子**: `const config = { apiUrl: '/api' } satisfies Config` - 推論を保持
- **const assertion**: `const ROUTES = { HOME: '/' } as const satisfies Routes` - 不変かつ型安全
- **Branded Types**: `type UserId = string & { __brand: 'UserId' }` - 意味を区別
- **Template Literal Types**: `type EventName = \`on\${Capitalize<string>}\`` - 文字列パターンを型で表現

**フロントエンド実装における型安全性**
- **React Props/State**: TypeScriptが型管理、unknown不要
- **外部APIレスポンス**: 常に`unknown`として受け取り、型ガードで検証
- **localStorage/sessionStorage**: `unknown`として扱い、検証
- **URLパラメータ**: `unknown`として扱い、検証
- **Form入力（Controlled Components）**: React合成イベントで型安全

**データフローにおける型安全性**
- **Frontend → Backend**: Props/State（型保証済み） → APIリクエスト（シリアライゼーション）
- **Backend → Frontend**: APIレスポンス（`unknown`） → 型ガード → State（型保証済み）

**型の複雑性管理**
- フィールド数: 20個まで（超過時は責務で分割、外部API型は例外）
- オプショナル比率: 30%まで（超過時は必須/オプショナルを分離）
- ネスト深度: 3階層まで（超過時はフラット化）
- 型アサーション: 3回以上使用で設計見直し
- **外部API型**: 制約を緩和し実態に応じて定義（内部で適切に変換）

## コーディング規約

**コンポーネント設計基準（React 19）**
- **Function Components（必須）**: React 19公式推奨、React Compiler最適化対象
- **Classes禁止**: Class componentsは完全非推奨（例外: Error Boundary）
- **Custom Hooks**: ロジック再利用の標準パターン

**関数設計**
- **0-2パラメータまで**: 3個以上はオブジェクト使用
  ```typescript
  // ✅ オブジェクトパラメータ
  function createUser({ name, email, role }: CreateUserParams) {}
  ```

**Props設計（Props-drivenアプローチ）**
- Propsはインターフェース: 必要な情報を全てPropsとして定義
- 暗黙的依存を避ける: 必要なくグローバルstateやcontextに依存しない
- 型安全性: Props型を常に明示的に定義

**環境変数（Vite）**
- **`import.meta.env.VITE_*`のみ**: `process.env`はブラウザで動作しない
- **クライアントサイドに秘密情報なし**: フロントエンドコードは全て公開、秘密情報はバックエンドで管理

**依存性注入**
- **カスタムフックで依存性注入**: テスト可能性とモジュール性を確保

**非同期処理**
- Promise処理: 常に`async/await`使用
- エラーハンドリング: 常に`try-catch`またはError Boundaryで処理
- 型定義: 戻り値の型を明示的に定義（例: `Promise<Result>`）

**フォーマットルール**
- セミコロン省略（Biome設定に従う）
- 型は`PascalCase`、変数・関数は`camelCase`
- importは絶対パス使用（`src/`）

**Clean Code原則**
- ✅ 未使用コードは即座に削除
- ✅ デバッグ用`console.log()`削除
- ❌ コメントアウトされたコード（履歴はバージョン管理で）
- ✅ コメントは「理由」を説明（「何を」ではない）

## エラーハンドリング

**絶対ルール**: エラー抑制禁止。全てのエラーはログ出力と適切な処理が必須。

**Fail-Fast原則**: エラー時は速やかに失敗し、無効な状態での処理継続を防ぐ
```typescript
// ❌ 禁止: 無条件フォールバック
catch (error) {
  return defaultValue // エラーを隠蔽
}

// ✅ 必須: 明示的な失敗
catch (error) {
  logger.error('処理失敗', error)
  throw error // Error Boundaryまたは上位層で処理
}
```

**Result型パターン**: エラーを型で表現し明示的にハンドリング
```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

// 例: エラーの可能性を型で表現
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
// 目的別: ValidationError(400), ApiError(502), NotFoundError(404)
```

**レイヤー別エラーハンドリング（React）**
- Error Boundary: Reactコンポーネントエラーをキャッチ、フォールバックUI表示
- Custom Hook: ビジネスルール違反を検出、AppErrorをそのまま伝播
- API層: fetchエラーをドメインエラーに変換

**構造化ロギングと機密情報保護**
ログに機密情報（password、token、apiKey、secret、creditCard）を絶対含めない

**Reactでの非同期エラーハンドリング**
- Error Boundaryセットアップ必須: レンダリングエラーをキャッチ
- イベントハンドラ内の全async/awaitでtry-catch使用
- エラーは常にログ記録し、再スローまたはerror stateで表示

## リファクタリング手法

**基本方針**
- 小さなステップ: 段階的改善により常に動作する状態を維持
- 安全な変更: 一度に変更する範囲を最小化
- 動作保証: 既存の動作が変わらないことを確認しながら進める

**実施手順**: 現状把握 → 段階的変更 → 動作確認 → 最終検証

**優先順位**: 重複コード削除 > 大きな関数の分割 > 複雑な条件分岐の簡略化 > 型安全性向上

## パフォーマンス最適化

- コンポーネントメモ化: 高コストコンポーネントにReact.memo使用
- State最適化: 適切なstate構造で再レンダリングを最小化
- 遅延読み込み: React.lazyとSuspenseでコード分割
- バンドルサイズ: `npm run build`で監視し500KB以下を維持
