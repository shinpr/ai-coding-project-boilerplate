---
name: typescript-rules
description: Applies type safety and error handling rules. Enforces no-any policy and type guards. Use when implementing TypeScript or reviewing types.
---

# TypeScript Development Rules

## Prerequisite Detection

Inspect `tsconfig`, runtime/framework configuration, lint/format configuration, path aliases, package scripts, and representative modules before applying project conventions. Treat a rule as project-specific only when configuration or an established pattern supports it. Label limited-pattern conclusions as inferred. When competing conventions change a public contract, runtime behavior, or error boundary, stop and name the source or user decision required.

## Type Safety in Backend Implementation

**Type Safety in Data Flow**
Input Layer (`unknown`) -> Type Guard -> Business Layer (Type Guaranteed) -> Output Layer (Serialization)

**Backend-Specific Type Scenarios**:
- **API Communication**: Receive responses as `unknown` and validate them with type guards
- **Form Input**: External input as `unknown`, type determined after validation
- **Legacy Integration**: Receive the legacy boundary as `unknown`; isolate any evidence-backed assertion in the adapter that owns the boundary
- **Test Code**: Define mock input/output types with the configured test harness; use `Partial<T>` for intentionally partial fixtures and typed `vi.fn<[Args], Return>()` only when Vitest is configured

## Coding Conventions

**Class Usage Criteria**
- **Recommended: Implementation with Functions and Interfaces**
  - Rationale: Improves testability and flexibility of function composition
- **Classes Allowed**:
  - Framework requirements (NestJS Controller/Service, TypeORM Entity, etc.)
  - Custom error class definitions
  - When state and business logic are tightly coupled (e.g., ShoppingCart, Session, StateMachine)
- **Decision Criterion**: If "Does this data have behavior?" is Yes, consider using a class
  ```typescript
  // Functions and interfaces
  interface UserService { create(data: UserData): User }
  const userService: UserService = { create: (data) => {...} }
  ```

**Function Design**
- **0-2 parameters maximum**: Use object for 3+ parameters
  ```typescript
  // Object parameter
  function createUser({ name, email, role }: CreateUserParams) {}
  ```

**Dependency Injection**
- **Inject external dependencies as parameters**: Ensure testability and modularity
  ```typescript
  // Receive dependency as parameter
  function createService(repository: Repository) { return {...} }
  ```

**Asynchronous Processing**
- Promise Handling: Follow the established repository style; use `async/await` when it makes sequencing and error propagation explicit
- Error Handling: Add `try-catch` when the current layer can convert, enrich, recover, or record the failure. Otherwise allow the promise rejection to propagate to the owning boundary
- Type Definition: Explicitly define return value types (e.g., `Promise<Result>`)

**Format Rules**
- Follow the repository's configured formatter, including its semicolon policy
- Types in `PascalCase`, variables/functions in `camelCase`
- Use absolute imports only through aliases declared in `tsconfig` or the configured build tool; otherwise use relative imports

**Clean Code Principles**
- Remove unused code within the current change
- Delete debug `console.log()`
- Keep executable source free of commented-out code; version control retains removed implementations
- Comments explain "why" (not "what")

## Error Handling

**Error Outcome Rule**: Every failure has one owning outcome: return a typed expected error, recover according to a named requirement, or propagate it with diagnostic context. Log at the observability-owning boundary so one failure is not logged repeatedly.

**Fail-Fast Principle**: Fail quickly on errors to prevent continued processing in invalid states
```typescript
// Invalid: fallback hides a failure required by the caller
catch (error) {
  return defaultValue // Hides error
}

// Explicit propagation with added context
catch (error) {
  throw new Error('Processing failed', { cause: error })
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
// Purpose-specific: ValidationError(400), BusinessRuleError(400), DatabaseError(500), ExternalServiceError(502)
```

**Layer-Specific Error Handling (Backend)**
- API Layer: Convert to HTTP response, log output excluding sensitive information
- Service Layer: Detect business rule violations, propagate AppError as-is
- Repository Layer: Convert technical errors to domain errors

**Structured Logging and Sensitive Information Protection**
Log only fields approved for the current trust boundary. Redact credentials, tokens, secrets, payment data, and personal data before logging.

**Asynchronous Error Handling**
- Configure runtime-level `unhandledRejection`/`uncaughtException` handling at the application entry point when the runtime exposes those events; libraries leave process-level policy to their host
- Catch an asynchronous failure at the layer that can add a typed outcome, recovery, or diagnostic context
- Propagate failures after enrichment unless a named requirement owns recovery at that layer

## Performance Optimization

- Streaming Processing: Use streaming or bounded batches when measured input size can exceed the available-memory budget or when requirements demand incremental output; record the triggering measurement or constraint
- Resource Lifetime: Release timers, subscriptions, handles, and retained references at the lifecycle boundary that owns them
