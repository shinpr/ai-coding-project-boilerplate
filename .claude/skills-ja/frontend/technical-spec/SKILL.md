---
name: frontend/technical-spec
description: フロントエンドの環境変数、コンポーネント設計、データフローを定義。React環境設定時に使用。
---

# 技術設計ルール（フロントエンド）

## 技術スタックの基本方針
TypeScriptベースのReactアプリケーション実装。アーキテクチャパターンはプロジェクトの要件と規模に応じて選択する。

## 環境変数管理とセキュリティ

### 環境変数管理
- **ビルドツールの環境変数システムを使用**: `process.env`はブラウザ環境で動作しない
- 設定レイヤーを通じて環境変数を一元管理
- TypeScriptによる適切な型安全性の実装
- デフォルト値設定と必須チェックの適切な実装

```typescript
// ビルドツールの環境変数（公開値のみ）
const config = {
  apiUrl: import.meta.env.API_URL || 'http://localhost:3000',
  appName: import.meta.env.APP_NAME || 'My App'
}

// フロントエンドでは動作しない
const apiUrl = process.env.API_URL // NG
```

### セキュリティ（クライアントサイド制約）
- **重要**: すべてのフロントエンドコードは公開され、ブラウザで見える
- **クライアントサイドに秘密情報を保存しない**: APIキー、トークン、シークレットを環境変数に含めない
- `.env`ファイルをGitに含めない（バックエンドと同様）
- 機密情報のログ出力を禁止（パスワード、トークン、個人情報）
- エラーメッセージに機密情報を含めない

**秘密情報の正しい取り扱い**:
```typescript
// セキュリティリスク: APIキーがブラウザで露出
const apiKey = import.meta.env.VITE_API_KEY
const response = await fetch(`https://api.example.com/data?key=${apiKey}`)

// 正しい: バックエンドが秘密情報を管理、フロントエンドはプロキシ経由でアクセス
const response = await fetch('/api/data') // バックエンドがAPIキー認証を処理
```

## アーキテクチャ設計

### フロントエンドアーキテクチャパターン

**Reactコンポーネントアーキテクチャ**:
- **Function Components**: 必須、class componentsは非推奨
- **Custom Hooks**: ロジック再利用と依存性注入のため
- **コンポーネント階層**: Atoms → Molecules → Organisms → Templates → Pages
- **Props-driven**: コンポーネントは必要なすべてのデータをPropsで受け取る
- **Co-location**: テスト、スタイル、関連ファイルをコンポーネントと同じ場所に配置

**状態管理パターン**:
- **Local State**: コンポーネント固有の状態には`useState`
- **Context API**: コンポーネントツリー全体で状態を共有（テーマ、認証等）
- **Custom Hooks**: 状態ロジックと副作用をカプセル化
- **Server State**: APIデータのキャッシュにはReact QueryまたはSWR

## データフロー統一原則

### クライアントサイドのデータフロー
Reactアプリケーション全体で一貫したデータフローを維持：

- **Single Source of Truth**: 各状態には1つの権威あるソースがある
  - UI状態: コンポーネントStateまたはContext
  - サーバーデータ: React Query/SWRでキャッシュされたAPIレスポンス
  - フォームデータ: React Hook Formを使ったControlled Components

- **単方向フロー**: データはPropsを通じて上から下へ流れる
  ```
  APIレスポンス → State → Props → Render → UI
  ユーザー入力 → イベントハンドラ → State更新 → 再レンダリング
  ```

- **Immutable Updates**: State更新には不変パターンを使用
  ```typescript
  // 不変なState更新
  setUsers(prev => [...prev, newUser])

  // 可変なState更新（禁止）
  users.push(newUser)
  setUsers(users)
  ```

### データフローにおける型安全性
- **Frontend → Backend**: Props/State（型保証済み） → APIリクエスト（シリアライゼーション）
- **Backend → Frontend**: APIレスポンス（`unknown`） → 型ガード → State（型保証済み）

```typescript
// 型安全なデータフロー
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`)
  const data: unknown = await response.json()

  if (!isUser(data)) {
    throw new Error('Invalid user data')
  }

  return data // User型として保証
}
```

## ビルドとテスト
package.jsonの`packageManager`フィールドに応じた実行コマンドを使用すること。

### ビルドコマンド
- `dev` - 開発サーバー
- `build` - 本番ビルド
- `preview` - 本番ビルドのプレビュー
- `type-check` - 型チェック（出力なし）

### テストコマンド
- `test` - テスト実行
- `test:coverage` - カバレッジ付きテスト実行
- `test:coverage:fresh` - カバレッジ付きテスト実行（キャッシュクリア）
- `test:safe` - 安全なテスト実行（自動クリーンアップ付き）
- `cleanup:processes` - Vitestプロセスのクリーンアップ

### 品質チェック要件
実装完了時に品質チェックは必須：

**Phase 1-3: 基本チェック**
- `check` - Biome（lint + format）
- `build` - TypeScriptビルド

**Phase 4-5: テストと最終確認**
- `test` - テスト実行
- `test:coverage:fresh` - カバレッジ測定
- `check:all` - 全体統合チェック

### カバレッジ要件
- **必須**: 単体テストのカバレッジは60%以上
- **コンポーネント別目標**:
  - Atoms: 70%以上
  - Molecules: 65%以上
  - Organisms: 60%以上
  - Custom Hooks: 65%以上
  - Utils: 70%以上

### 非機能要件
- **ブラウザ互換性**: Chrome/Firefox/Safari/Edge（最新2バージョン）
- **レンダリング時間**: 主要ページで5秒以内
