# Hybrid Progressive Architecture - Implementation Rules

This document defines implementation rules and stage-specific checklists for LLMs when adopting Hybrid Progressive Architecture.

## Basic Principles

### 1. Principle of Progressive Evolution
- **Be clear about current Stage**: Always be aware of which stage the project is in
- **Allow coexistence**: Accept coexistence of different structures
- **Flexibility in structural changes**: Bold structural changes are possible according to project requirements

### 2. Consistency in Decision Making
- **New features**: Implement with current Stage's recommended pattern
- **Modifying existing features**: Respect existing structure
- **Refactoring**: Implement based on clear criteria

## Stage-Specific Implementation Rules

### Stage 1: Simple Vertical Slicing

#### Directory Structure
```
src/
├── features/
│   └── [action-name].ts    # e.g., create-todo.ts
└── lib/
    └── [utility].ts        # e.g., database.ts
```

#### Implementation Rules
- **Single file completion**: Write all processing in one file
- **Duplication allowed**: OK to have same code in multiple files
- **Minimal consolidation**: Only DB connection level goes to lib/

#### Code Example
```typescript
// features/create-todo.ts
import { db } from '../lib/database'

// Type definitions also in this file
interface Todo {
  id: string
  title: string
  completed: boolean
}

// Validation included
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
│       ├── [action].ts     # e.g., create.ts
│       └── shared/
│           ├── types.ts
│           └── utils.ts
└── lib/
```

#### Implementation Rules
- **Consolidation within feature**: Duplication within same feature goes to `shared/`
- **Feature independence**: Don't reference other feature folders
- **Interface definition**: Consolidate type definitions in `shared/types.ts`

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
├── features/           # By feature (maintain vertical slicing)
├── shared/
│   ├── domain/        # Common domain
│   │   ├── entities/
│   │   └── value-objects/
│   └── infrastructure/
│       └── repositories/
└── lib/
```

#### Implementation Rules
- **Common domain models**: Entities used by multiple features go to `shared/domain`
- **Repository pattern**: DB operations go to `shared/infrastructure`
- **Maintain feature-specific logic**: Business logic stays in each feature

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
  // Business rules remain within feature
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
└── shared/           # Project-wide common
```

#### Implementation Rules
- **New features**: Vertical slicing implementation in `features/`
- **Stable features**: Layered implementation in `modules/`
- **Migration criteria**: Stable for 3+ months or touched by 5+ people

## Migration Rules

### Migration Steps Between Stages

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

#### ✅ What to Do
- **Migrate one feature at a time**: Don't change everything at once
- **Write tests first**: Ensure behavior before migration
- **Commit units**: 1 migration = 1 commit

#### ❌ What Not to Do
- **Partial migration**: Making only part of the new structure
- **Excessive abstraction**: Don't add features during migration
- **Structural consistency**: Minimize mixing old and new structures during migration

## Decision Flowchart

```
Decision when writing new code:

1. Are there existing related features?
   ├─ Yes → Match that feature's structure
   └─ No  → Go to 2

2. What is the current project Stage?
   ├─ Stage 1 → Single file directly under features/
   ├─ Stage 2 → Under features/[feature-name]/
   ├─ Stage 3 → Use shared/ for common parts
   └─ Stage 4 → features/ if experimental, modules/ if stable

3. After implementation, check migration criteria
   └─ Criteria met → Plan migration to next Stage
```

## Coding Standards

### Naming Conventions
- **Stage 1-2**: Kebab case (`create-todo.ts`)
- **Stage 3-4**: Camel case (`createTodo.ts`)
- **During migration**: Unify to new naming convention

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

### Quality Criteria for Each Stage

#### Stage 1
- [ ] Each file works independently
- [ ] Basic error handling exists
- [ ] Minimal validation exists

#### Stage 2
- [ ] Clear type definitions
- [ ] Consistency within feature
- [ ] Basic tests exist

#### Stage 3
- [ ] Appropriate domain models
- [ ] Repository pattern correctly implemented
- [ ] Integration tests exist

#### Stage 4
- [ ] Clear responsibilities for each layer
- [ ] Dependency injection utilized
- [ ] Coverage 70% or higher

## LLM Implementation Guidelines

### Basic Flow for Implementation
1. **Stage identification**: Confirm current Stage
2. **Pattern confirmation**: Match existing structure
3. **Progressive implementation**: Follow current Stage's rules
4. **Quality check**: Confirm by Stage-specific criteria

### Decision Criteria (Priority when in doubt)
1. **Respect existing patterns** - Maintain project consistency
2. **Match current Stage** - Don't prematurely advance
3. **Progressive improvement** - Don't make large changes at once

### Escalation Criteria
Confirm with user in the following cases:
- When considering Stage migration
- Clear exceeding of initially assumed scope
- Architecture-level changes
- Adding new dependencies

## Summary

Hybrid Progressive Architecture is an approach that can flexibly evolve with project growth. Important points for LLMs:

1. **Clearly recognize current Stage** - Always confirm before implementation
2. **Consistent decision making** - Respect existing patterns
3. **Progressive migration** - Avoid drastic changes
4. **Continue quality checks** - Meet criteria at each Stage

**One phrase to remember: "When in doubt, follow the current Stage's rules"**