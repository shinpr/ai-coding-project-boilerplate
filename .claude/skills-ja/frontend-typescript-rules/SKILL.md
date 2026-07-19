---
name: frontend-typescript-rules
description: React/TypeScriptの型安全性、コンポーネント設計、状態管理ルールを適用。Reactコンポーネント実装時に使用。
---

# TypeScript 開発ルール（フロントエンド）

実装向けの frontend 固有 React/TypeScript ルール: しきい値、境界での型安全性、コンポーネント/状態の設計、エラーハンドリング、プロジェクト規約。

## 前提条件の検出

プロジェクト規約を適用する前に、TypeScript、bundler/framework、lint・format、path alias、React Compiler、代表的なコンポーネントの設定を確認する。設定またはリポジトリで確立済みのパターンに裏付けられた規約を確認済みとして扱い、限られた例から導いた結論には推測であることを明記する。競合するパターンによって公開される振る舞い、互換性、コンポーネント境界が変わる場合は作業を止め、必要な情報源または判断を具体的に示す。

## アンチパターンとしきい値
設計変更を促すシグナル:
- prop drilling が 3 階層以上 → Context または状態管理へ持ち上げる
- コンポーネントが 300 行超 → 分割する
- Props が 10 個超 → コンポーネントを分割（3〜7 個が適正範囲）
- optional Props が 50% 超 → デフォルト値または Context を導入する
- Props のネストが 2 階層超 → フラット化する
- 同一の `as` アサーションが 3 回以上出現 → 型設計を見直す

## 境界での型安全性
信頼できない型または取得できない型は`unknown`で受け、型ガードで絞り込む。`as`は、runtime/frameworkの不変条件によって対象の型が保証される場合にのみ使用し、その不変条件を近くのコメントに記録する。既存の生成コードまたはサードパーティの型宣言に含まれる`any`は、ラップすべき境界入力であり、アプリケーションの契約へ`any`を広げる根拠にはならない。

アプリ内部では React の Props/State は型保証されており `unknown` は不要。外部境界では必ず `unknown` で受け、使用前に型ガードで絞り込む: API レスポンス、`localStorage`/`sessionStorage`、URL パラメータ、パースした JSON。制御コンポーネントのフォーム入力は React 合成イベントを通じて型安全に保たれる。

```typescript
const raw: unknown = await (await fetch(url)).json()
if (!isUser(raw)) throw new ValidationError('invalid user')
const user = raw // User に絞り込み済み
```

## コンポーネントと状態の設計
- **Function component のみ。** class component は Error Boundary に限り許可（hook の代替が存在しないため）。
- **Props は名前付き型で明示**し分割代入する: `function UserCard({ user, onSelect }: UserCardProps)`。propsを関数に直接型付けしてProps契約を明示する。
- **Props 駆動:** 1つの明確な親コンポーネントが所有する依存はPropsで渡す。互いに隣接しない複数の子孫が値を共有し、Propsの中継によって所有責務を持たない中間コンポーネントが増える場合は、Contextまたは確立済みのグローバルstateを使用する。
- **Custom hook** をロジック再利用と依存注入の単位とする（テスト容易性のため、協調オブジェクトは hook 経由で注入する）。
- **関数引数:** 位置引数は 0〜2 個。3 個以上は単一の options オブジェクトで受ける。
- **状態の形:** 状態は明示的に型付けする。複数フィールドかつ離散的な遷移を持つ状態は、複数の `useState` ではなく discriminated union の action 型を用いた `useReducer` にする。
- **Server/Client 境界**（RSC フレームワークのみ — 例: Next.js App Router）: データ取得とレンダリングは既定でサーバーコンポーネントに置き、インタラクティブ性は必要最小のスコープで `"use client"` 境界の内側に隔離する。ブラウザ専用 API（`window`、`localStorage`、イベントハンドラ）はクライアントコンポーネント内に留める。サーバーコンポーネントで呼ぶとレンダリングが壊れるためである。クライアントのみの SPA（例: Vite）では N/A であり、サーバーコンポーネントランタイムが無いプロジェクトではスキップする。

## エラーハンドリング
- すべてのエラーに1つの明示的な結果を与える: 型付きの想定内失敗へ変換する、所有するUI境界で処理する、診断情報を保持して伝播する、のいずれかとする。同じ失敗を重複して記録しないよう、可観測性を所有する層でログを出力する。
- **Fail fast:** 不正な状態では、無言のフォールバックを返さず throw する。
- 想定内の失敗は `Result` 型で値として表現する。`throw` は想定外/回復不能なケースに限る。
- 目的別のエラークラスは `code` を持つ基底 `AppError` を継承する（例: ValidationError, ApiError, NotFoundError）。
- **層の責務:** API 層は transport エラーをドメインエラーへ変換する。hook は `AppError` を上位へ伝播する。Error Boundary はレンダリング時のエラーを捕捉しフォールバック UI を表示する。
- **Effect の競合/クリーンアップ:** `useEffect` 内のデータ取得は、順序が入れ替わった応答とアンマウント後の状態更新に対してガードする。具体的には、`AbortController` か mounted フラグで stale な結果を中断・無視するか、キャンセルと重複排除を行うサーバー状態ライブラリ（React Query/SWR）を使う。`try-catch` だけではこれをカバーできない。
- 現在の信頼境界で許可された診断フィールドだけをログに含める。認証情報、トークン、決済情報、その他の機微情報はログ出力前に除去する。

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

class AppError extends Error {
  constructor(message: string, readonly code: string, readonly statusCode = 500) {
    super(message); this.name = this.constructor.name
  }
}
```

Error Boundary — class component が必要となる唯一の箇所:
```typescript
class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() { return this.state.hasError ? this.props.fallback : this.props.children }
}
```

## プロジェクト規約
- **環境変数:** クライアント側の環境変数は、設定済みbundlerが公開するaccessor経由で読む。確認したbundlerに合わせる: Viteは`import.meta.env.VITE_*`、Next.jsの公開変数は`process.env.NEXT_PUBLIC_*`、CRAは`process.env.REACT_APP_*`。フロントエンドのバンドルには公開設定だけを含め、シークレットはサーバー側の境界内に置く。
- **バンドルとパフォーマンス:** バンドルサイズは `build` スクリプトでプロジェクトの予算に対して監視する。`React.lazy` + `Suspense` でコード分割する。再レンダリングを最小化する状態構造にする。メモ化: React Compiler が有効なときはそれに任せる。手動の `React.memo`/`useMemo`/`useCallback` は、プロファイラまたは参照同一性で正当化される逃げ道としてのみ用いる（実測されたボトルネック、またはサードパーティ API や effect 依存に対する安定した参照同一性）。
- **命名:** コンポーネント/型は `PascalCase`、変数/関数は `camelCase`、hook は `use` 接頭辞、定数は `SCREAMING_SNAKE_CASE`。
- **インポート:** `tsconfig`、lint設定、代表的なファイルから確認したaliasとimport順序に従う。`src/`からの絶対pathは設定済みのaliasが対応している場合にのみ使用する。
- **フォーマット:** リポジトリで設定済みのformatterに従う。Biomeが存在する場合は、セミコロンとスタイルをそのプロジェクト設定に合わせる。
