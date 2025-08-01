# Hybrid Progressive Architecture - Implementation Rules

This document defines specific implementation rules when adopting Hybrid Progressive Architecture.

## Basic Principles

### 1. Progressive Evolution Principle
- **Clearly Define Current Stage**: Always be aware of which stage the project is in
- **Allow Coexistence**: Accept coexistence of different structures
- **Structural Change Flexibility**: Allow bold structural changes according to project requirements

### 2. Decision Consistency
- **New Features**: Implement with current Stage's recommended pattern
- **Existing Feature Modifications**: Respect existing structure
- **Refactoring**: Execute based on clear criteria

## Stage-Specific Implementation Rules

### Stage 1: Simple Vertical Slicing

#### Directory Structure
```
src/
├── features/
│   └── [action-name].ts    # Example: create-todo.ts
└── lib/
    └── [utility].ts        # Example: database.ts
```

#### Implementation Rules
- **Single File Completion**: Write all processing in one file
- **Allow Duplication**: OK to have same code in multiple files
- **Minimal Consolidation**: Only DB connections etc. go to lib/

#### Code Example
```typescript
// features/create-todo.ts
import { db } from '../lib/database'

// Type definitions also within this file
interface Todo {
  id: string
  title: string
  completed: boolean
}

// Include validation too
function validateTitle(title: string): void {
  if (!title || title.length > 100) {
    throw new Error('Invalid title')
  }
}

// Main function
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

### Stage 2: Feature Grouping

#### Directory Structure
```
src/
├── features/
│   └── [feature]/
│       ├── [action].ts     # Example: create.ts
│       └── shared/
│           ├── types.ts
│           └── utils.ts
└── lib/
```

#### Implementation Rules
- **Intra-Feature Consolidation**: Move duplicates within same feature to `shared/`
- **Inter-Feature Independence**: Don't reference other feature folders
- **Interface Definition**: Consolidate type definitions in `shared/types.ts`

#### Code Example
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

### Stage 3: Partial Layer Introduction

#### Directory Structure
```
src/
├── features/           # Feature-based (maintain vertical slicing)
├── shared/
│   ├── domain/        # Common domain
│   │   ├── entities/
│   │   └── value-objects/
│   └── infrastructure/
│       └── repositories/
└── lib/
```

#### Implementation Rules
- **Common Domain Models**: Move entities used by multiple features to `shared/domain`
- **Repository Pattern**: Move DB operations to `shared/infrastructure`
- **Maintain Feature-Specific Logic**: Keep business logic in each feature

#### Code Example
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
  // Business rules remain in features
  if (title.includes('forbidden')) {
    throw new Error('Forbidden word in title')
  }
  
  const todo = Todo.create({ title, userId })
  return todoRepository.save(todo)
}
```

### Stage 4: Hybrid Structure

#### Directory Structure
```
src/
├── features/          # New/experimental features
├── modules/           # Mature features (layered)
│   └── [module]/
│       ├── application/
│       ├── domain/
│       └── infrastructure/
└── shared/           # Overall common
```

#### Implementation Rules
- **New Features**: Implement vertical slicing in `features/`
- **Stable Features**: Implement layering in `modules/`
- **Migration Criteria**: Stable for 3+ months or touched by 5+ people

## Migration Rules

### Migration Procedures Between Stages

#### Stage 1 → Stage 2
1. Identify related features (e.g., todo-related)
2. Create feature directory
3. Move files (e.g., `create-todo.ts` → `todo/create.ts`)
4. Extract common code to `shared/`
5. Update import paths

#### Stage 2 → Stage 3
1. Identify common entities
2. Move to `shared/domain/entities/`
3. Introduce repository pattern
4. Reference entities from each feature

#### Stage 3 → Stage 4
1. Identify stable feature modules
2. Create `modules/[module]/` directory
3. Reorganize code by layers
4. Migrate tests simultaneously

### Migration Considerations

#### ✅ Should Do
- **Migrate One Feature at a Time**: Don't change everything at once
- **Write Tests First**: Guarantee behavior before migration
- **Commit Units**: 1 migration = 1 commit

#### ❌ Should Not Do
- **Incomplete Migration**: Partially adopt new structure
- **Excessive Abstraction**: Don't add functionality during migration
- **Structural Consistency**: Minimize old/new structure coexistence during migration

## Decision Flowchart

```
Decision when writing new code:

1. Are there related existing features?
   ├─ Yes → Match that feature's structure
   └─ No  → Go to 2

2. What is current project Stage?
   ├─ Stage 1 → Single file directly under features/
   ├─ Stage 2 → Under features/[feature-name]/
   ├─ Stage 3 → Use shared/ for common parts
   └─ Stage 4 → Experimental in features/, stable in modules/

3. After implementation, check migration criteria
   └─ If criteria met → Plan migration to next Stage
```

## Coding Conventions

### Naming Rules
- **Stage 1-2**: Kebab-case (`create-todo.ts`)
- **Stage 3-4**: CamelCase (`createTodo.ts`)
- **During Migration**: Unify to new naming convention

### Import Order
```typescript
// 1. External libraries
import { z } from 'zod'

// 2. Imports from shared/
import { Todo } from '../../shared/domain/entities/Todo'

// 3. Imports from same feature
import { validateInput } from './shared/validation'

// 4. Imports from lib/
import { logger } from '../../lib/logger'
```

## Quality Management

### Quality Standards by Stage

#### Stage 1
- [ ] Each file operates independently
- [ ] Basic error handling exists
- [ ] Minimal validation exists

#### Stage 2
- [ ] Type definitions are clear
- [ ] Consistency within features
- [ ] Basic tests exist

#### Stage 3
- [ ] Domain models are appropriate
- [ ] Repository pattern correctly implemented
- [ ] Integration tests exist

#### Stage 4
- [ ] Each layer's responsibilities are clear
- [ ] Dependency injection is utilized
- [ ] Coverage 80%+

## Summary

Hybrid Progressive Architecture is an approach that can evolve flexibly as projects grow. The important points are:

1. **Clearly Recognize Current Stage**
2. **Consistent Decisions**
3. **Progressive Migration**
4. **Continuous Quality Improvement**

When working as an LLM, always check the current Stage and existing patterns, and implement following the patterns established for that Stage.