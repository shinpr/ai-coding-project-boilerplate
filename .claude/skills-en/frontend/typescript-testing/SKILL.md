---
name: frontend/typescript-testing
description: Designs tests with React Testing Library and MSW. Applies component testing patterns.
---

# TypeScript Testing Rules (Frontend)

## Test Framework
- **Vitest**: This project uses Vitest
- **React Testing Library**: For component testing
- **MSW (Mock Service Worker)**: For API mocking
- Test imports: `import { describe, it, expect, beforeEach, vi } from 'vitest'`
- Component test imports: `import { render, screen, fireEvent } from '@testing-library/react'`
- Mock creation: Use `vi.mock()`

## Basic Testing Policy

### Quality Requirements
- **Coverage**: Unit test coverage must be 60% or higher (Frontend standard 2025)
- **Independence**: Each test can run independently without depending on other tests
- **Reproducibility**: Tests are environment-independent and always return the same results
- **Readability**: Test code maintains the same quality as production code

### Coverage Requirements (ADR-0002 Compliant)
**Mandatory**: Unit test coverage must be 60% or higher
**Component-specific targets**:
- Atoms (Button, Text, etc.): 70% or higher
- Molecules (FormField, etc.): 65% or higher
- Organisms (Header, Footer, etc.): 60% or higher
- Custom Hooks: 65% or higher
- Utils: 70% or higher

**Metrics**: Statements, Branches, Functions, Lines

### Test Types and Scope
1. **Unit Tests (React Testing Library)**
   - Verify behavior of individual components or functions
   - Mock all external dependencies
   - Most numerous, implemented with fine granularity
   - Focus on user-observable behavior

2. **Integration Tests (React Testing Library + MSW)**
   - Verify coordination between multiple components
   - Mock APIs with MSW (Mock Service Worker)
   - No actual DB connections (backend manages DB)
   - Verify major functional flows

3. **Cross-functional Verification in E2E Tests**
   - Mandatory verification of impact on existing features when adding new features
   - Cover integration points with "High" and "Medium" impact levels from Design Doc's "Integration Point Map"
   - Verification pattern: Existing feature operation -> Enable new feature -> Verify continuity of existing features
   - Success criteria: No change in displayed content, rendering time within 5 seconds
   - Designed for automatic execution in CI/CD pipelines

## Test Implementation Conventions

### Directory Structure (Co-location Principle)
```
src/
└── components/
    └── Button/
        ├── Button.tsx
        ├── Button.test.tsx  # Co-located with component
        └── index.ts
```

**Rationale**:
- React Testing Library best practice
- ADR-0002 Co-location principle
- Easy to find and maintain tests alongside implementation

### Naming Conventions
- Test files: `{ComponentName}.test.tsx`
- Integration test files: `{FeatureName}.integration.test.tsx`
- Test suites: Names describing target components or features
- Test cases: Names describing expected behavior from user perspective

### Test Code Quality Rules

**Recommended: Keep all tests always active**
- Merit: Guarantees test suite completeness
- Practice: Fix problematic tests and activate them

**Avoid: test.skip() or commenting out**
- Reason: Creates test gaps and incomplete quality checks
- Solution: Completely delete unnecessary tests

## Mock Type Safety Enforcement

### MSW (Mock Service Worker) Setup
```typescript
// Type-safe MSW handler
import { rest } from 'msw'

const handlers = [
  rest.get('/api/users/:id', (req, res, ctx) => {
    return res(ctx.json({ id: '1', name: 'John' } satisfies User))
  })
]
```

### Component Mock Type Safety
```typescript
// Only required parts
type TestProps = Pick<ButtonProps, 'label' | 'onClick'>
const mockProps: TestProps = { label: 'Click', onClick: vi.fn() }

// Only when absolutely necessary, with clear justification
const mockRouter = {
  push: vi.fn()
} as unknown as Router // Complex router type structure
```

## Basic React Testing Library Example

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('should call onClick when clicked', () => {
    const onClick = vi.fn()
    render(<Button label="Click me" onClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: 'Click me' }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
```
