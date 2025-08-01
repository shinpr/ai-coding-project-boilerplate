# Vertical Slice Architecture (LLM-Optimized Architecture)

## Overview

Vertical Slice Architecture is an approach that organizes code by feature units. It is particularly optimized for when LLMs write code, with each feature implemented self-contained in independent files.

## Basic Principles

### 1. Feature Independence as Top Priority
- **1 feature = 1 file** as the basic principle
- Minimize dependencies between files
- Each file operates self-contained

### 2. Adopt Vertical Slicing
- Do not adopt layered architecture (horizontal slicing)
- Perform vertical slicing by feature units
- Design with microservice-like thinking

### 3. Allow Local Complexity
- Don't fear large single files
- Complexity within one file is more manageable than complex dependencies between files

## Benefits

### Benefits for LLMs
- **Context Efficiency**: One feature is consolidated in one file with all necessary information available
- **Clear Boundaries**: No confusion about where to write what
- **Independent Modifications**: Minimize impact on other files

### Development Benefits
- **Rapid Development**: Little impact on existing code when adding new features
- **Easy Testing**: Easy to test because each feature is independent
- **Easy Understanding**: Reading one file reveals everything about that feature

## Drawbacks

- **Code Duplication**: Common logic may be scattered across multiple files
- **Scalability**: May become difficult to manage in large-scale projects
- **Team Development**: May feel redundant to human developers

## Applicable Cases

- **LLM as Primary Developer**: Projects where AI development is central
- **Small to Medium Projects**: Around 50 features or fewer
- **Prototype Development**: When rapid implementation and changes are required
- **Microservices**: When each feature operates as an independent service

## Cases Where Not Applicable

- **Large Team Development**: When many human developers are involved
- **Complex Domain Logic**: When business rules are complex and need sharing
- **Performance Focus**: When overhead from code duplication becomes problematic

## Directory Structure Example

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
│   │       ├── todo-types.ts   # Todo type definitions (common within feature)
│   │       └── todo-db.ts      # Todo-specific DB operations
│   └── user/
│       ├── create-user.ts
│       ├── login-user.ts
│       └── shared/
│           ├── user-types.ts
│           └── user-validation.ts
└── lib/                        # Pure function library
    ├── database.ts             # Generic DB connection
    ├── validation.ts           # Generic validation
    └── errors.ts               # Generic error handling
```

## Implementation Example

```typescript
// Complete implementation example of features/todo/create-todo.ts

import { z } from 'zod'
import { database } from '../../lib/database'
import { ApiError } from '../../lib/errors'
import { Todo } from './shared/todo-types'

// 1. Input validation
const CreateTodoSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  userId: z.string().uuid(),
})

// 2. Business logic
async function validateUserQuota(userId: string): Promise<void> {
  const count = await database.todo.count({ where: { userId } })
  if (count >= 100) {
    throw new ApiError('Todo limit exceeded', 400)
  }
}

// 3. Main processing function
export async function createTodo(input: unknown): Promise<Todo> {
  // Validation
  const validated = CreateTodoSchema.parse(input)
  
  // Business rule check
  await validateUserQuota(validated.userId)
  
  // DB operation
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

// 4. HTTP handler
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

## Migration Guide

When migrating from existing layered architecture:

1. **Migrate by Feature**: Start with one feature (e.g., Todo creation)
2. **Integrate All Layers**: Combine Controller + Service + Repository into one file
3. **Postpone Common Parts**: First prioritize making it work, consider consolidation later
4. **Migrate Tests Together**: Place feature tests in the same directory