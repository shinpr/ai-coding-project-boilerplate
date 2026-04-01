---
name: typescript-testing
description: Applies Vitest test design and quality standards. Provides coverage requirements and mock usage guides. Use when writing unit tests.
---

# TypeScript Testing Rules

## Test Framework

- **Vitest**: This project uses Vitest
- Test imports: `import { describe, it, expect, beforeEach, vi } from 'vitest'`
- Mock creation: Use `vi.mock()`

## Basic Testing Policy

### Quality Requirements
- **Coverage**: Unit test coverage must be 70% or higher
- **Independence**: Each test can run independently without depending on other tests
- **Reproducibility**: Tests are environment-independent and always return the same results
- **Readability**: Test code maintains the same quality as production code

### Coverage Requirements
**Mandatory**: Unit test coverage must be 70% or higher
**Metrics**: Statements, Branches, Functions, Lines

### Test Types and Scope
1. **Unit Tests**
   - Verify behavior of individual functions or classes
   - Mock all external dependencies
   - Most numerous, implemented with fine granularity

2. **Integration Tests**
   - Verify coordination between multiple components
   - Use actual dependencies (DB, API, etc.)
   - Verify major functional flows

3. **Cross-functional Verification in E2E Tests**
   - Mandatory verification of impact on existing features when adding new features
   - Cover integration points with "High" and "Medium" impact levels from Design Doc's "Integration Point Map"
   - Verification pattern: Existing feature operation -> Enable new feature -> Verify continuity of existing features
   - Success criteria: No change in response content, processing time within 5 seconds
   - Designed for automatic execution in CI/CD pipelines

## Test Implementation Conventions

### Directory Structure
```
src/
└── application/
    └── services/
        ├── __tests__/
        │   ├── service.test.ts      # Unit tests
        │   └── service.int.test.ts  # Integration tests
        └── service.ts
```

### Naming Conventions
- Test files: `{target-file-name}.test.ts`
- Integration test files: `{target-file-name}.int.test.ts`
- Test suites: Names describing target features or situations
- Test cases: Names describing expected behavior

### Test Code Quality Rules

**Recommended: Keep all tests always active**
- Merit: Guarantees test suite completeness
- Practice: Fix problematic tests and activate them

**Avoid: test.skip() or commenting out**
- Reason: Creates test gaps and incomplete quality checks
- Solution: Completely delete unnecessary tests

## Test Quality Criteria

### Boundary and Error Case Coverage
Include boundary values and error cases alongside happy paths.
```typescript
it('returns 0 for empty array', () => expect(calc([])).toBe(0))
it('throws on negative price', () => expect(() => calc([{price: -1}])).toThrow())
```

### Literal Expected Values
Use literal values for assertions. Do not replicate implementation logic.
**Valid test**: Expected value != Mock return value (implementation transforms/processes data)
```typescript
expect(calcTax(100)).toBe(10)  // not: 100 * TAX_RATE
```

### Result-Based Verification
Verify results, not invocation order or count.
```typescript
expect(mock).toHaveBeenCalledWith('a')  // not: toHaveBeenNthCalledWith
```

### Meaningful Assertions
Each test must include at least one verification.
```typescript
it('creates user', async () => {
  const user = await createUser({name: 'test'})
  expect(user.id).toBeDefined()
})
```

### Appropriate Mock Scope
Mock only direct external I/O dependencies. Use real implementations for indirect dependencies.
```typescript
vi.mock('./database')  // external I/O only
```

### Property-based Testing (fast-check)
Use fast-check when verifying invariants or properties.
```typescript
import fc from 'fast-check'

it('reverses twice equals original', () => {
  fc.assert(fc.property(fc.array(fc.integer()), (arr) => {
    return JSON.stringify(arr.reverse().reverse()) === JSON.stringify(arr)
  }))
})
```

**Usage condition**: Use when Property annotations are assigned to ACs in Design Doc.

## Mock Type Safety Enforcement

### Minimal Type Definition Requirements
```typescript
// Only required parts
type TestRepo = Pick<Repository, 'find' | 'save'>
const mock: TestRepo = { find: vi.fn(), save: vi.fn() }

// Only when absolutely necessary, with clear justification
const sdkMock = {
  call: vi.fn()
} as unknown as ExternalSDK // Complex external SDK type structure
```

## Data Layer Testing

### Mock Limitations for Data Layer

Mocks validate call patterns but cannot verify data layer correctness. The following pass through undetected with mock-only testing:
- Schema mismatches (table names, column names, data types)
- Query correctness (joins, filters, aggregations, grouping)
- Database constraints (NOT NULL, UNIQUE, foreign keys)
- Migration drift (schema changes that make code out of sync)

### When Mocks Are Appropriate for Data Access

- Testing business logic that receives data from the data layer (mock the repository, test the service)
- Testing error handling paths (simulating connection failures, timeouts)
- Unit tests where data access is a dependency, not the subject under test

### When Mocks Are Insufficient for Data Access

- Testing repository or data access implementations themselves
- Verifying query correctness (joins, filters, aggregations, grouping)
- Testing data integrity constraints
- Testing migration compatibility

### Real Database Testing (Environment-Dependent)

Options for verifying data layer correctness against a real database engine:
- **Containerized databases** for CI environments
- **In-memory databases** for fast feedback (note: dialect differences may mask issues)
- **Dedicated test databases** with seed data

The appropriate approach depends on project environment and CI/CD capabilities.

### AI-Generated Code and Schema Awareness

- AI-generated data access code has heightened schema hallucination risk
- Generated queries may use correct syntax but reference nonexistent schema elements
- Mock-based tests pass regardless of schema accuracy
- Mitigation: Design Docs should include explicit schema references; code-verifier reverse coverage verifies data operations against documented schemas

## Basic Vitest Example

```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('./userService', () => ({
  getUserById: vi.fn(),
  updateUser: vi.fn()
}))

describe('ComponentName', () => {
  it('should follow AAA pattern', () => {
    const input = 'test'
    const result = someFunction(input)
    expect(result).toBe('expected')
  })
})
```
