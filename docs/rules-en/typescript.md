# TypeScript Development Rules

## Basic Principles

### Code Evolution and Maintainability

- ✅ **Aggressive Refactoring** - Prevent technical debt and maintain health
- ❌ **Unused "Just in Case" Code** - Violates YAGNI principle (Kent Beck)

## Comment Writing Rules
- **Function Description Focus**: Describe what the code "does"
- **No Historical Information**: Do not record development history
- **Timeless**: Write only content that remains valid whenever read
- **Conciseness**: Keep explanations to necessary minimum

## Type System Utilization

### Type Safety Principles

- ✅ **unknown Type and Type Guards** - Maintain type safety while responding flexibly
- ❌ **any Type Usage** - Causes runtime errors by disabling type checking
- ✅ **Type Inference Utilization** - Improve readability by omitting redundant type annotations

### Type Safety Assurance
```typescript
// Safe type narrowing with type guards
function isUser(value: unknown): value is User {
  return typeof value === "object" && value !== null && "id" in value
}

// State management with Discriminated Unions
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }
```

### any Type Usage Guidelines

❌ **any Type is Completely Prohibited** - Disables type checking and becomes a source of runtime errors

#### Alternative Methods (Priority Order)
1. **unknown Type + Type Guards** - Safe handling of values with unknown types
2. **Generics** - When type flexibility is needed
3. **Union Types・Intersection Types** - Combinations of multiple types
4. **Type Assertions (as)** - Only when type guarantee is certain

```typescript
// ❌ Prohibited: any type
const result = (window as any).legacyLibFunction()

// ✅ Recommended: unknown type and type assertion
const result = (window as unknown as { legacyLibFunction: () => string }).legacyLibFunction()
```

## Coding Conventions

### Asynchronous Processing
- **Promise Handling**: Always use `async/await`
- **Error Handling**: Always handle with `try-catch`
- **Type Definition**: Explicitly define return value types (e.g., `Promise<Result>`)

### Code Style

**Format Rules**
- Semicolon omission (follow Biome settings)
- Types in `PascalCase`, variables/functions in `camelCase`
- Imports use absolute paths (`src/`)

**Clean Code Principles**
- ✅ Delete unused code immediately
- ✅ Delete debug `console.log()`
- ❌ Commented-out code (manage history with version control)
- ✅ Comments explain "why" (not "what")

### Date/Time Processing

```typescript
// ✅ Recommended: Explicit timezone specification
const dateStr = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })

// ❌ Avoid: No timezone (environment dependent)
const dateStr = new Date().toLocaleString('ja-JP')

// ✅ Recommended: Store data in UTC
const timestamp = new Date().toISOString()
```

## Error Handling

### Basic Policy
- Use custom error classes
- Handle errors in the layer where they occur (domain layer errors in domain layer, infrastructure layer errors in infrastructure layer)
- Output logs in structured format (include context information in JSON format)

```typescript
// ✅ Recommended: Custom errors
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ✅ Recommended: Structured logging
logger.error('API Error:', {
  code: error.code,
  statusCode: error.statusCode,
  message: error.message,
})
```

## Refactoring Techniques

### Basic Policy
- **Test First**: Create tests to protect existing behavior first
- **Small Steps**: Maintain always-working state through gradual improvements
- **Safe Changes**: Minimize the scope of changes at once

### Implementation Procedure
1. **Understand Current State**: Understand behavior of change targets and check existing tests
2. **Create Protective Tests**: Add tests that protect current behavior of refactoring targets
3. **Gradual Changes**: Improve structure in small units
4. **Verification**: Run tests at each stage to verify no behavior changes
5. **Final Confirmation**: Run comprehensive tests to verify no unintended impacts

### Priority Refactoring
- **Duplicate Code Removal**: Consolidation based on DRY principle (Don't Repeat Yourself - Andy Hunt & Dave Thomas)
- **Large Function Division**: Function division based on Single Responsibility Principle (Robert C. Martin)
- **Complex Conditional Branch Simplification**: Utilize early returns and guard clauses
- **Type Safety Improvement**: Eliminate any types, utilize unknown types and type guards

## Type Complexity Check Rules (YAGNI Principle - Kent Beck Specification)

### Type Complexity Limitations

| Item | Recommended | Warning | Prohibited |
|------|-------------|---------|-----------|
| Field Count | 20 or less | Over 30 | Over 50 |
| Optional Field Ratio | 30% or less | Over 50% | - |
| Type Hierarchy Depth | Up to 3 levels | - | Over 5 levels |

*Exception: When extending external library types

### Type Design Best Practices

Divide types by responsibility and utilize inheritance and composition to manage complexity. When exceeding the above numerical standards (20 or fewer fields, 30% or less optional ratio, up to 3 levels), implement refactoring immediately.

## Performance Optimization

### Basic Principles
- **Streaming Processing** - Process large datasets with streams
- **Memory Leak Prevention** - Explicitly release unnecessary objects
- **Simplicity Priority** - Prioritize maintainability over excessive optimization

## Referenced Principles
- **YAGNI Principle**: Kent Beck "Extreme Programming Explained"
- **DRY Principle**: Andy Hunt & Dave Thomas "The Pragmatic Programmer"
- **Single Responsibility Principle**: Robert C. Martin "Clean Code"