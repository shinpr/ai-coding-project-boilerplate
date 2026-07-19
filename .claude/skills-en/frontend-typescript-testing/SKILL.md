---
name: frontend-typescript-testing
description: Designs frontend tests using the repository's configured React test and browser harnesses, including RTL, MSW, Vitest, and Playwright when present. Use when adding or reviewing component, loading/error-state, integration, or frontend E2E tests.
---

# TypeScript Testing Rules (Frontend)

## Prerequisite Detection

Inspect `package.json`, the lockfile, test configuration, and existing test imports before selecting a framework or command. Apply Vitest, React Testing Library, MSW, or Playwright rules only when the dependency/configuration is present. Use the repository's configured equivalent when different. If no runnable harness can be identified, report the inspected paths and the missing framework or command instead of inventing one.

## References

| Test Type | Reference | When to Use |
|-----------|-----------|-------------|
| **Unit / Integration** | This document | Implementing React component tests with RTL + Vitest + MSW |
| **E2E** | [references/e2e.md](references/e2e.md) | Implementing browser-level E2E tests with Playwright |

## Test Framework
- **Vitest**: Use when the repository config or existing tests select Vitest
- **React Testing Library**: For component testing
- **MSW (Mock Service Worker)**: For API mocking
- Test imports: `import { describe, it, expect, beforeEach, vi } from 'vitest'`
- Component test imports: `import { render, screen } from '@testing-library/react'`
- User interaction: `import userEvent from '@testing-library/user-event'`
- Mock creation: Use `vi.mock()`

## Basic Testing Policy

### Quality Requirements
- **Coverage**: assert the named acceptance result, public branch, or failure state on critical paths and high-reuse components; treat coverage as a signal for gaps, not a target. Any numeric threshold comes from the project's CI configuration
- **Independence**: Each test can run independently without depending on other tests
- **Reproducibility**: Control time, randomness, environment values, network responses, and browser state so identical inputs produce the same observable result
- **Readability**: Each test names one user-visible behavior, separates setup/action/assertion, and keeps fixtures limited to values used by that behavior

### Where to concentrate test rigor
For shared components, custom hooks, and utilities reused across features, cover their public branches, error states, and boundary contracts because their regression blast radius is wider. Verify page-level composition through integration/E2E tests when the behavior depends on multiple rendered units. Any numeric threshold is the project's CI config.

**Metrics** (what coverage reports break down): Statements, Branches, Functions, Lines

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
   - Verify flows that implement a primary acceptance criterion or coordinate multiple rendered components

3. **Cross-functional Verification in E2E Tests**
   - Mandatory verification of impact on existing features when adding new features
   - Cover integration points classified as "High" and "Medium" in the Design Doc's "Integration Point Map"; when no Design Doc exists, classify an integration point as High when failure breaks a primary user journey or contract, and Medium when failure degrades a secondary observable behavior
   - Verification pattern: Existing feature operation -> Enable new feature -> Verify continuity of existing features
   - Success criteria: Preserve the displayed content and interaction behavior named by the source acceptance criteria; apply a rendering-time threshold only when project configuration or a requirement defines its value and measurement method
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
- Keeps component behavior tests discoverable beside the implementation they cover
- Co-location principle: tests live alongside the implementation they cover
- Easy to find and maintain tests alongside implementation

### Naming Conventions
- Test files: `{ComponentName}.test.tsx`
- Integration test files: `{FeatureName}.integration.test.tsx`
- Test suites: Names describing target components or features
- Test cases: Names describing expected behavior from user perspective

### Test Code Quality Rules

Keep every committed test active. Repair a test that protects current behavior; remove a test only when its behavior is no longer required and the source requirement or implementation contract confirms the removal.

## Mock Type Safety Enforcement

### MSW (Mock Service Worker) Setup
```typescript
// Type-safe MSW handler (MSW v2)
import { http, HttpResponse } from 'msw'

const handlers = [
  http.get('/api/users/:id', () => {
    return HttpResponse.json({ id: '1', name: 'John' } satisfies User)
  })
]
```

### Component Mock Type Safety
```typescript
// Only required parts
type TestProps = Pick<ButtonProps, 'label' | 'onClick'>
const mockProps: TestProps = { label: 'Click', onClick: vi.fn() }

// Type only the router surface consumed by the subject under test
const mockRouter = {
  push: vi.fn()
} satisfies Pick<Router, 'push'>
```

## Basic React Testing Library Example

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('should call onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button label="Click me" onClick={onClick} />)
    await user.click(screen.getByRole('button', { name: 'Click me' }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
```

## Test Design Patterns

Test user-visible results, not implementation details. Query by accessibility (`getByRole`/`getByLabelText`/`getByText`), not `getByTestId` or `container.querySelector`. Cover empty, error, and loading/async states, not only the happy path; await async UI with `findBy*`.

When the required UI state, accessibility name, or external contract is unknown, stop test design for that assertion and name the UI Spec, acceptance criterion, implementation contract, or user decision needed. Continue with independent assertions whose expected behavior is observed.

```typescript
// Test the user-visible result
it('increments count when clicked', async () => {
  const user = userEvent.setup()
  render(<Counter />)
  await user.click(screen.getByRole('button', { name: '+' }))
  expect(screen.getByText('Count: 1')).toBeInTheDocument()
})

// Error state: override the handler for one test
it('shows an error message on API failure', async () => {
  server.use(http.get('/api/users', () => new HttpResponse(null, { status: 500 })))
  render(<UserList />)
  expect(await screen.findByText('Something went wrong')).toBeInTheDocument()
})
```
