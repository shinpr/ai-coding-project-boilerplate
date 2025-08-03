# Vertical Slice Architecture - Implementation Rules

This document defines implementation rules and checklists for LLMs when adopting Vertical Slice Architecture.

## Core Implementation Rules

### 1. File Organization Principles

#### ✅ Mandatory Rules
- **1 Feature 1 File**: Each feature is implemented in an independent file
- **Self-containment**: Minimize dependencies on external files
- **Clear Naming**: Filenames clearly express the feature (e.g., `create-todo.ts`, `send-email.ts`)

#### ❌ Prohibited
- Don't mix multiple features in one file
- Don't create unnecessary abstraction layers
- Don't pre-design for future extensibility

### 2. Directory Structure

```
src/
├── features/               # Feature-based code
│   └── [feature-name]/    # Feature group
│       ├── [action].ts    # Each action
│       └── shared/        # Common code within feature
└── lib/                   # Pure function libraries
```

### 3. File Internal Structure

Each feature file should be structured in the following order:

```typescript
// 1. Imports
import { z } from 'zod'
import { database } from '../../lib/database'

// 2. Type definitions/schemas
const InputSchema = z.object({...})
type Output = {...}

// 3. Internal helper functions
function validateBusinessRule(...) {...}

// 4. Main processing function (export)
export async function mainFunction(input: unknown): Promise<Output> {
  // Implementation
}

// 5. HTTP handlers etc. (if needed)
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
   - Use clear action-based filename
   - Use kebab-case

### Error Handling

```typescript
// Self-contained error handling within file
export async function createTodo(input: unknown): Promise<Todo> {
  try {
    // Validation
    const validated = Schema.parse(input)
    
    // Business logic
    // ...
    
    return result
  } catch (error) {
    // Handle appropriately within this file
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

### What to Consolidate (place in lib/)
- **Pure Functions**: Generic functions without side effects
- **Generic Utilities**: Date formatting, string processing, etc.
- **Constants**: Configuration values used across the application

### What Not to Consolidate
- **Logic Dependent on Specific Features**: Keep within feature directory
- **Code Used in Only 2-3 Places**: Allow duplication
- **Business Logic**: Implement directly in each feature file

### Progressive Consolidation

```typescript
// Step 1: First write working code (duplication OK)
// features/todo/create-todo.ts
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Step 2: Consider after 3+ duplications
// features/[feature]/shared/format.ts
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Step 3: Move to lib/ after 5+ usages
// lib/date-utils.ts
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}
```

## LLM Implementation Checklist

### Pre-implementation Checks
- [ ] Feature scope is limited to one business action
- [ ] Filename clearly expresses the feature
- [ ] Existing related feature patterns have been reviewed
- [ ] Test file placement has been determined

### Implementation Checkpoints
- [ ] All processing is contained within one file
- [ ] Dependencies on external files are minimal
- [ ] Error handling is self-contained within file
- [ ] Validation logic is embedded

### Post-implementation Checks
- [ ] Test coverage is 70% or higher
- [ ] Tests don't depend on other tests
- [ ] Feature works completely
- [ ] Code has an understandable structure

## Anti-patterns

### ❌ Patterns to Avoid

1. **Excessive Abstraction**
   ```typescript
   // Bad example: Unnecessary interfaces
   interface TodoService {
     create(dto: CreateTodoDto): Promise<Todo>
   }
   
   class TodoServiceImpl implements TodoService {
     constructor(private repository: TodoRepository) {}
   }
   ```

2. **Layer Separation**
   ```typescript
   // Bad example: Split into layers
   // controllers/todo.controller.ts
   // services/todo.service.ts
   // repositories/todo.repository.ts
   ```

3. **Premature Optimization**
   ```typescript
   // Bad example: Design anticipating future expansion
   abstract class BaseHandler<T, R> {
     abstract validate(input: T): void
     abstract execute(input: T): Promise<R>
   }
   ```

## Best Practices

### 1. Keep It Simple
- Write everything in the file first
- Consolidate only when needed
- Thoroughly apply YAGNI principle

### 2. Prioritize Readability
- Even a 1000-line file is OK if logically organized
- Use comments to clarify sections
- Keep functions small

### 3. Test First
- Write tests before implementing features
- Manage tests with same file structure
- Minimize mocks

## LLM Implementation Guidelines

### Flow for New Feature Implementation
1. **Check Feature Directory**: Confirm directory for relevant feature
2. **Pattern Check**: Follow existing patterns if code exists
3. **Self-contained Implementation**: Implement to complete in 1 file
4. **Test Creation**: Create test file in same directory

### Refactoring Priority
1. **In-file Improvements**: Prioritize improvements within one file
2. **Minimal Cross-file Changes**: Minimize changes across files
3. **Rule of Three**: Consider consolidation only after 3+ actual duplications

### Decision Criteria (Priority when in doubt)
1. **Choose Simplicity** - Simple solutions over complex design
2. **Choose Independence** - Self-containment over inter-file dependencies
3. **Choose 1 File Completion** - Integration over splitting

### Escalation Criteria
Confirm with user in the following cases:
- Clear exceeding of initially assumed scope
- Architecture-level changes
- Adding new dependencies
- Changes with significant performance impact

## Summary

This architecture is designed for LLMs to work most efficiently. While it may seem redundant to humans, it's the most understandable and modifiable structure for LLMs.

**One phrase to remember: "When in doubt, don't split, write in 1 file"**