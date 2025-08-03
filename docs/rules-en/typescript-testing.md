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

## Test Design Principles

### Red-Green-Refactor Process (TDD)

**Principle**: Start all new features and bug fixes with tests

1. **Red**: Write failing tests
2. **Green**: Pass tests with minimal implementation
3. **Refactor**: Improve code while tests pass

**Exceptions**: Configuration changes, documentation updates, refactoring covered by existing tests, emergency response (tests required after)

### Test Case Structure
- Tests consist of three stages: "Arrange," "Act," "Assert"
- Clear naming that shows purpose of each test
- One test case verifies only one behavior

### Test Data Management
- Manage test data in dedicated directories
- Define test-specific environment variable values
- Always mock sensitive information
- Keep test data minimal, using only data directly related to test case verification purposes

### Mock and Stub Usage Policy

✅ **Recommended: Mock external dependencies in unit tests**
- Merit: Ensures test independence and reproducibility
- Practice: Mock DB, API, file system, and other external dependencies

❌ **Avoid: Actual external connections in unit tests**
- Reason: Slows test speed and causes environment-dependent problems

### Test Failure Response Decision Criteria

**Fix tests**: Wrong expected values, references to non-existent features, dependence on implementation details, implementation only for tests
**Fix implementation**: Valid specifications, business logic, important edge cases
**When in doubt**: Confirm with user

## Test Helper Utilization Rules

### Basic Principles
Test helpers are utilized to reduce duplication in test code and improve maintainability.

### Decision Criteria
| Mock Characteristics | Response Policy |
|---------------------|-----------------|
| **Simple and stable** | Consolidate in common helpers |
| **Complex or frequently changing** | Individual implementation |
| **Duplicated in 3+ places** | Consider consolidation |
| **Test-specific logic** | Individual implementation |

### Test Helper Usage Examples
```typescript
// ✅ Recommended: Utilize builder pattern
const testData = new TestDataBuilder()
  .withDefaults()
  .withName('Test User')
  .build()

// ✅ Recommended: Custom assertions
function assertValidUser(user: unknown): asserts user is User {
  // Validation logic
}

// ❌ Avoid: Individual implementation of duplicate complex mocks
```

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

✅ **Recommended: Keep all tests always active**
- Merit: Guarantees test suite completeness
- Practice: Fix problematic tests and activate them

❌ **Avoid: test.skip() or commenting out**
- Reason: Creates test gaps and incomplete quality checks
- Solution: Completely delete unnecessary tests


## Basic Vitest Example

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock setup example
vi.mock('./userService', () => ({
  getUserById: vi.fn(),
  updateUser: vi.fn()
}))

describe('ComponentName', () => {
  it('should follow AAA pattern', () => {
    // Arrange
    const input = 'test'
    
    // Act
    const result = someFunction(input)
    
    // Assert
    expect(result).toBe('expected')
  })
})
```