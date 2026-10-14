# E2E Test Design (Browser Harness)

This reference uses Playwright as the default browser harness. Adapt patterns to the project's chosen framework when different (Cypress, Selenium, etc.); the proof-boundary rules remain the same.

## Two E2E Lanes

E2E tests in this workflow split into two lanes (see parent skill Test Types and Selection):

| Lane | When | Proof boundary | Cost |
|------|------|----------------|------|
| **fixture-e2e** | UI journey verification with deterministic fixtures (mocked backend / fixture data) | A real browser is the claim boundary; backend behavior is supplied as fixture state | Runs in CI with fixture setup |
| **service-integration-e2e** | Journey correctness depends on real cross-service behavior (data persistence, transactional consistency, external contracts) | The running service boundary is itself part of the claim | Higher setup and maintenance cost; select it when that boundary uniquely exposes the failure |

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

Map the governing artifacts to these properties; this skill does not name artifact sections.

### Selection Criteria

**Include**:
- Multi-page user journeys (login → dashboard → action → confirmation)
- Flows requiring real browser APIs (navigation, cookies, localStorage)
- Accessibility verification requiring actual DOM rendering
- Responsive behavior across viewports

**Use integration tests instead when**:
- Testing single-component state changes → in-process component renderer (RTL for React/TS)
- Testing API response handling → in-process API mock + component renderer (MSW + RTL for React/TS)
- Testing pure data transformations → unit tests

## Candidate Record

Record each selected candidate in this form so downstream implementation can preserve the proof decision.

### Mapping Template

```
Screen Transition: [Screen A] → [Screen B] → [Screen C]
AC Reference: AC-{id}
User Journey: [Description of what the user accomplishes]
Lane: fixture-e2e | service-integration-e2e
Preconditions: [Auth state, data state — note whether these are fixture-driven or live]
Verification Points:
  - [What to assert at each step]
Primary Failure: [regression that must make the test fail]
Proof Obligation: [boundary and observable state the test must exercise]
```

**Lane decision**: choose `fixture-e2e` by default. Promote to `service-integration-e2e` when the verification requires observing real cross-service behavior (e.g., the test asserts that data persists across a real DB write, or that an external service receives the correct payload).

## Minimal Set Check

- Every emitted E2E test covers an accepted proof obligation that no cheaper test already proves
- Every omitted E2E candidate is covered elsewhere, duplicates another scenario, or does not require a browser/system boundary
- Prefer one coherent journey when it proves several obligations and each assertion remains traceable to its failure
- Let the distinct material failures determine the test count; retain the smallest set that covers all of them
