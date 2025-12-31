---
name: frontend/typescript-rules
description: Applies React/TypeScript type safety, component design, and state management rules. Use when implementing React components.
---

# TypeScript Development Rules (Frontend)

## Frontend-Specific Anti-patterns

In addition to universal anti-patterns in coding-standards skill, watch for these Frontend-specific issues:

- **Prop drilling through 3+ levels** - Should use Context API or state management
- **Massive components (300+ lines)** - Split into smaller components

## Type Safety in Frontend Implementation

**Type Safety in Data Flow**
- **Frontend -> Backend**: Props/State (Type Guaranteed) -> API Request (Serialization)
- **Backend -> Frontend**: API Response (`unknown`) -> Type Guard -> State (Type Guaranteed)

**Frontend-Specific Type Scenarios**:
- **React Props/State**: TypeScript manages types, unknown unnecessary
- **External API Responses**: Always receive as `unknown`, validate with type guards
- **localStorage/sessionStorage**: Treat as `unknown`, validate
- **URL Parameters**: Treat as `unknown`, validate
- **Form Input (Controlled Components)**: Type-safe with React synthetic events

**Type Complexity Management (Frontend)**
- **Props Design**:
  - Props count: 3-7 props ideal (consider component splitting if exceeds 10)
  - Optional Props: 50% or less (consider default values or Context if excessive)
  - Nesting: Up to 2 levels (flatten deeper structures)
- Type Assertions: Review design if used 3+ times
- **External API Types**: Relax constraints and define according to reality (convert appropriately internally)

## Coding Conventions

**Component Design Criteria**
- **Function Components (Mandatory)**: Official React recommendation, optimizable by modern tooling
- **Classes Prohibited**: Class components completely deprecated (Exception: Error Boundary)
- **Custom Hooks**: Standard pattern for logic reuse

**Function Design**
- **0-2 parameters maximum**: Use object for 3+ parameters
  ```typescript
  // Object parameter
  function createUser({ name, email, role }: CreateUserParams) {}
  ```

**Props Design (Props-driven Approach)**
- Props are the interface: Define all necessary information as props
- Avoid implicit dependencies: Do not depend on global state or context without necessity
- Type-safe: Always define Props type explicitly

**Environment Variables**
- **Use build tool's environment variable system**: `process.env` does not work in browsers
- **No secrets on client-side**: All frontend code is public, manage secrets in backend

**Dependency Injection**
- **Custom Hooks for dependency injection**: Ensure testability and modularity

**Asynchronous Processing**
- Promise Handling: Always use `async/await`
- Error Handling: Always handle with `try-catch` or Error Boundary
- Type Definition: Explicitly define return value types (e.g., `Promise<Result>`)

**Format Rules**
- Semicolon omission (follow Biome settings)
- Types in `PascalCase`, variables/functions in `camelCase`
- Imports use absolute paths (`src/`)

**Clean Code Principles**
- Delete unused code immediately
- Delete debug `console.log()`
- No commented-out code (manage history with version control)
- Comments explain "why" (not "what")

## Error Handling

**Absolute Rule**: Error suppression prohibited. All errors must have log output and appropriate handling.

**Fail-Fast Principle**: Fail quickly on errors to prevent continued processing in invalid states
```typescript
// Prohibited: Unconditional fallback
catch (error) {
  return defaultValue // Hides error
}

// Required: Explicit failure
catch (error) {
  logger.error('Processing failed', error)
  throw error // Handle with Error Boundary or higher layer
}
```

**Result Type Pattern**: Express errors with types for explicit handling
```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

// Example: Express error possibility with types
function parseUser(data: unknown): Result<User, ValidationError> {
  if (!isValid(data)) return { ok: false, error: new ValidationError() }
  return { ok: true, value: data as User }
}
```

**Custom Error Classes**
```typescript
export class AppError extends Error {
  constructor(message: string, public readonly code: string, public readonly statusCode = 500) {
    super(message)
    this.name = this.constructor.name
  }
}
// Purpose-specific: ValidationError(400), ApiError(502), NotFoundError(404)
```

**Layer-Specific Error Handling (React)**
- Error Boundary: Catch React component errors, display fallback UI
- Custom Hook: Detect business rule violations, propagate AppError as-is
- API Layer: Convert fetch errors to domain errors

**Structured Logging and Sensitive Information Protection**
Never include sensitive information (password, token, apiKey, secret, creditCard) in logs

**Asynchronous Error Handling in React**
- Error Boundary setup mandatory: Catch rendering errors
- Use try-catch with all async/await in event handlers
- Always log and re-throw errors or display error state

## Performance Optimization

- Component Memoization: Use React.memo for expensive components
- State Optimization: Minimize re-renders with proper state structure
- Lazy Loading: Use React.lazy and Suspense for code splitting
- Bundle Size: Monitor with the `build` script and keep under 500KB
