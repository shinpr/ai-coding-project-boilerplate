# Vertical Slice Architecture - Implementation Rules

This document defines specific rules to follow when adopting Vertical Slice Architecture.

## Core Implementation Rules

### 1. File Organization Principles

#### ✅ Mandatory Rules
- **One Feature One File**: Each feature is implemented in an independent file
- **Self-Containment**: Minimize dependencies on external files
- **Clear Naming**: File names clearly express functionality (e.g., `create-todo.ts`, `send-email.ts`)

#### ❌ Prohibited Practices
- Don't mix multiple features in one file
- Don't create unnecessary abstraction layers
- Don't design prematurely for future extensibility

### 2. Directory Structure

```
src/
├── features/               # Feature-based code
│   └── [feature-name]/    # Feature group
│       ├── [action].ts    # Each action
│       └── shared/        # Common code within feature
└── lib/                   # Pure function library
```

### 3. File Internal Structure

Each feature file should be organized in the following order:

```typescript
// 1. Imports
import { z } from 'zod'
import { database } from '../../lib/database'

// 2. Type definitions & schemas
const InputSchema = z.object({...})
type Output = {...}

// 3. Internal helper functions
function validateBusinessRule(...) {...}

// 4. Main processing function (exported)
export async function mainFunction(input: unknown): Promise<Output> {
  // Implementation
}

// 5. HTTP handlers etc. (when needed)
export async function httpHandler(req: Request): Promise<Response> {
  // Implementation
}
```

## Implementation Guidelines

### When Adding New Features

1. **Determine Feature Granularity**
   - 1 business action = 1 file
   - Example: "Create Todo" = `create-todo.ts`

2. **Create Directory**
   ```bash
   mkdir -p src/features/[feature-name]
   ```

3. **Create File**
   - Use clear action names for file names
   - Use kebab-case

### Error Handling

```typescript
// Complete error handling within file
export async function createTodo(input: unknown): Promise<Todo> {
  try {
    // Validation
    const validated = Schema.parse(input)
    
    // Business logic
    // ...
    
    return result
  } catch (error) {
    // Handle by throwing a specific error or returning an error result
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid input', error.errors)
    }
    throw error
  }
}
```

### Test Placement

```
features/
└── todo/
    ├── create-todo.ts
    ├── create-todo.test.ts    # Place in same directory
    └── shared/
```

## Consolidation Decision Criteria

### What Should Be Consolidated (place in lib/)
- **Pure Functions**: Generic functions without side effects
- **Generic Utilities**: Date formatting, string processing, etc.
- **Constants**: Configuration values used application-wide

### What Should Not Be Consolidated
- **Feature-Specific Logic**: Keep within that feature's directory
- **Code Used in Only 2-3 Places**: Allow duplication
- **Business Logic**: Implement directly in each feature file

### Progressive Consolidation

```typescript
// Step 1: First write working code (duplication OK)
// features/todo/create-todo.ts
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Step 2: Consider consolidation after 3+ duplications
// features/[feature]/shared/format.ts
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Step 3: Move to lib/ when used in 5+ places
// lib/date-utils.ts
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}
```

## Anti-Patterns

### ❌ Patterns to Avoid

1. **Excessive Abstraction**
   ```typescript
   // Bad example: Unnecessary interface
   interface TodoService {
     create(dto: CreateTodoDto): Promise<Todo>
   }
   
   class TodoServiceImpl implements TodoService {
     constructor(private repository: TodoRepository) {}
   }
   ```

2. **Layer Division**
   ```typescript
   // Bad example: Divide into layers
   // controllers/todo.controller.ts
   // services/todo.service.ts
   // repositories/todo.repository.ts
   ```

3. **Premature Optimization**
   ```typescript
   // Bad example: Design anticipating future extensions
   abstract class BaseHandler<T, R> {
     abstract validate(input: T): void
     abstract execute(input: T): Promise<R>
   }
   ```

## Best Practices

### 1. Maintain Simplicity
- Initially write everything within files
- Consolidate only when needed
- Thoroughly follow YAGNI principle

### 2. Prioritize Readability
- Even 1000-line files are OK if logically organized
- Use comments to clearly separate sections
- Keep functions small

### 3. Test First
- Write tests before implementing features
- Manage tests with same file structure
- Minimize mocks

## Guidelines for LLM Work

### When Writing Code
1. First check the directory for relevant features
2. For new features, implement to be complete in one file
3. When existing code exists, follow that pattern

### During Refactoring
1. Minimize changes across files
2. Prioritize improvements within single files
3. Consider consolidation only after 3+ actual duplications

### When in Doubt
- **Choose simplicity**
- **Choose independence**
- **Choose completing in one file**

## Summary

This architecture is designed for LLMs to work most efficiently. While it may seem redundant to humans, it is the most understandable and modifiable structure for LLMs.

**Key phrase to remember: "When in doubt, don't divide - write in one file"**