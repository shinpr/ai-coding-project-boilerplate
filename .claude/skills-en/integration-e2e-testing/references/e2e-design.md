# E2E Test Design (Browser Harness)

This reference uses Playwright as the default example throughout because it is the standard E2E browser harness assumed by these workflows. Adapt patterns to the project's chosen framework when different (Cypress, Selenium, etc.); the lane definitions, ROI rules, and budgets remain the same.

## Two E2E Lanes

E2E tests in this workflow split into two lanes (see parent skill Test Types and Limits):

| Lane | When | ROI gate | Cost |
|------|------|----------|------|
| **fixture-e2e** | UI journey verification with deterministic fixtures (mocked backend / fixture data) | Reserved slot is exempt; additional slots within MAX 3 require ROI ≥ 20 | Comparable to integration; runs in CI without infrastructure setup |
| **service-integration-e2e** | Journey correctness depends on real cross-service behavior (data persistence, transactional consistency, external contracts) | ROI > 50 (beyond reserved slot) | 3-10× higher than integration; reserved for what cannot be faked safely |

Both lanes typically use Playwright; the difference is whether the backend is mocked / fixture-driven or running for real.

## When to Create E2E Tests

E2E candidates target **critical user journeys** that span multiple pages or require real browser interaction. Pick the lane based on whether real services are required for the verification.

### Candidate Properties

An E2E candidate is a behavior with one of these properties, wherever the governing artifact records it:

| Property | What makes it an E2E candidate |
|----------|-------------------------------|
| Spans multiple screens | The promised outcome is only observable after a sequence of screen transitions |
| Requires a real browser | Navigation, cookies, storage, or actual DOM rendering decides the result |
| State is reachable only by navigating | An error, empty, or loading state that cannot be produced in-process |
| Interaction is browser-dependent | Drag-drop, keyboard navigation, or responsive behavior |

The agent that reads the governing artifacts maps them to these properties; this skill does not name artifact sections.

### Selection Criteria

**Include** (high E2E ROI):
- Multi-page user journeys (login → dashboard → action → confirmation)
- Flows requiring real browser APIs (navigation, cookies, localStorage)
- Accessibility verification requiring actual DOM rendering
- Responsive behavior across viewports

**Use integration tests instead when**:
- Testing single-component state changes → in-process component renderer (RTL for React/TS)
- Testing API response handling → in-process API mock + component renderer (MSW + RTL for React/TS)
- Testing pure data transformations → unit tests

## Candidate Record

Record each candidate in this form so the lane decision and the budget step can consume it.

### Mapping Template

```
Screen Transition: [Screen A] → [Screen B] → [Screen C]
AC Reference: AC-{id}
User Journey: [Description of what the user accomplishes]
Lane: fixture-e2e | service-integration-e2e
Preconditions: [Auth state, data state — note whether these are fixture-driven or live]
Verification Points:
  - [What to assert at each step]
E2E ROI Score: [calculated score]
```

**Lane decision**: choose `fixture-e2e` by default. Promote to `service-integration-e2e` when the verification requires observing real cross-service behavior (e.g., the test asserts that data persists across a real DB write, or that an external service receives the correct payload).

## Playwright Test Architecture

### Page Object Pattern

Organize browser interactions through page objects for maintainability:

```
tests/
├── e2e/
│   ├── pages/                       # Page objects (shared across lanes)
│   ├── fixtures/                    # Test fixtures and helpers (auth, seed)
│   ├── data/                        # Static fixture data for fixture-e2e
│   ├── *.fixture-e2e.test.ts        # fixture-e2e test files
│   └── *.service-e2e.test.ts        # service-integration-e2e test files
```

### Test Isolation

- Each test starts from a clean browser context
- No shared state between tests
- Use `beforeEach` for common setup (auth, navigation)
- Prefer `page.goto()` over in-test navigation for setup

### Viewport Testing

When UI Spec defines responsive behavior, test critical breakpoints:

| Breakpoint | Width | When to Test |
|-----------|-------|-------------|
| Mobile | UI Spec breakpoint or configured mobile project viewport | If UI Spec defines mobile-specific interactions |
| Tablet | UI Spec breakpoint or configured tablet project viewport | If UI Spec defines tablet layout differences |
| Default | Playwright project viewport or UI Spec baseline | For each selected responsive journey |

## Budget Enforcement

Hard limits per feature (same as parent skill):
- **fixture-e2e**: MAX 3 tests. Reserved slot is exempt from the ROI gate; additional slots require ROI ≥ 20
- **service-integration-e2e**: MAX 1-2 tests, ROI > 50 beyond the reserved slot
- Prefer fewer, comprehensive journey tests over many granular tests in both lanes
