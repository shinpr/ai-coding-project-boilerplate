---
name: frontend-typescript-rules
description: React/TypeScriptの型安全性、コンポーネント設計、状態管理ルールを適用。Reactコンポーネント実装時に使用。
---

# TypeScript 開発ルール（フロントエンド）

実装向けの frontend 固有 React/TypeScript ルール: しきい値、境界での型安全性、コンポーネント/状態の設計、エラーハンドリング、プロジェクト規約。

## アンチパターンとしきい値
設計変更を促すシグナル:
- prop drilling が 3 階層以上 → Context または状態管理へ持ち上げる
- コンポーネントが 300 行超 → 分割する
- Props が 10 個超 → コンポーネントを分割（3〜7 個が適正範囲）
- optional Props が 50% 超 → デフォルト値または Context を導入する
- Props のネストが 2 階層超 → フラット化する
- 同一の `as` アサーションが 3 回以上出現 → 型設計を見直す

## 境界での型安全性
`any` を禁止する。型が得られない場合は `unknown` で受けて型ガードで絞り込む。`as` は最小化する（やむを得ない場合は理由をコメント）。

アプリ内部では React の Props/State は型保証されており `unknown` は不要。外部境界では必ず `unknown` で受け、使用前に型ガードで絞り込む: API レスポンス、`localStorage`/`sessionStorage`、URL パラメータ、パースした JSON。制御コンポーネントのフォーム入力は React 合成イベントを通じて型安全に保たれる。

```typescript
const raw: unknown = await (await fetch(url)).json()
if (!isUser(raw)) throw new ValidationError('invalid user')
const user = raw // User に絞り込み済み
```

## コンポーネントと状態の設計
- **Function component のみ。** class component は Error Boundary に限り許可（hook の代替が存在しないため）。
- **Props は名前付き型で明示**し分割代入する: `function UserCard({ user, onSelect }: UserCardProps)`。`React.FC` は使わず、props を関数に直接型付けして Props 契約を明示する。
- **Props 駆動:** 依存は Props で渡す。グローバル状態や Context へは必要なときだけアクセスする。
- **Custom hook** をロジック再利用と依存注入の単位とする（テスト容易性のため、協調オブジェクトは hook 経由で注入する）。
- **関数引数:** 位置引数は 0〜2 個。3 個以上は単一の options オブジェクトで受ける。
- **状態の形:** 状態は明示的に型付けする。複数フィールドかつ離散的な遷移を持つ状態は、複数の `useState` ではなく discriminated union の action 型を用いた `useReducer` にする。
- **Server/Client 境界**（RSC フレームワークのみ — 例: Next.js App Router）: データ取得とレンダリングは既定でサーバーコンポーネントに置き、インタラクティブ性は必要最小のスコープで `"use client"` 境界の内側に隔離する。ブラウザ専用 API（`window`、`localStorage`、イベントハンドラ）はクライアントコンポーネント内に留める。サーバーコンポーネントで呼ぶとレンダリングが壊れるためである。クライアントのみの SPA（例: Vite）では N/A であり、サーバーコンポーネントランタイムが無いプロジェクトではスキップする。

## エラーハンドリング
- すべてのエラーを表に出す: ログして処理するか伝播し、握り潰さない。
- **Fail fast:** 不正な状態では、無言のフォールバックを返さず throw する。
- 想定内の失敗は `Result` 型で値として表現する。`throw` は想定外/回復不能なケースに限る。
- 目的別のエラークラスは `code` を持つ基底 `AppError` を継承する（例: ValidationError, ApiError, NotFoundError）。
- **層の責務:** API 層は transport エラーをドメインエラーへ変換する。hook は `AppError` を上位へ伝播する。Error Boundary はレンダリング時のエラーを捕捉しフォールバック UI を表示する。
- **Effect の競合/クリーンアップ:** `useEffect` 内のデータ取得は、順序が入れ替わった応答とアンマウント後の状態更新に対してガードする。具体的には、`AbortController` か mounted フラグで stale な結果を中断・無視するか、キャンセルと重複排除を行うサーバー状態ライブラリ（React Query/SWR）を使う。`try-catch` だけではこれをカバーできない。
- 機微情報（password, token, apiKey, creditCard）をログに出さない。

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
- **環境変数:** クライアント側の環境変数はバンドラが公開するアクセサ経由で読む。公開プレフィックスを持つ変数だけがブラウザに届き、プレフィックスの無い変数はブラウザでは `undefined` になる。プロジェクトのバンドラに合わせる: Vite は `import.meta.env.VITE_*`、Next.js の公開変数は `process.env.NEXT_PUBLIC_*`、CRA は `process.env.REACT_APP_*`。秘密情報はすべてサーバーサイドに置く。フロントエンドのコードはクライアントに配信されるためである。
- **バンドルとパフォーマンス:** バンドルサイズは `build` スクリプトでプロジェクトの予算に対して監視する。`React.lazy` + `Suspense` でコード分割する。再レンダリングを最小化する状態構造にする。メモ化: React Compiler が有効なときはそれに任せる。手動の `React.memo`/`useMemo`/`useCallback` は、プロファイラまたは参照同一性で正当化される逃げ道としてのみ用いる（実測されたボトルネック、またはサードパーティ API や effect 依存に対する安定した参照同一性）。
- **命名:** コンポーネント/型は `PascalCase`、変数/関数は `camelCase`、hook は `use` 接頭辞、定数は `SCREAMING_SNAKE_CASE`。
- **インポート:** `src/` からの絶対パス。順序: React → 外部ライブラリ → 内部（絶対）→ 内部（相対）→ 型のみ → スタイル/アセット。
- **フォーマット:** Biome に従う（セミコロンやスタイルはプロジェクト設定に従う）。
