# Vertical Slice Architecture - 実装ルール

このドキュメントは、Vertical Slice Architectureを採用した場合に従うべき具体的なルールを定義します。

## コア実装ルール

### 1. ファイル構成の原則

#### ✅ 必須ルール
- **1機能1ファイル**: 各機能は独立したファイルに実装する
- **自己完結性**: 外部ファイルへの依存は最小限に抑える
- **明確な命名**: ファイル名は機能を明確に表現する（例: `create-todo.ts`, `send-email.ts`）

#### ❌ 禁止事項
- 複数の機能を1つのファイルに混在させない
- 不必要な抽象化レイヤーを作らない
- 将来の拡張性のための事前設計をしない

### 2. ディレクトリ構造

```
src/
├── features/               # 機能別のコード
│   └── [feature-name]/    # 機能グループ
│       ├── [action].ts    # 各アクション
│       └── shared/        # 機能内共通コード
└── lib/                   # 純粋関数ライブラリ
```

### 3. ファイル内の構造

各機能ファイルは以下の順序で構成する：

```typescript
// 1. インポート
import { z } from 'zod'
import { database } from '../../lib/database'

// 2. 型定義・スキーマ
const InputSchema = z.object({...})
type Output = {...}

// 3. 内部ヘルパー関数
function validateBusinessRule(...) {...}

// 4. メイン処理関数（エクスポート）
export async function mainFunction(input: unknown): Promise<Output> {
  // 実装
}

// 5. HTTPハンドラー等（必要な場合）
export async function httpHandler(req: Request): Promise<Response> {
  // 実装
}
```

## 実装ガイドライン

### 新機能を追加する時

1. **機能の粒度を決定**
   - 1つのビジネスアクション = 1ファイル
   - 例: "Todoを作成する" = `create-todo.ts`

2. **ディレクトリを作成**
   ```bash
   mkdir -p src/features/[feature-name]
   ```

3. **ファイルを作成**
   - アクション名を明確にしたファイル名を使用
   - ケバブケース（kebab-case）を使用

### エラーハンドリング

```typescript
// ファイル内で完結したエラーハンドリング
export async function createTodo(input: unknown): Promise<Todo> {
  try {
    // バリデーション
    const validated = Schema.parse(input)
    
    // ビジネスロジック
    // ...
    
    return result
  } catch (error) {
    // このファイル内で適切にハンドリング
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid input', error.errors)
    }
    throw error
  }
}
```

### テストの配置

```
features/
└── todo/
    ├── create-todo.ts
    ├── create-todo.test.ts    # 同じディレクトリに配置
    └── shared/
```

## 共通化の判断基準

### 共通化すべきもの（lib/に配置）
- **純粋関数**: 副作用のない汎用的な関数
- **汎用ユーティリティ**: 日付フォーマット、文字列処理等
- **定数**: アプリケーション全体で使用する設定値

### 共通化すべきでないもの
- **特定機能に依存するロジック**: その機能のディレクトリ内に留める
- **2-3箇所でしか使わないコード**: 重複を許容
- **ビジネスロジック**: 各機能ファイルに直接実装

### 段階的な共通化

```typescript
// Step 1: まず動作するコードを書く（重複OK）
// features/todo/create-todo.ts
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Step 2: 3回以上重複したら検討
// features/[feature]/shared/format.ts
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Step 3: 5箇所以上で使用されたらlib/へ
// lib/date-utils.ts
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}
```

## アンチパターン

### ❌ 避けるべきパターン

1. **過度な抽象化**
   ```typescript
   // 悪い例: 不必要なインターフェース
   interface TodoService {
     create(dto: CreateTodoDto): Promise<Todo>
   }
   
   class TodoServiceImpl implements TodoService {
     constructor(private repository: TodoRepository) {}
   }
   ```

2. **レイヤー分割**
   ```typescript
   // 悪い例: レイヤーに分割
   // controllers/todo.controller.ts
   // services/todo.service.ts
   // repositories/todo.repository.ts
   ```

3. **早すぎる最適化**
   ```typescript
   // 悪い例: 将来の拡張を見越した設計
   abstract class BaseHandler<T, R> {
     abstract validate(input: T): void
     abstract execute(input: T): Promise<R>
   }
   ```

## ベストプラクティス

### 1. シンプルさを保つ
- 最初は全てをファイル内に書く
- 必要になってから共通化する
- YAGNIの原則を徹底する

### 2. 読みやすさを優先
- 1000行のファイルでも、論理的に整理されていればOK
- コメントで区切りを明確にする
- 関数は小さく保つ

### 3. テストファースト
- 機能を実装する前にテストを書く
- テストも同じファイル構造で管理
- モックは最小限に

## LLMとしての作業指針

### コードを書く時
1. まず該当する機能のディレクトリを確認
2. 新規の場合は、1ファイルで完結するよう実装
3. 既存コードがある場合は、そのパターンに従う

### リファクタリング時
1. ファイルを跨いだ変更は最小限に
2. 1つのファイル内での改善を優先
3. 共通化は実際に3回以上重複してから検討

### 判断に迷った時
- **シンプルさを選ぶ**
- **独立性を選ぶ**
- **1ファイルで完結することを選ぶ**

## まとめ

このアーキテクチャは、LLMが最も効率的に作業できるよう設計されています。人間にとっては冗長に見えるかもしれませんが、LLMにとっては最も理解しやすく、修正しやすい構造です。

**覚えておくべき一言：「迷ったら分割せず、1ファイルに書く」**