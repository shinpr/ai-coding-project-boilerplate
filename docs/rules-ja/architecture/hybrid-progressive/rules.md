# Hybrid Progressive Architecture - 実装ルール

このドキュメントは、Hybrid Progressive Architectureを採用した場合のLLM向け実装ルールとStage別チェックリストを定義します。

## 基本原則

### 1. 段階的進化の原則
- **現在のStageを明確に**: プロジェクトがどの段階にあるかを常に意識
- **混在を許容**: 異なる構造の共存を認める
- **構造変更の柔軟性**: プロジェクトの要件に応じて、大胆な構造変更も可能

### 2. 判断の一貫性
- **新機能**: 現在のStageの推奨パターンで実装
- **既存機能の修正**: 既存の構造を尊重
- **リファクタリング**: 明確な基準に基づいて実施

## Stage別実装ルール

### Stage 1: シンプル垂直分割

#### ディレクトリ構造
```
src/
├── features/
│   └── [action-name].ts    # 例: create-todo.ts
└── lib/
    └── [utility].ts        # 例: database.ts
```

#### 実装ルール
- **1ファイル完結**: 全ての処理を1つのファイルに記述
- **重複許容**: 同じコードが複数ファイルにあってもOK
- **最小限の共通化**: DBコネクション程度のみlib/へ

#### コード例
```typescript
// features/create-todo.ts
import { db } from '../lib/database'

// 型定義もこのファイル内に
interface Todo {
  id: string
  title: string
  completed: boolean
}

// バリデーションも内包
function validateTitle(title: string): void {
  if (!title || title.length > 100) {
    throw new Error('Invalid title')
  }
}

// メイン関数
export async function createTodo(title: string, userId: string): Promise<Todo> {
  validateTitle(title)
  
  const todo = await db.insert('todos', {
    title,
    userId,
    completed: false,
    createdAt: new Date(),
  })
  
  return todo
}
```

### Stage 2: 機能グループ化

#### ディレクトリ構造
```
src/
├── features/
│   └── [feature]/
│       ├── [action].ts     # 例: create.ts
│       └── shared/
│           ├── types.ts
│           └── utils.ts
└── lib/
```

#### 実装ルール
- **機能内共通化**: 同一機能内の重複は`shared/`へ
- **機能間独立**: 他の機能フォルダを参照しない
- **インターフェース定義**: 型定義は`shared/types.ts`に集約

#### コード例
```typescript
// features/todo/shared/types.ts
export interface Todo {
  id: string
  title: string
  completed: boolean
  userId: string
  createdAt: Date
}

export interface CreateTodoInput {
  title: string
  userId: string
}

// features/todo/shared/validation.ts
export function validateTodoTitle(title: string): void {
  if (!title || title.length > 100) {
    throw new Error('Invalid title')
  }
}

// features/todo/create.ts
import { db } from '../../lib/database'
import { validateTodoTitle } from './shared/validation'
import type { Todo, CreateTodoInput } from './shared/types'

export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  validateTodoTitle(input.title)
  
  return db.insert('todos', {
    ...input,
    completed: false,
    createdAt: new Date(),
  })
}
```

### Stage 3: 部分的レイヤー導入

#### ディレクトリ構造
```
src/
├── features/           # 機能別（垂直分割維持）
├── shared/
│   ├── domain/        # 共通ドメイン
│   │   ├── entities/
│   │   └── value-objects/
│   └── infrastructure/
│       └── repositories/
└── lib/
```

#### 実装ルール
- **共通ドメインモデル**: 複数機能で使うエンティティは`shared/domain`へ
- **リポジトリパターン**: DB操作は`shared/infrastructure`へ
- **機能特有ロジックは維持**: ビジネスロジックは各機能に残す

#### コード例
```typescript
// shared/domain/entities/Todo.ts
export class Todo {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly userId: string,
    public readonly completed: boolean,
    public readonly createdAt: Date,
  ) {}
  
  static create(params: {
    title: string
    userId: string
  }): Todo {
    return new Todo(
      generateId(),
      params.title,
      params.userId,
      false,
      new Date(),
    )
  }
}

// shared/infrastructure/repositories/TodoRepository.ts
import { Todo } from '../../domain/entities/Todo'
import { db } from '../../../lib/database'

export class TodoRepository {
  async save(todo: Todo): Promise<Todo> {
    await db.insert('todos', {
      id: todo.id,
      title: todo.title,
      userId: todo.userId,
      completed: todo.completed,
      createdAt: todo.createdAt,
    })
    return todo
  }
}

// features/todo/create.ts
import { Todo } from '../../shared/domain/entities/Todo'
import { TodoRepository } from '../../shared/infrastructure/repositories/TodoRepository'

const todoRepository = new TodoRepository()

export async function createTodo(title: string, userId: string): Promise<Todo> {
  // ビジネスルールは機能内に残す
  if (title.includes('forbidden')) {
    throw new Error('Forbidden word in title')
  }
  
  const todo = Todo.create({ title, userId })
  return todoRepository.save(todo)
}
```

### Stage 4: ハイブリッド構造

#### ディレクトリ構造
```
src/
├── features/          # 新機能・実験的機能
├── modules/           # 成熟した機能（レイヤード）
│   └── [module]/
│       ├── application/
│       ├── domain/
│       └── infrastructure/
└── shared/           # 全体共通
```

#### 実装ルール
- **新機能**: `features/`で垂直分割実装
- **安定機能**: `modules/`でレイヤード実装
- **移行基準**: 3ヶ月以上安定 or 5人以上が触る

## 移行ルール

### Stage間の移行手順

#### Stage 1 → Stage 2
1. 関連機能を特定（例: todo関連）
2. 機能ディレクトリを作成
3. ファイルを移動（例: `create-todo.ts` → `todo/create.ts`）
4. 共通コードを`shared/`に抽出
5. インポートパスを更新

#### Stage 2 → Stage 3
1. 共通エンティティを特定
2. `shared/domain/entities/`に移動
3. リポジトリパターンを導入
4. 各機能からエンティティを参照

#### Stage 3 → Stage 4
1. 安定した機能モジュールを特定
2. `modules/[module]/`ディレクトリを作成
3. レイヤー別にコードを再編成
4. テストも同時に移行

### 移行時の注意点

#### ✅ やるべきこと
- **一機能ずつ移行**: 全体を一度に変えない
- **テストを先に書く**: 移行前に動作を保証
- **コミット単位**: 1つの移行 = 1コミット

#### ❌ やってはいけないこと
- **中途半端な移行**: 一部だけ新構造にする
- **過度な抽象化**: 移行時に機能追加しない
- **構造の一貫性**: 移行時は新旧構造の混在を最小限に

## 判断フローチャート

```
新しいコードを書く時の判断:

1. 既存の関連機能があるか？
   ├─ Yes → その機能の構造に合わせる
   └─ No  → 2へ

2. 現在のプロジェクトStageは？
   ├─ Stage 1 → features/直下に単一ファイル
   ├─ Stage 2 → features/[機能名]/配下
   ├─ Stage 3 → 共通部分はshared/を使用
   └─ Stage 4 → 実験的ならfeatures/、安定ならmodules/

3. 実装後、移行基準を確認
   └─ 基準を満たす → 次Stageへの移行を計画
```

## コーディング規約

### 命名規則
- **Stage 1-2**: ケバブケース（`create-todo.ts`）
- **Stage 3-4**: キャメルケース（`createTodo.ts`）
- **移行時**: 新しい命名規則に統一

### インポート順序
```typescript
// 1. 外部ライブラリ
import { z } from 'zod'

// 2. shared/からのインポート
import { Todo } from '../../shared/domain/entities/Todo'

// 3. 同一機能内からのインポート
import { validateInput } from './shared/validation'

// 4. lib/からのインポート
import { logger } from '../../lib/logger'
```

## 品質管理

### 各Stageの品質基準

#### Stage 1
- [ ] 各ファイルが独立して動作する
- [ ] 基本的なエラーハンドリングがある
- [ ] 最低限のバリデーションがある

#### Stage 2
- [ ] 型定義が明確
- [ ] 機能内で一貫性がある
- [ ] 基本的なテストがある

#### Stage 3
- [ ] ドメインモデルが適切
- [ ] リポジトリパターンが正しく実装
- [ ] 統合テストがある

#### Stage 4
- [ ] 各レイヤーの責務が明確
- [ ] 依存性注入が活用されている
- [ ] カバレッジ70%以上

## LLM向け実装指針

### 実装時の基本フロー
1. **Stage特定**: 現在のStageを確認
2. **パターン確認**: 既存の構造に合わせる
3. **段階的実装**: 現在のStageのルールに従う
4. **品質チェック**: Stage別基準で確認

### 判断基準（迷った時の優先順位）
1. **既存パターンを尊重** - プロジェクトの一貫性を保つ
2. **現在のStageに合わせる** - 無理な先取りをしない
3. **段階的改善** - 一度に大きな変更をしない

### エスカレーション基準
以下の場合はユーザーに確認：
- Stageの移行を検討する時
- 5ファイル以上に影響するリファクタリング
- アーキテクチャレベルの変更
- 新しい依存関係の追加

## まとめ

Hybrid Progressive Architectureは、プロジェクトの成長に合わせて柔軟に進化できるアプローチです。LLMとしての重要なポイント：

1. **現在のStageを明確に認識** - 実装前に必ず確認
2. **一貫性のある判断** - 既存パターンを尊重
3. **段階的な移行** - 急激な変更を避ける
4. **品質チェックの継続** - 各Stageで基準を満たす

**覚えておくべき一言：「迷ったら現在のStageのルールに従う」**