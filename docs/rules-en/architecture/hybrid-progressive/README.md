# Hybrid Progressive Architecture (Progressive Evolution Architecture)

## Overview

Hybrid Progressive Architecture is an approach that progressively evolves from vertical slicing to layered architecture as the project grows. It leverages the benefits of both small project simplicity and large project structuring.

## Basic Policy

### Start with Vertical Slicing
- Initially implement with independent files for each feature
- Focus on early development speed
- Structure easily understood by LLMs

### Progressive Structuring as Growth Occurs
- Consolidate when code duplication becomes noticeable
- Consider layer division when team grows
- Introduce layered architecture partially as needed

## Evolution Stages

### Stage 1: Simple Vertical Slicing (~10 features)

```
src/
├── features/
│   ├── create-todo.ts      # Complete in single file
│   ├── update-todo.ts
│   ├── delete-todo.ts
│   ├── list-todos.ts
│   ├── create-user.ts
│   └── login-user.ts
└── lib/
    └── database.ts         # Minimal common functionality
```

**Characteristics**
- One feature per file
- Duplicate code is acceptable
- Fastest possible development

### Stage 2: Feature Grouping (10~30 features)

```
src/
├── features/
│   ├── todo/
│   │   ├── create.ts
│   │   ├── update.ts
│   │   ├── delete.ts
│   │   ├── list.ts
│   │   └── shared/         # Common code within Todo feature
│   │       ├── types.ts
│   │       └── validation.ts
│   └── user/
│       ├── create.ts
│       ├── login.ts
│       └── shared/
│           └── auth.ts
└── lib/                    # Project-wide common functionality
    ├── database.ts
    └── errors.ts
```

**Characteristics**
- Group related features by directory
- Begin consolidation within features
- Maintain independence between features

### Stage 3: Partial Layer Introduction (30~50 features)

```
src/
├── features/               # Maintain vertical slicing
│   ├── todo/
│   └── user/
├── shared/                 # Layer common functionality
│   ├── domain/            # Common domain models
│   │   ├── entities/
│   │   └── value-objects/
│   └── infrastructure/    # Common infrastructure
│       ├── database/
│       └── external-api/
└── lib/
```

**Characteristics**
- Features maintain vertical slicing
- Only common parts use layer structure
- Progressive migration possible

### Stage 4: Hybrid Structure (50+ features)

```
src/
├── features/              # New/independent features use vertical slicing
│   └── experimental/
├── modules/               # Mature features use layering
│   ├── todo/
│   │   ├── application/
│   │   ├── domain/
│   │   └── infrastructure/
│   └── user/
│       ├── application/
│       ├── domain/
│       └── infrastructure/
└── shared/               # Overall common
```

**Characteristics**
- Choose structure based on feature maturity
- New features implemented quickly with vertical slicing
- Stable features layered for quality improvement

## Migration Timing Criteria

### Stage 1 → Stage 2
- [ ] 10+ feature files exist
- [ ] Related feature groups are clear
- [ ] File names alone don't show feature relationships

### Stage 2 → Stage 3
- [ ] Same code duplicated across 3+ feature groups
- [ ] Domain models shared across multiple features
- [ ] External service integration needed in multiple places

### Stage 3 → Stage 4
- [ ] Team members are 5+
- [ ] Some features are sufficiently stable
- [ ] More rigorous quality management required

## Implementation Examples

### Stage 1 Implementation Example
```typescript
// features/create-todo.ts
import { db } from '../lib/database'

export async function createTodo(title: string, userId: string) {
  // All processing in one file
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

### Stage 2 Implementation Example
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

### Stage 3 Implementation Example
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

## Benefits

1. **Flexibility**: Choose optimal structure according to project scale
2. **Easy Migration**: Low risk due to progressive migration
3. **Learning Curve**: Adjust complexity according to team maturity
4. **Practicality**: Balance idealism and reality

## Drawbacks

1. **Lack of Consistency**: Different structures may coexist
2. **Decision Overhead**: Need to decide when to migrate
3. **Documentation**: Need to understand multiple structures

## Applicable Cases

- **Startups**: Start quickly and evolve with growth
- **High Uncertainty Projects**: Requirements not yet fixed
- **Projects Starting Small**: Future expansion possibilities
- **LLM Collaborative Development**: LLM initially, human team later

## Guidelines

### Decision Flow for New Feature Addition

```
1. Check current Stage
   ↓
2. Are there related existing features?
   Yes → Match existing structure
   No  → Implement with current Stage's recommended structure
   ↓
3. After implementation, check migration criteria
   If criteria met → Consider migration to next Stage
```

### Refactoring Priority

1. **Business Value**: Structure frequently used features first
2. **Change Frequency**: Organize frequently changed parts
3. **Complexity**: Progressively divide complex features
4. **Team**: Prioritize structuring parts touched by multiple people