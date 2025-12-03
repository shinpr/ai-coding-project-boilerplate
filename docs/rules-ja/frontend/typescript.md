# TypeScript開発ルール

## フロントエンド固有のアンチパターン

coding-standards.mdの普遍的アンチパターンに加え、以下のフロントエンド固有の問題に注意：

- **3階層以上のProp drilling** - Context APIまたは状態管理を使用すべき
- **巨大なコンポーネント（300行以上）** - 小さなコンポーネントに分割

## Frontend実装における型安全性

**データフローにおける型安全性**
- **Frontend → Backend**: Props/State（型保証済み） → APIリクエスト（シリアライゼーション）
- **Backend → Frontend**: APIレスポンス（`unknown`） → 型ガード → State（型保証済み）

**Frontend固有の型シナリオ**:
- **React Props/State**: TypeScriptが型管理、unknown不要
- **外部APIレスポンス**: 常に`unknown`として受け取り、型ガードで検証
- **localStorage/sessionStorage**: `unknown`として扱い、検証
- **URLパラメータ**: `unknown`として扱い、検証
- **Form入力（Controlled Components）**: React合成イベントで型安全

**型の複雑性管理（Frontend）**
- **Props設計**:
  - Props数: 3-7個が理想（10個超えたらコンポーネント分割検討）
  - Optional Props: 50%以下（多すぎる場合はデフォルト値やContext使用検討）
  - ネスト: 2レベルまで（深いネストはFlatten推奨）
- 型アサーション: 3回以上使用で設計見直し
- **外部API型**: 制約を緩和し実態に応じて定義（内部で適切に変換）

## コーディング規約

**コンポーネント設計基準**
- **Function Components（必須）**: React公式推奨、モダンツールで最適化可能
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

**環境変数**
- **ビルドツールの環境変数システムを使用**: `process.env`はブラウザで動作しない
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

## パフォーマンス最適化

- コンポーネントメモ化: 高コストコンポーネントにReact.memo使用
- State最適化: 適切なstate構造で再レンダリングを最小化
- 遅延読み込み: React.lazyとSuspenseでコード分割
- バンドルサイズ: `build`スクリプト（package.jsonの`packageManager`フィールドに応じた実行コマンドを使用）で監視し最適化
