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

### Coverage Verification Methods

```bash
# Accurate coverage measurement (recommended)
npm run test:coverage:fresh

# Check detailed HTML report
open coverage/index.html
```

**Coverage Metrics**: Statements, Branches, Functions, Lines

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

### Red-Green-Refactor Process (TDD - Method by Kent Beck)

#### Basic Principle
**Start all new features and bug fixes with tests**. Always write failing tests before writing implementation code.

#### Detailed Process Steps

1. **Red (Write failing tests)**
   - Define expected behavior with tests before implementation
   - Tests must fail at this point

2. **Green (Pass tests with minimal implementation)**
   - Implement minimal code to pass tests
   - Hard-coding is acceptable

3. **Refactor (Improve code)**
   - Improve code while maintaining passing test state
   - Run tests at each stage to verify behavior

#### Test-First Application Exceptions

1. **Pure configuration changes**: Environment variables, build settings, dependency package updates
2. **Documentation updates**: README, comments, type definition-only changes
3. **Refactoring**: Already covered by existing tests, external interface unchanged
4. **Emergency response**: Production failure fixes (must add tests after fixes)

#### Test Addition Strategy for Existing Code

1. **New feature addition**: Always implement test-first
2. **Bug fixes**: Write tests that reproduce bugs first
3. **Refactoring**: Create tests that protect current behavior first

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

✅ **Recommended: Ensure mock type safety**
- Merit: Can detect type errors in test code too
- Practice: Use appropriate type definitions for mocks and stubs

❌ **Avoid: Using any type in test code**
- Reason: Reduces test reliability and may miss bugs

### Test Failure Response Criteria

#### Cases to Fix Tests
1. **Obviously wrong expected values**: When technically incorrect
2. **References to non-existent features**: Functions changed by refactoring
3. **Excessive dependence on implementation details**: Too dependent on internal implementation
4. **Implementation only for tests**: Unnecessary code just to pass tests

#### Cases to Fix Implementation
1. **Tests representing valid specifications**: Behavior represents valid specifications
2. **Business logic tests**: Verification of important business logic
3. **Edge case handling**: Verification of important edge cases

#### When in Doubt
Always confirm with user

## Test Helper Utilization Rules

### Basic Principles
- **Test helper consolidation**: Consider consolidation for patterns duplicated in 3+ places (Rule of Three - Martin Fowler "Refactoring")
- **Decision criteria**: Consolidate simple and stable ones, implement individually for complex or frequently changing ones

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

### Error Case Testing
- Test both normal and abnormal cases
- Clearly verify behavior when errors occur
- Also verify error message content

### Test Code Quality Rules

✅ **Recommended: Keep all tests always active**
- Merit: Guarantees test suite completeness
- Practice: Fix problematic tests and activate them

❌ **Avoid: test.skip() or commenting out**
- Reason: Creates test gaps and incomplete quality assurance
- Solution: Completely delete unnecessary tests

### Vitest Process Management Rules

```bash
# Post-test cleanup (mandatory)
npm run cleanup:processes

# Or safe execution
npm run test:safe
```

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

## Referenced Methodologies
- **Red-Green-Refactor**: Kent Beck "Test-Driven Development"