# Hybrid Progressive Architecture

## Overview

Hybrid Progressive Architecture is an approach that progressively evolves from vertical slicing to layered architecture as the project grows. It leverages the benefits of both small project simplicity and large project structuring.

## Basic Policy

### Start with Vertical Slicing
- Initially implement with independent files for each feature
- Prioritize early implementation speed
- Structure that is easy for LLMs to understand

### Progressive Structuring According to Growth
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
- Fastest possible implementation

### Stage 2: Feature Grouping (10-30 features)

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
- Group related features in directories
- Begin consolidation within features
- Maintain independence between features

### Stage 3: Partial Layer Introduction (30-50 features)

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
- Layer structure only for common parts
- Gradual migration possible

### Stage 4: Hybrid Structure (50+ features)

```
src/
├── features/              # New/independent features use vertical slicing
│   └── experimental/
├── modules/               # Mature features are layered
│   ├── todo/
│   │   ├── application/
│   │   ├── domain/
│   │   └── infrastructure/
│   └── user/
│       ├── application/
│       ├── domain/
│       └── infrastructure/
└── shared/               # Project-wide common
```

**Characteristics**
- Choose structure according to feature maturity
- Implement new features quickly with vertical slicing
- Layer stable features for improved quality

## Migration Timing Criteria

### Stage 1 → Stage 2
- [ ] 10 or more feature files exist
- [ ] Groups of related features are clear
- [ ] Feature relationships are difficult to understand from filenames alone

### Stage 2 → Stage 3
- [ ] Same code is duplicated in 3 or more feature groups
- [ ] Domain models are shared across multiple features
- [ ] External service integration needed in multiple places

### Stage 3 → Stage 4
- [ ] Team members are 5 or more
- [ ] Some features are sufficiently stable
- [ ] Stricter quality management is required

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
2. **Easy Migration**: Low risk due to gradual migration
3. **Learning Curve**: Adjust complexity according to team maturity
4. **Practicality**: Balance between ideal and reality

## Drawbacks

1. **Lack of Consistency**: Different structures may coexist
2. **Decision Burden**: Need to decide when to migrate
3. **Documentation**: Need to understand multiple structures

## When to Apply

- **Startups**: Start quickly and evolve with growth
- **High Uncertainty Projects**: Requirements not yet fixed
- **Projects Starting Small**: Future expansion possibility
- **LLM Collaborative Implementation**: LLM initially, human team later

## LLM Implementation Guidelines

### Decision Flow for New Feature Implementation

```
1. Confirm current Stage
   ↓
2. Are there related existing features?
   Yes → Match existing structure
   No  → Implement with current Stage's recommended structure
   ↓
3. After implementation, check migration criteria
   If criteria met → Consider migration to next Stage
```

### Stage Determination Criteria
- **Stage 1**: Less than 10 features, duplicate code acceptable
- **Stage 2**: 10-30 features, clear feature groups
- **Stage 3**: 30-50 features, duplication in 3+ groups
- **Stage 4**: 50+ features, 5+ team members

### Quality Check Criteria
- **Coverage**: Unit test coverage must be 70% or higher
- **Independence**: Each test can run independently without depending on other tests
- **Reproducibility**: Tests return same results consistently, regardless of environment

### Refactoring Priority

1. **Business Value**: Structure frequently used features first
2. **Change Frequency**: Organize frequently changed parts
3. **Complexity**: Gradually divide complex features
4. **Team**: Prioritize structuring parts touched by multiple people

### Escalation Criteria
Confirm with user in the following cases:
- When considering Stage migration
- Clear exceeding of initially assumed scope
- Architecture-level changes
- Adding new dependencies