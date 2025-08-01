# Vertical Slice Architecture (LLM最適化アーキテクチャ)

## 概要

Vertical Slice Architecture（垂直分割アーキテクチャ）は、機能単位でコードを組織化するアプローチです。特にLLMがコードを書く場合に最適化されており、各機能が独立したファイルに自己完結的に実装されます。

## 基本原則

### 1. 機能の独立性を最優先
- **1機能 = 1ファイル** を基本とする
- ファイル間の依存は最小限に抑える
- 各ファイルが自己完結的に動作すること

### 2. 垂直分割を採用
- レイヤードアーキテクチャ（水平分割）は採用しない
- 機能単位での垂直分割を行う
- マイクロサービス的な考え方で設計

### 3. ローカルな複雑性を許容
- 1ファイルが大きくなることを恐れない
- ファイル間の複雑な依存関係より、1ファイル内の複雑性の方が管理しやすい

## メリット

### LLMにとってのメリット
- **コンテキスト効率**: 1つの機能が1ファイルに集約され、必要な情報が全て揃っている
- **明確な境界**: どこに何を書くべきか迷わない
- **独立した修正**: 他のファイルへの影響を最小限に抑えられる

### 開発上のメリット
- **迅速な開発**: 新機能追加時に既存コードへの影響が少ない
- **テストの容易さ**: 各機能が独立しているためテストしやすい
- **理解の容易さ**: 1つのファイルを読めばその機能の全てが分かる

## デメリット

- **コードの重複**: 共通ロジックが複数ファイルに散在する可能性
- **スケーラビリティ**: 大規模プロジェクトでは管理が困難になる可能性
- **チーム開発**: 人間の開発者にとっては冗長に感じる場合がある

## 適用すべきケース

- **LLMが主な開発者**: AIによる開発が中心のプロジェクト
- **小〜中規模プロジェクト**: 機能数が50以下程度
- **プロトタイプ開発**: 素早い実装と変更が求められる場合
- **マイクロサービス**: 各機能が独立したサービスとして動作する場合

## 適用すべきでないケース

- **大規模チーム開発**: 多数の人間開発者が関わる場合
- **複雑なドメインロジック**: ビジネスルールが複雑で共有が必要な場合
- **パフォーマンス重視**: コードの重複によるオーバーヘッドが問題になる場合

## ディレクトリ構造例

```
src/
├── features/
│   ├── todo/
│   │   ├── create-todo.ts      # POST /todos
│   │   ├── update-todo.ts      # PUT /todos/:id
│   │   ├── delete-todo.ts      # DELETE /todos/:id
│   │   ├── get-todo.ts         # GET /todos/:id
│   │   ├── list-todos.ts       # GET /todos
│   │   └── shared/
│   │       ├── todo-types.ts   # Todo型定義（機能内共通）
│   │       └── todo-db.ts      # Todo専用のDB操作
│   └── user/
│       ├── create-user.ts
│       ├── login-user.ts
│       └── shared/
│           ├── user-types.ts
│           └── user-validation.ts
└── lib/                        # 純粋関数のライブラリ
    ├── database.ts             # 汎用的なDB接続
    ├── validation.ts           # 汎用的なバリデーション
    └── errors.ts               # 汎用的なエラー処理
```

## 実装例

```typescript
// features/todo/create-todo.ts の完全な実装例

import { z } from 'zod'
import { database } from '../../lib/database'
import { ApiError } from '../../lib/errors'
import { Todo } from './shared/todo-types'

// 1. 入力バリデーション
const CreateTodoSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  userId: z.string().uuid(),
})

// 2. ビジネスロジック
async function validateUserQuota(userId: string): Promise<void> {
  const count = await database.todo.count({ where: { userId } })
  if (count >= 100) {
    throw new ApiError('Todo limit exceeded', 400)
  }
}

// 3. メイン処理関数
export async function createTodo(input: unknown): Promise<Todo> {
  // バリデーション
  const validated = CreateTodoSchema.parse(input)
  
  // ビジネスルールチェック
  await validateUserQuota(validated.userId)
  
  // DB操作
  const todo = await database.todo.create({
    data: {
      title: validated.title,
      description: validated.description,
      userId: validated.userId,
      completed: false,
      createdAt: new Date(),
    },
  })
  
  return todo
}

// 4. HTTPハンドラー
export async function createTodoHandler(req: Request): Promise<Response> {
  try {
    const body = await req.json()
    const todo = await createTodo(body)
    
    return new Response(JSON.stringify(todo), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ 
        error: 'Validation failed',
        details: error.errors 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    if (error instanceof ApiError) {
      return new Response(JSON.stringify({ 
        error: error.message 
      }), {
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    throw error
  }
}
```

## 移行ガイド

既存のレイヤードアーキテクチャから移行する場合：

1. **機能単位で移行**: 1つの機能（例: Todo作成）から始める
2. **全レイヤーを統合**: Controller + Service + Repository を1ファイルに
3. **共通部分は後回し**: まず動作することを優先し、共通化は後で検討
4. **テストも一緒に移行**: 機能のテストも同じディレクトリに配置