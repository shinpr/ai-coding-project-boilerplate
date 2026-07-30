---
name: integration-e2e-testing
description: Designs integration and E2E tests with mock boundaries and behavior verification rules. Use when writing E2E or integration tests.
---

# Integration Test & E2E Test Design/Implementation Rules

## References

- **[references/e2e-design.md](references/e2e-design.md)** - E2E test design principles with Playwright (candidate sources, selection criteria, UI Spec mapping)
- **[references/e2e-environment-prerequisites.md](references/e2e-environment-prerequisites.md)** - service-integration-e2e environment prerequisites (seed data, auth fixtures, environment checklist); fixture-e2e requires no live service or real database

## Test Types and Limits

| Test Type | Purpose | Scope | External Deps | File Format | Limit per Feature | Implementation Timing |
|-----------|---------|-------|---------------|-------------|-------------------|----------------------|
| Integration | Verify component interactions in-process | Partial system integration (in-process modules; for UI components, RTL+MSW for React/TS) | Mocked or in-process | `*.int.test.ts` | MAX 3 | Created alongside implementation |
| fixture-e2e | Verify UI behavior in a browser with deterministic fixtures | Full UI flow with mocked backend / fixture-driven state | Mocked / fixture only — no live services | `*.fixture-e2e.test.ts` | MAX 3 | Created alongside the UI feature |
| service-integration-e2e | Verify critical user journeys against a running local stack | Full system across services | Live local services or stubs | `*.service-e2e.test.ts` | MAX 1-2 | Executed only in the final phase |

**Lane selection (E2E only)**:
- Default lane for user-facing UI journeys is **fixture-e2e** — it runs a real browser against deterministic fixtures, catches the bugs that unit/integration tests miss (button no-op, state never updates, navigation breaks), and runs in CI without infrastructure setup
- Add **service-integration-e2e** only when the journey's correctness depends on real cross-service behavior (data persistence, transactional consistency, external service contracts) that cannot be faked safely

The two E2E lanes are budgeted independently — having a fixture-e2e for a journey does not consume the service-integration-e2e budget and vice versa.

**Critical User Journey**: Features with revenue impact, legal requirements, or daily use by majority of users

## Behavior-First Principle

### Observability Check (All YES = Include)

| Check | Question | If NO |
|-------|----------|-------|
| Observable | Can user observe the result? | Exclude |
| System Context | Does it require integration of multiple components? | Exclude |
| Automatable | Can it run stably in CI environment? | Exclude |

### Include/Exclude Criteria

**Include**: Business logic accuracy, data integrity, user-visible features, error handling
**Exclude**: External live connections, performance metrics, implementation details, UI layout

## Skeleton Specification

### Required Comment Format

The committed skeleton imports only the test framework (for `describe`/`it`/`it.todo`). The implementing task adds the module under test after that module exists, so gates that type-check, compile, or load test files can run successfully before implementation begins.

Each test MUST include the following annotations.

```typescript
// AC: "[Acceptance criteria original text]"
// ROI: [0-120] | Business Value: [0-10] | Frequency: [0-10] | Legal: [0|1] | Defect Detection: [0-10]
// Behavior: [Trigger] -> [Process] -> [Observable Result]
// @category: core-functionality | integration | edge-case | ux | fixture-e2e | service-integration-e2e
// @lane: integration | fixture-e2e | service-integration-e2e
// @dependency: none | [component names] | full-ui (mocked backend) | full-system
// @complexity: low | medium | high
// @real-dependency: [component name] (optional, when Test Boundaries specify non-mock setup)
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

## Multi-Step User Journey Definition

A feature qualifies as containing a **multi-step user journey** when ALL of the following are true:

1. **2+ distinct interaction boundaries** are traversed in sequence to complete a user goal. What counts as a boundary depends on the system type:
   - Web: distinct routes/pages
   - Mobile native: distinct screens/views
   - CLI: distinct command invocations or interactive prompts
   - API: distinct API calls forming a transaction (e.g., create → confirm → finalize)
2. **State carries across steps** — data produced or actions taken in one step affect what the next step accepts or displays
3. **The journey has a completion point** — a final state the user or caller reaches (e.g., confirmation page, saved record, API success response, completed workflow)

### User-Facing vs Service-Internal Journeys

Multi-step journeys are classified for reserved-slot eligibility:

| Classification | Condition | Reserved Slot Eligibility | Example |
|---|---|---|---|
| **User-facing** | A human user directly triggers and observes the steps (via UI, CLI, or direct API interaction) | Eligible — defaults to **fixture-e2e** reserved slot. Add a service-integration-e2e reserved slot only when the journey's correctness depends on real cross-service behavior | Web checkout flow, CLI setup wizard, mobile onboarding |
| **Service-internal** | Steps are triggered by backend services without direct user interaction | Not eligible for reserved slot — use integration tests. service-integration-e2e through normal ROI > 50 path is still valid when full-system verification is warranted | Async job pipeline, service-to-service saga, scheduled batch processing |

This classification applies to the reserved-slot rule and the E2E Gap Check. Other selection follows lane-specific ROI rules below.

### ROI Calculation

ROI is used to **rank candidates within the same test type** (integration candidates against each other, E2E candidates against each other). Cross-type comparison is unnecessary because integration and E2E budgets are selected independently.

```
ROI Score = Business Value × User Frequency + Legal Requirement × 10 + Defect Detection
              (range: 0–120)
```

Score inputs use these rules:

| Input | Range | Evidence rule |
|-------|-------|---------------|
| Business Value | 0-10 | 0 = no user/business outcome; 10 = revenue, legal, safety, or primary product outcome |
| User Frequency | 0-10 | Map observed product analytics or sampled telemetry to the range and record the source. Use a named stakeholder estimate only when observed usage is unavailable, label it inferred, and otherwise mark the input unknown |
| Legal Requirement | 0 or 1 | 1 only when a named requirement, policy, or regulation requires the behavior |
| Defect Detection | 0-10 | 0 = already proven at a cheaper boundary; 10 = the candidate uniquely detects a material failure at this lane |

Higher ROI Score = higher priority within its test type. No normalization or capping is applied — the raw score is used directly for ranking. Deduplication is a separate step that removes candidates entirely; it does not modify scores. Break score ties by higher Defect Detection, then higher Business Value, then lower environment/maintenance cost.

When a required score input is unknown and could change selection at the lane budget boundary, stop candidate selection and report the exact usage, requirement, or boundary evidence needed. When it cannot change the selected set, record the unknown and continue.

### ROI Thresholds by Lane

The two E2E lanes have very different ownership costs and use independent thresholds.

| Lane | ROI threshold | Rationale |
|------|---------------|-----------|
| fixture-e2e | ROI ≥ 20 (beyond reserved slot) | Cost is comparable to integration tests once the harness exists; the floor avoids filling MAX 3 with low-signal tests when fewer would suffice |
| service-integration-e2e | ROI > 50 (beyond reserved slot) | Creation, execution, and maintenance cost is 3-10× higher than integration; reserve for journeys whose value cannot be proven any other way |

Reserved slot rules apply per lane and override the threshold (the reserved candidate is emitted regardless of its ROI score). Below-floor candidates beyond the reserved slot are not emitted, leaving budget intentionally unfilled rather than padding with low-value tests.

### ROI Calculation Examples

| Scenario | BV | Freq | Legal | Defect | ROI Score | Test Type | Selection Outcome |
|----------|----|------|-------|--------|-----------|-----------|-------------------|
| Core checkout UI flow | 10 | 9 | 1 | 9 | 109 | fixture-e2e | Selected by the reserved user-facing journey rule |
| Core checkout against live payment service | 10 | 9 | 1 | 9 | 109 | service-integration-e2e | Selected because correctness requires real cross-service behavior |
| Dismiss button updates UI state | 6 | 7 | 0 | 8 | 50 | fixture-e2e | Selected within the fixture-e2e budget |
| Payment error message display | 5 | 4 | 0 | 7 | 27 | fixture-e2e | Selected as the third and final fixture-e2e budget slot |
| Optional filter persistence | 4 | 4 | 0 | 6 | 22 | fixture-e2e | Threshold met, but not selected because three higher-scoring candidates fill the MAX 3 budget |
| Payment retry against real provider | 8 | 3 | 0 | 7 | 31 | service-integration-e2e | Below the service-integration-e2e threshold |

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
- Execute alongside the UI feature implementation phase (not deferred to the end)
- Use mocked backend / fixture-driven state (`@dependency: full-ui (mocked backend)`); no live services required
- Runs in CI without infrastructure setup

**service-integration-e2e**:
- Execute only in the final phase, after all components are implemented and the local stack is up
- Use real local services or service stubs — no in-process mocks for the components under verification (`@dependency: full-system`)

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
| Readability | Test name and verification content don't match |

### Route Parity for Shared Mutations

When multiple routes reach the same mutation — a CLI path and an HTTP handler, a scheduled job and a manual trigger, a batch and a single-item endpoint — compare them along four axes: validation, classification, resource bounds, and the order of read, parse, mutation, and reporting.

A difference is permitted only by a source that decides intent: a requirement, the Design Doc, an ADR, or a Binding Decision. Tests sit downstream of that decision — they record the behavior that exists, so an existing test covering the permissive route confirms the bypass rather than permitting it. Once a difference is permitted, a test verifies that it behaves as decided.

When a difference has no permitting source, require a test that exposes the bypass: drive the mutation through the route that skips the check and assert the state the skipped check was protecting.

| Check | Failure Condition |
|-------|-------------------|
| Validation parity | One route validates an input the other accepts unchecked, with no requirement or contract permitting the difference |
| Classification parity | The same failure is classified differently per route, changing what the caller observes |
| Resource-bound parity | One route enforces a size, count, or timeout bound the other omits |
| Operation-order parity | Routes differ in read/parse/mutation/reporting order such that one can mutate before validating or report before persisting |
| Bypass coverage | An unexplained difference has no test driving the mutation through the permissive route |
