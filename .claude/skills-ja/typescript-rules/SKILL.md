---
name: typescript-rules
description: 型安全性とエラーハンドリングルールを適用。any禁止、型ガード必須。TypeScript実装、型定義レビュー時に使用。
---

# TypeScript 開発ルール

## 前提条件の検出

プロジェクト規約を適用する前に、`tsconfig`、ランタイム・フレームワーク設定、lint・format設定、パスエイリアス、package scripts、代表的なモジュールを確認する。設定または確立済みのパターンに裏付けられたルールだけをプロジェクト固有として扱う。限られたパターンから導いた結論には推測であることを明記する。競合する規約によって公開契約、ランタイムの振る舞い、エラー境界が変わる場合は作業を止め、必要な情報源またはユーザー判断を具体的に示す。

## Backend実装における型安全性

**データフローでの型安全性**
入力層（`unknown`） → 型ガード → ビジネス層（型保証） → 出力層（シリアライズ）

**Backend固有の型シナリオ**:
- **API通信**: レスポンスは`unknown`で受け、型ガードで検証
- **フォーム入力**: 外部入力は`unknown`、バリデーション後に型確定
- **レガシー統合**: レガシーとの境界では`unknown`として受け取り、根拠のある型アサーションが必要な場合は、その境界を所有するアダプター内に限定する
- **テストコード**: 設定済みのテストハーネスでモックの入出力型を定義する。意図的に一部だけを持つfixtureには`Partial<T>`を使用し、Vitestが設定されている場合にのみ型付きの`vi.fn<[Args], Return>()`を使用する

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
  // 関数とinterface
  interface UserService { create(data: UserData): User }
  const userService: UserService = { create: (data) => {...} }
  ```

**関数設計**
- **引数は0-2個まで**: 3個以上はオブジェクト化
  ```typescript
  // オブジェクト引数
  function createUser({ name, email, role }: CreateUserParams) {}
  ```

**依存性注入**
- **外部依存は引数で注入**: テスト可能性とモジュール性確保
  ```typescript
  // 依存性を引数で受け取る
  function createService(repository: Repository) { return {...} }
  ```

**非同期処理**
- Promise処理: リポジトリで確立済みのスタイルに従う。処理順序とエラー伝播を明確にできる場合は`async/await`を使用する
- エラーハンドリング: 現在の層で失敗の変換、情報付加、復旧、記録ができる場合に`try-catch`を追加する。それ以外は、所有する境界までPromiseのrejectionを伝播させる
- 型定義: 戻り値の型は明示的に定義（例: `Promise<Result>`）

**フォーマット規則**
- セミコロンの扱いを含め、リポジトリで設定されたformatterに従う
- 型は`PascalCase`、変数・関数は`camelCase`
- 絶対importは`tsconfig`または設定済みのビルドツールで宣言されたaliasを通じて使用する。それ以外は相対importを使用する

**クリーンコード原則**
- 今回の変更範囲にある未使用コードを削除する
- デバッグ用`console.log()`は削除
- 実行可能なソースにはコメントアウトしたコードを残さない。削除した実装の履歴はバージョン管理で保持する
- コメントは「なぜ」を説明（「何」ではなく）

## エラーハンドリング

**エラー結果のルール**: すべての失敗に対して、型付きの想定内エラーを返す、明記された要件に従って復旧する、診断情報を付加して伝播する、のいずれか1つを選ぶ。同じ失敗を重複して記録しないよう、ログ出力を担う境界で記録する。

**Fail-Fast原則**: エラー時は速やかに失敗させ、不正な状態での処理継続を防ぐ
```typescript
// 無効: 呼び出し元が必要とする失敗をフォールバックで隠している
catch (error) {
  return defaultValue // エラーを隠蔽
}

// 情報を付加して明示的に伝播する
catch (error) {
  throw new Error('処理失敗', { cause: error })
}
```

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
現在の信頼境界で許可されたフィールドだけをログに含める。認証情報、トークン、シークレット、決済情報、個人データはログ出力前に除去する。

**非同期エラーハンドリング**
- ランタイムが`unhandledRejection`や`uncaughtException`を公開する場合は、アプリケーションのentry pointでランタイムレベルのhandlerを設定する。ライブラリではプロセスレベルの方針をhostに委ねる
- 非同期の失敗は、型付きの結果、復旧、診断情報のいずれかを付加できる層でcatchする
- その層での復旧を要件が明記している場合を除き、情報を付加した失敗は伝播させる

## パフォーマンス最適化

- ストリーミング処理: 計測した入力サイズが利用可能なメモリ予算を超える場合、または要件で逐次出力が必要な場合は、ストリーミングまたは上限付きbatchを使用し、判断の根拠となった計測値または制約を記録する
- リソースのライフタイム: timer、subscription、handle、保持している参照は、そのライフサイクルを所有する境界で解放する
