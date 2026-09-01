---
name: integration-e2e-testing
description: Selects and designs the smallest integration/E2E test set that proves accepted behavior at an observable boundary. Use when writing or reviewing E2E or integration tests.
---

# Integration Test & E2E Test Design/Implementation Rules

## References

- **[references/e2e-design.md](references/e2e-design.md)** - E2E test design principles with Playwright (candidate properties, selection criteria, candidate record)
- **[references/e2e-environment-prerequisites.md](references/e2e-environment-prerequisites.md)** - service-integration-e2e environment prerequisites (seed data, auth fixtures, environment checklist); fixture-e2e requires no live service or real database

## Test Types and Selection

| Test Type | Purpose | Scope | External Deps | File Format | Implementation Timing |
|-----------|---------|-------|---------------|-------------|----------------------|
| Integration | Verify component interactions in-process | Partial system integration (in-process modules; for UI components, RTL+MSW for React/TS) | Mocked or in-process | `*.int.test.ts` | Created alongside implementation |
| fixture-e2e | Verify browser behavior with deterministic fixtures | Full UI flow with mocked backend / fixture-driven state | Mocked / fixture only — no live services | `*.fixture-e2e.test.ts` | Created alongside the UI feature |
| service-integration-e2e | Verify a contract that only a running stack can expose | Full system across services | Live local services or service-level stubs | `*.service-e2e.test.ts` | Executed after the required services exist |

**Lane selection (E2E only)**:
- Default lane for user-facing UI journeys is **fixture-e2e** — it runs a real browser against deterministic fixtures, catches the bugs that unit/integration tests miss (button no-op, state never updates, navigation breaks), and runs in CI without infrastructure setup
- Select **service-integration-e2e** when the proof obligation is real cross-service behavior such as data persistence, transactional consistency, or an external service contract

Start from accepted proof obligations, assign each to the cheapest boundary that can expose its failure, remove duplicate coverage, and keep the smallest set that covers every remaining distinct failure. Let those obligations determine the test count. A feature may validly produce no test in a lane.

## Behavior-First Principle

### Candidate Evidence

An integration/E2E candidate states:

- an observable result at the boundary named by the accepted behavior;
- a material failure that crosses the components exercised by the selected lane;
- an automated harness or controlled environment capable of reproducing that failure

Route behavior observable in isolation to unit/component verification. Record an unavailable controlled environment as a proof prerequisite for service-integration-e2e.

### Candidate Routing

- Keep business-logic accuracy, data integrity, user-visible behavior, and observable error handling in the integration/E2E pool when they require those boundaries
- Route pure implementation details and data transformations to unit tests, performance claims to performance verification, and layout-only claims to visual or UI checks
- Represent external contracts with service-level stubs or a controlled local service when that contract is the proof target

## Skeleton Specification

### Required Skeleton Format

A committed file matching the project's test include pattern must remain valid to its runner. Use the detected framework's smallest pending suite (`describe` plus `it.todo`, or its equivalent), with only the test-framework import and the required comments. The implementing task replaces pending cases and adds application imports, assertions, fixtures, and mock setup alongside implementation.

Each test MUST include the following annotations.

```typescript
// AC: "[Acceptance criteria original text]"
// Behavior: [Trigger] -> [Process] -> [Observable Result]
// @lane: integration | fixture-e2e | service-integration-e2e
// @dependency: none | [component names] | full-ui (mocked backend) | full-system
// @real-dependency: [component name] (optional, when Test Boundaries specify non-mock setup)
// Primary failure mode: [specific regression that must make the implemented test fail]
// Proof obligation: [boundary and observable state the implemented test must assert]
// Verification items: [observations that establish the obligation]
```

**`@lane` selection rule**:
- `integration` — Component interaction in-process, no browser (e.g., RTL+MSW for React/TS, in-process module/handler integration in any language)
- `fixture-e2e` — Browser-level UI verification with mocked backend / fixture-driven state. `@dependency` is typically `full-ui (mocked backend)`
- `service-integration-e2e` — Browser-level or end-to-end verification against running local services or stubs. `@dependency` is `full-system`

### Property Annotations

```typescript
// Property: `[Verification expression]`
// fast-check: fc.property(fc.[arbitrary], (input) => [invariant])
```

## Test Set Selection

1. Read the accepted behavior and each recorded proof obligation from the governing artifact or task.
2. For each obligation, name the material failure that must make a test fail and the observable state that exposes it.
3. Search existing tests. Reuse coverage only when it exercises the same boundary and would fail for that failure.
4. Assign the obligation to the narrowest sufficient lane:
   - unit/component when isolated execution exposes the behavior;
   - integration for in-process component contracts;
   - fixture-e2e for browser behavior whose backend may be deterministic;
   - service-integration-e2e for persistence, transactions, messages, or external contracts whose failure is exposed only through that running boundary
5. Merge obligations when one scenario proves them while preserving a clear assertion-to-failure mapping. Keep distinct setup and failure modes in separate scenarios.
6. Emit only the remaining minimal covering set. Record the accepted behavior, primary failure, proof obligation, selected lane, and mock boundary in each skeleton.

Select from accepted behavior and repository proof boundaries; product analytics and numerical value estimates are unnecessary. Escalate when the accepted behavior or required contract remains unresolved after consulting governing sources and repository evidence.

## Implementation Rules

### Property-Based Test Implementation

When a Property annotation exists, fast-check is required:
- Write in `fc.assert(fc.property(...))` format
- Reflect skeleton's `// fast-check:` comment directly in implementation
- When failure case discovered, add as concrete unit test (regression prevention)

### Behavior Verification Implementation

**Behavior Description Verification Levels**:

| Step Type | Verification Target | Example |
|-----------|--------------------| --------|
| Trigger | Reproduce in Arrange | API failure -> mockResolvedValue({ ok: false }) |
| Process | Intermediate state or call | Function call, state change |
| Observable Result | Final output value | Return value, error message, log output |

**Pass Criteria**: Pass if "observable result" is verified as **return value or mock call argument** of test target

### Verification Item Determination Rules

| Skeleton State | Verification Item Determination Method |
|----------------|---------------------------------------|
| `// Verification items:` listed | Implement all listed items with expect |
| No `// Verification items:` | Derive from "observable result" in "Behavior" description |
| Both present | Prioritize verification items, use behavior as supplement |

### Integration Test Mock Boundaries

Take the first row that matches the claim under review:

| Condition | Boundary to use |
|---|---|
| The external adapter, query, migration, or service contract itself is under test | The real boundary, or a service-level stub in the `service-integration-e2e` lane — a mock cannot prove the contract it stands in for |
| External API or network call not under test | Mock |
| Component interaction under test | Real in-process components |
| The call itself is what the test verifies (e.g., log output) | A verifiable mock (`vi.fn()`) |
| Neither the call nor its target is under test | Real, or ignore |

### E2E Test Execution Conditions

**fixture-e2e**:
- Execute alongside the UI feature implementation phase
- Use mocked backend / fixture-driven state (`@dependency: full-ui (mocked backend)`)
- Run in CI with the deterministic fixture setup

**service-integration-e2e**:
- Execute only in the final phase, after all components are implemented and the local stack is up
- Exercise components under verification through real local services or service-level stubs (`@dependency: full-system`)

## Review Criteria

### Skeleton and Implementation Consistency

| Check | Failure Condition |
|-------|-------------------|
| Property Verification | Property annotation exists but fast-check not used |
| Behavior Verification | No expect for "observable result" |
| Verification Item Coverage | Listed verification items not included in expect |
| Mock Boundary | Internal components mocked in integration test |

### Implementation Quality

| Check | Failure Condition |
|-------|-------------------|
| AAA Structure | Arrange/Act/Assert separation unclear |
| Independence | State sharing between tests, execution order dependency |
| Reproducibility | Depends on date/random, results vary |

### Route Parity for Shared Mutations

When multiple routes reach the same mutation — a CLI path and an HTTP handler, a scheduled job and a manual trigger, a batch and a single-item endpoint — compare them along four axes: validation, classification, resource bounds, and the order of read, parse, mutation, and reporting.

A difference is permitted only by a source that decides intent: a requirement, the Design Doc, or an ADR. Tests sit downstream of that decision — they record the behavior that exists, so an existing test covering the permissive route confirms the bypass rather than permitting it. Once a difference is permitted, a test verifies that it behaves as decided.

When a difference has no permitting source, require a test that exposes the bypass: drive the mutation through the route that skips the check and assert the state the skipped check was protecting.

| Check | Failure Condition |
|-------|-------------------|
| Validation parity | One route validates an input the other accepts unchecked, with no requirement or contract permitting the difference |
| Classification parity | The same failure is classified differently per route, changing what the caller observes |
| Resource-bound parity | One route enforces a size, count, or timeout bound the other omits |
| Operation-order parity | Routes differ in read/parse/mutation/reporting order such that one can mutate before validating or report before persisting |
| Bypass coverage | An unexplained difference has no test driving the mutation through the permissive route |
