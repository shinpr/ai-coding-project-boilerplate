---
name: typescript-testing
description: Applies Vitest test design and quality standards. Provides coverage requirements and mock usage guides. Use when writing unit tests.
---

# TypeScript Testing Rules

## Prerequisite Detection

Inspect `package.json`, the lockfile, test configuration, and existing test imports before selecting a framework or command. Apply Vitest-specific rules only when Vitest is configured; otherwise use the repository's configured TypeScript test harness while preserving the behavior, isolation, and evidence rules below. If no runnable harness is identifiable, report the inspected paths and missing command or configuration.

## Test Framework

- **Vitest**: Use when selected by repository configuration or existing tests
- Test imports: `import { describe, it, expect, beforeEach, vi } from 'vitest'`
- Mock creation: Use `vi.mock()`

## Basic Testing Policy

### Quality Requirements
- **Coverage**: treat coverage as a diagnostic signal for finding untested areas, not a target (a target gets gamed into trivial tests — Goodhart's Law). Concentrate tests on critical paths, business logic, and behavior whose regression would matter. Any numeric threshold is the project's CI config
- **Independence**: Each test can run independently without depending on other tests
- **Reproducibility**: Control time, randomness, environment values, and external I/O so identical inputs produce the same observable result
- **Readability**: Each test names one behavior, separates setup/action/assertion, and keeps fixtures limited to values used by that behavior

### Coverage
- Prioritize meaningful assertions over the coverage number; raise coverage where a gap leaves a real regression unguarded, not to hit a percentage
- **Metrics** (what coverage reports break down): Statements, Branches, Functions, Lines

### Test Types and Scope
1. **Unit Tests**
   - Verify behavior of individual functions or classes
   - Mock all external dependencies
   - Most numerous, implemented with fine granularity

2. **Integration Tests**
   - Verify coordination between multiple components
   - Use real in-process components that are part of the behavior under test
   - For an external I/O boundary, use the real dependency only when that boundary's implementation or contract is the test target; otherwise use a deterministic substitute and verify the boundary request/response contract
   - Verify flows that implement a primary acceptance criterion or cross an in-process component boundary

3. **Cross-functional Verification in E2E Tests**
   - Mandatory verification of impact on existing features when adding new features
   - Cover integration points classified as "High" and "Medium" in the Design Doc's "Integration Point Map"; when no Design Doc exists, classify High as failure of a primary user journey or public contract and Medium as degradation of a secondary observable behavior
   - Verification pattern: Existing feature operation -> Enable new feature -> Verify continuity of existing features
   - Success criteria: Preserve the response fields and observable behavior named by the source acceptance criteria; apply a processing-time threshold only when a requirement or project configuration defines its value and measurement method
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

Keep every committed test active. Repair a test that protects current behavior; remove a test only when its behavior is no longer required and the source requirement or implementation contract confirms the removal.

## Test Quality Criteria

### Boundary and Error Case Coverage
Include boundary values and error cases alongside happy paths.
```typescript
it('returns 0 for empty array', () => expect(calc([])).toBe(0))
it('throws on negative price', () => expect(() => calc([{price: -1}])).toThrow())
```

### Literal Expected Values
Use expected values that are independent of the implementation calculation. A literal is preferred when it expresses the contract directly; otherwise derive the expected value from a separate authoritative fixture or specification.
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

### Mock Scope Decision
Use real implementations for every in-process component whose coordination is under test. Substitute a direct external I/O dependency when the test targets higher-layer behavior; use the real engine or a production-equivalent test instance when the external adapter, query, migration, or service contract itself is the target.
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

// Type only the SDK surface consumed by the subject under test
const sdkMock = {
  call: vi.fn()
} satisfies Pick<ExternalSDK, 'call'>
```

## Data Layer Testing

### Mock Limitations for Data Layer

Mocks validate call patterns but cannot verify data layer correctness. The following pass through undetected with mock-only testing:
- Schema mismatches (table names, column names, data types)
- Query correctness (joins, filters, aggregations, grouping)
- Database constraints (NOT NULL, UNIQUE, foreign keys)
- Migration drift (schema changes that make code out of sync)

### Data-Access Tests That Use Mocks

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

Select the first option that matches repository evidence:
1. Use the CI-configured database harness when present.
2. Otherwise use the same database engine in a container when container execution is available.
3. Use an in-memory database only when the verified behavior is dialect-independent; record the dialect behavior left unproven.
4. Use a dedicated test database when the repository already provisions and isolates one.

When none is available and data-layer correctness is the target, stop and report the missing environment prerequisite. A mock-only result is not evidence of query, schema, constraint, or migration correctness.

### AI-Generated Code and Schema Awareness

- AI-generated data access code has heightened schema hallucination risk
- Generated queries may use correct syntax but reference nonexistent schema elements
- Mock-based tests pass regardless of schema accuracy
- Mitigation: Design Docs should include explicit schema references so that documented schemas can be cross-checked against data access code during review

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
