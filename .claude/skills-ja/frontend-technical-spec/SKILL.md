---
name: frontend-technical-spec
description: リポジトリの根拠に基づき、Reactの環境、コンポーネントアーキテクチャ、状態・データフロー、ビルド検証、フロントエンドの非機能基準を定義。Reactフロントエンド、そのビルド、ランタイム境界の設定・設計時に使用。
---

# 技術設計ルール（フロントエンド）

## 前提条件の検出

ツールやフレームワークに固有のルールを適用する前に、`package.json`、ロックファイル、TypeScript・ビルド設定、CI定義、代表的なコンポーネントを確認する。React、Vite、Next.js、状態管理ライブラリ、フォームライブラリ、スクリプトは、リポジトリ内の根拠に明記されている場合にのみ利用可能として扱う。周辺のパターンから導いた結論には推測であることを明記する。不足している判断によってレンダリングアーキテクチャ、互換性、セキュリティ、検証方法が変わる場合は作業を止め、必要な根拠またはユーザー判断を具体的に示す。

## 技術スタックの基本方針
リポジトリ設定からTypeScriptベースのReactアプリケーションであることを確認できる場合に、このルールを適用する。現行要件と制約を、コンポーネントの責務、状態の所有者、サーバー/クライアント境界、観測可能な検証点へ対応づけてアーキテクチャを選択する。

## 環境変数管理とセキュリティ

### 環境変数管理
- **ビルドツールのクライアント公開機構を使用**: ブラウザコードが読めるのは設定済みのbundler/frameworkによって明示的に公開された値だけとし、サーバー専用の環境アクセスはクライアントバンドルの外側に置く
- 設定レイヤーを通じて環境変数を一元管理
- 公開値は、アプリケーションで使用する前に1つの型付き設定境界でパースする
- 要件で未設定時の有効な振る舞いが定義されている場合にのみデフォルト値を設ける。それ以外は、変数名と期待する形式を示して起動時またはビルド時の検証を失敗させる

```typescript
// ビルドツールの環境変数（公開値のみ。クライアント公開変数は VITE_ 接頭辞が必要）
const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  appName: import.meta.env.VITE_APP_NAME || 'My App'
}

// フロントエンドでは動作しない
const apiUrl = process.env.API_URL // NG
```

### セキュリティ（クライアントサイド制約）
- **重要**: すべてのフロントエンドコードは公開され、ブラウザで見える
- **シークレットはサーバー側に置く**: クライアントへ公開する設定には公開値だけを含め、APIキー、トークン、認証情報はバックエンドまたは信頼できるサービスが所有する
- ローカルの`.env`ファイルはバージョン管理の対象外とし、必要な変数名はシークレットを含まないサンプルファイルで示す
- 現在の信頼境界で許可されたフィールドだけをログおよびレスポンスに含める。パスワード、トークン、個人データは除去する

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
- **Function Components**: 必須。class components は Error Boundary に限り許可（hook の代替が存在しないため）
- **Custom Hooks**: ロジック再利用と依存性注入のため
- **コンポーネント階層**: Atoms → Molecules → Organisms → Templates → Pages
- **Props-driven**: コンポーネントは必要なすべてのデータをPropsで受け取る
- **Co-location**: テスト、スタイル、関連ファイルをコンポーネントと同じ場所に配置

以下のルールでコンポーネントと状態管理のパターンを選択する：
- すべての読み書きを1つのコンポーネントサブツリーが所有する場合はローカルstateを使用
- 複数の子孫が同じ低頻度更新のstateを必要とし、provider境界が明確な場合はContextを使用
- 設定済みの依存が存在し、キャッシュ、重複排除、バックグラウンド更新、リクエストのライフサイクル状態が必要な場合にのみserver-state libraryを使用
- 現行要件をローカルstate、reducer state、既存Context、またはリポジトリで確立済みの状態管理機構で満たせない場合にのみ、追加の状態管理依存を導入

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

  // 無効な可変State更新
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
`packageManager`フィールド、ロックファイル、CIコマンドの順にパッケージマネージャーを判定する。選択したマニフェストに存在するスクリプトだけを実行する。

### ビルドコマンド
- package.jsonから以下に該当するスクリプトを自動検出して実行:
  - 開発サーバー
  - 本番ビルド
  - 型チェック（出力なし）

### テストコマンド
- `test` - テスト実行
- `test:safe` - 安全なテスト実行（自動クリーンアップ付き）
- `cleanup:processes` - Vitestプロセスのクリーンアップ

### 品質チェック要件
実装完了時に品質チェックは必須：

**Phase 1-3: 基本チェック**
- `check` - Biome（lint + format）
- `build` - TypeScriptビルド

**フェーズ移行の証跡**: 設定済みのlint、format、型、ビルドのチェックがすべて正常終了していること。必須スクリプトが存在しない場合は、リポジトリ内の同等コマンドを特定するまで次のPhaseへ進まない。

**Phase 4-5: テストと最終確認**
- `test` - テスト実行
- `check:all` - 全体統合チェック

**完了証跡**: 設定済みのテストと本番ビルドが成功し、テストに伴う修正後も統合チェックが成功していること。環境依存のテストを実行できない場合は、ブロック要因となる前提条件を具体的に記録する。

### テストの重点
- 共有コンポーネント、カスタムフック、utilsなど基盤的で再利用度の高いユニットは、観測可能な契約を直接テストする。organismsやページなど合成度の高い面は、対象の故障を最もよく露呈する場合に統合テストまたはE2Eテストで検証する。

### 非機能要件
- **ブラウザ互換性**: リポジトリのBrowserslist・ビルドターゲット、または明記された製品要件に従う。情報源を記録し、影響を受けるブラウザ固有の振る舞いをテストする
- **レンダリング性能**: プロジェクト要件、CI、性能設定で定義されたブラウザ一覧と性能しきい値を使用する。定義がない場合は合格基準を作らず、計測条件と結果を診断用の証跡として報告する
