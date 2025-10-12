# TypeScript Development Rules

## Basic Principles

✅ **Aggressive Refactoring** - Prevent technical debt and maintain health
❌ **Unused "Just in Case" Code** - Violates YAGNI principle (Kent Beck)

## Comment Writing Rules
- **Function Description Focus**: Describe what the code "does"
- **No Historical Information**: Do not record development history
- **Timeless**: Write only content that remains valid whenever read
- **Conciseness**: Keep explanations to necessary minimum

## Type Safety

**Absolute Rule**: any type is completely prohibited. It disables type checking and becomes a source of runtime errors.

**any Type Alternatives (Priority Order)**
1. **unknown Type + Type Guards**: Use for validating external input
2. **Generics**: When type flexibility is needed
3. **Union Types・Intersection Types**: Combinations of multiple types
4. **Type Assertions (Last Resort)**: Only when type is certain

**Type Guard Implementation Pattern**
```typescript
function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'id' in value && 'name' in value
}
```

**Modern Type Features**
- **satisfies Operator**: `const config = { port: 3000 } satisfies Config` - Preserves inference
- **const Assertion**: `const ROUTES = { HOME: '/' } as const satisfies Routes` - Immutable and type-safe
- **Branded Types**: `type UserId = string & { __brand: 'UserId' }` - Distinguish meaning
- **Template Literal Types**: `type Endpoint = \`\${HttpMethod} \${Route}\`` - Express string patterns with types

**Type Safety in Implementation**
- API Communication: Always receive responses as `unknown`, validate with type guards
- Form Input: External input as `unknown`, type determined after validation
- Legacy Integration: Stepwise assertion like `window as unknown as LegacyWindow`
- Test Code: Always define types for mocks, utilize `Partial<T>` and `vi.fn<[Args], Return>()`

**Type Safety in Data Flow**
Input Layer (`unknown`) → Type Guard → Business Layer (Type Guaranteed) → Output Layer (Serialization)

**Type Complexity Management**
- Field Count: Up to 20 (split by responsibility if exceeded, external API types are exceptions)
- Optional Ratio: Up to 30% (separate required/optional if exceeded)
- Nesting Depth: Up to 3 levels (flatten if exceeded)
- Type Assertions: Review design if used 3+ times
- **External API Types**: Relax constraints and define according to reality (convert appropriately internally)

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
  // ✅ Functions and interfaces
  interface UserService { create(data: UserData): User }
  const userService: UserService = { create: (data) => {...} }
  ```

**Function Design**
- **0-2 parameters maximum**: Use object for 3+ parameters
  ```typescript
  // ✅ Object parameter
  function createUser({ name, email, role }: CreateUserParams) {}
  ```

**Dependency Injection**
- **Inject external dependencies as parameters**: Ensure testability and modularity
  ```typescript
  // ✅ Receive dependency as parameter
  function createService(repository: Repository) { return {...} }
  ```

**Asynchronous Processing**
- Promise Handling: Always use `async/await`
- Error Handling: Always handle with `try-catch`
- Type Definition: Explicitly define return value types (e.g., `Promise<Result>`)

**Format Rules**
- Semicolon omission (follow Biome settings)
- Types in `PascalCase`, variables/functions in `camelCase`
- Imports use absolute paths (`src/`)

**Clean Code Principles**
- ✅ Delete unused code immediately
- ✅ Delete debug `console.log()`
- ❌ Commented-out code (manage history with version control)
- ✅ Comments explain "why" (not "what")

## Error Handling

**Absolute Rule**: Error suppression prohibited. All errors must have log output and appropriate handling.

**Fail-Fast Principle**: Fail quickly on errors to prevent continued processing in invalid states
```typescript
// ❌ Prohibited: Unconditional fallback
catch (error) {
  return defaultValue // Hides error
}

// ✅ Required: Explicit failure
catch (error) {
  logger.error('Processing failed', error)
  throw error // Handle appropriately at higher layer
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

**Layer-Specific Error Handling**
- API Layer: Convert to HTTP response, log output excluding sensitive information
- Service Layer: Detect business rule violations, propagate AppError as-is
- Repository Layer: Convert technical errors to domain errors

**Structured Logging and Sensitive Information Protection**
Never include sensitive information (password, token, apiKey, secret, creditCard) in logs

**Asynchronous Error Handling**
- Global handler setup mandatory: `unhandledRejection`, `uncaughtException`
- Use try-catch with all async/await
- Always log and re-throw errors

## Refactoring Techniques

**Basic Policy**
- Small Steps: Maintain always-working state through gradual improvements
- Safe Changes: Minimize the scope of changes at once
- Behavior Guarantee: Ensure existing behavior remains unchanged while proceeding

**Implementation Procedure**: Understand Current State → Gradual Changes → Behavior Verification → Final Validation

**Priority**: Duplicate Code Removal > Large Function Division > Complex Conditional Branch Simplification > Type Safety Improvement

## Performance Optimization

- Streaming Processing: Process large datasets with streams
- Memory Leak Prevention: Explicitly release unnecessary objects