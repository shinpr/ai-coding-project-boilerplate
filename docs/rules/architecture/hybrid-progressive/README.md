# Hybrid Progressive Architecture (段階的進化型アーキテクチャ)

## 概要

Hybrid Progressive Architectureは、プロジェクトの成長に合わせて、垂直分割（Vertical Slice）から段階的にレイヤードアーキテクチャへと進化させるアプローチです。小規模プロジェクトのシンプルさと、大規模プロジェクトの構造化の両方の利点を活かせます。

## 基本方針

### スタート時は垂直分割
- 最初は機能ごとに独立したファイルで実装
- 早期の開発速度を重視
- LLMにとって理解しやすい構造

### 成長に応じて段階的に構造化
- コードの重複が目立ってきたら共通化
- チームが大きくなったらレイヤー分割を検討
- 必要に応じて部分的にレイヤードアーキテクチャを導入

## 進化の段階

### Stage 1: シンプル垂直分割（〜10機能）

```
src/
├── features/
│   ├── create-todo.ts      # 単一ファイルで完結
│   ├── update-todo.ts
│   ├── delete-todo.ts
│   ├── list-todos.ts
│   ├── create-user.ts
│   └── login-user.ts
└── lib/
    └── database.ts         # 最小限の共通機能
```

**特徴**
- 1機能1ファイル
- 重複コードは許容
- 最速で開発可能

### Stage 2: 機能グループ化（10〜30機能）

```
src/
├── features/
│   ├── todo/
│   │   ├── create.ts
│   │   ├── update.ts
│   │   ├── delete.ts
│   │   ├── list.ts
│   │   └── shared/         # Todo機能内の共通コード
│   │       ├── types.ts
│   │       └── validation.ts
│   └── user/
│       ├── create.ts
│       ├── login.ts
│       └── shared/
│           └── auth.ts
└── lib/                    # プロジェクト全体の共通機能
    ├── database.ts
    └── errors.ts
```

**特徴**
- 関連機能をディレクトリでグループ化
- 機能内での共通化を開始
- 機能間の独立性は維持

### Stage 3: 部分的レイヤー導入（30〜50機能）

```
src/
├── features/               # 垂直分割を維持
│   ├── todo/
│   └── user/
├── shared/                 # 共通機能をレイヤー化
│   ├── domain/            # 共通のドメインモデル
│   │   ├── entities/
│   │   └── value-objects/
│   └── infrastructure/    # 共通のインフラ
│       ├── database/
│       └── external-api/
└── lib/
```

**特徴**
- 機能は垂直分割を維持
- 共通部分のみレイヤー構造
- 段階的な移行が可能

### Stage 4: ハイブリッド構造（50機能〜）

```
src/
├── features/              # 新機能・独立機能は垂直分割
│   └── experimental/
├── modules/               # 成熟した機能はレイヤー化
│   ├── todo/
│   │   ├── application/
│   │   ├── domain/
│   │   └── infrastructure/
│   └── user/
│       ├── application/
│       ├── domain/
│       └── infrastructure/
└── shared/               # 全体共通
```

**特徴**
- 機能の成熟度に応じて構造を選択
- 新機能は垂直分割で素早く実装
- 安定した機能はレイヤー化して品質向上

## 移行タイミングの判断基準

### Stage 1 → Stage 2
- [ ] 10個以上の機能ファイルが存在
- [ ] 関連する機能のグループが明確
- [ ] ファイル名だけでは機能の関連性が分かりにくい

### Stage 2 → Stage 3
- [ ] 3つ以上の機能グループで同じコードが重複
- [ ] ドメインモデルが複数の機能で共有される
- [ ] 外部サービスとの連携が複数箇所で必要

### Stage 3 → Stage 4
- [ ] チームメンバーが5人以上
- [ ] 一部の機能が十分に安定している
- [ ] より厳密な品質管理が求められる

## 実装例

### Stage 1の実装例
```typescript
// features/create-todo.ts
import { db } from '../lib/database'

export async function createTodo(title: string, userId: string) {
  // 全ての処理を1ファイルに
  if (!title || title.length > 100) {
    throw new Error('Invalid title')
  }
  
  const todo = await db.insert('todos', {
    title,
    userId,
    completed: false,
    createdAt: new Date(),
  })
  
  return todo
}
```

### Stage 2の実装例
```typescript
// features/todo/create.ts
import { validateTodoInput } from './shared/validation'
import { TodoRepository } from './shared/repository'
import type { CreateTodoInput } from './shared/types'

export async function createTodo(input: CreateTodoInput) {
  const validated = validateTodoInput(input)
  const repository = new TodoRepository()
  return repository.create(validated)
}
```

### Stage 3の実装例
```typescript
// features/todo/create.ts
import { Todo } from '../../shared/domain/entities/Todo'
import { UserId } from '../../shared/domain/value-objects/UserId'
import { todoRepository } from '../../shared/infrastructure/repositories'

export async function createTodo(title: string, userId: string) {
  const todo = Todo.create({
    title,
    userId: new UserId(userId),
  })
  
  return todoRepository.save(todo)
}
```

## メリット

1. **柔軟性**: プロジェクトの規模に応じて最適な構造を選択
2. **移行の容易さ**: 段階的に移行できるため、リスクが低い
3. **学習曲線**: チームの成熟度に合わせて複雑さを調整
4. **実用性**: 理想と現実のバランスを取れる

## デメリット

1. **一貫性の欠如**: 異なる構造が混在する可能性
2. **判断の負荷**: いつ移行するかの判断が必要
3. **ドキュメント**: 複数の構造を理解する必要がある

## 適用すべきケース

- **スタートアップ**: 素早く始めて、成長に応じて進化
- **不確実性の高いプロジェクト**: 要件が固まっていない
- **小規模から始まるプロジェクト**: 将来の拡張可能性がある
- **LLMとの協働開発**: 初期はLLM、後期は人間チーム

## ガイドライン

### 新機能追加時の判断フロー

```
1. 現在のStageを確認
   ↓
2. 関連する既存機能があるか？
   Yes → 既存の構造に合わせる
   No  → 現在のStageの推奨構造で実装
   ↓
3. 実装後、移行基準を確認
   基準を満たす → 次のStageへの移行を検討
```

### リファクタリング時の優先順位

1. **ビジネス価値**: よく使われる機能から構造化
2. **変更頻度**: 頻繁に変更される部分を整理
3. **複雑性**: 複雑な機能から段階的に分割
4. **チーム**: 複数人が触る部分を優先的に構造化