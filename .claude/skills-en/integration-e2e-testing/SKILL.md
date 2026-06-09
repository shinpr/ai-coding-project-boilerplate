---
name: integration-e2e-testing
description: Designs integration and E2E tests with mock boundaries and behavior verification rules. Use when writing E2E or integration tests.
---

# Integration Test & E2E Test Design/Implementation Rules

## References

- **[references/e2e-design.md](references/e2e-design.md)** - E2E test design principles with Playwright (candidate sources, selection criteria, UI Spec mapping)
- **[references/e2e-environment-prerequisites.md](references/e2e-environment-prerequisites.md)** - E2E environment prerequisites (seed data, auth fixtures, environment checklist)

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

The committed skeleton imports only the test framework (for `describe`/`it`/`it.todo`); the module under test is imported by the implementing task, never by the skeleton — a skeleton that references a not-yet-created module can fail gates that type-check, compile, or load test files before implementation begins.

Each test MUST include the following annotations.

```typescript
// AC: "[Acceptance criteria original text]"
// ROI: [0-100] | Business Value: [0-10] | Frequency: [0-10]
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

Higher ROI Score = higher priority within its test type. No normalization or capping is applied — the raw score is used directly for ranking. Deduplication is a separate step that removes candidates entirely; it does not modify scores.

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
| Core checkout UI flow | 10 | 9 | true | 9 | 109 | fixture-e2e | Selected (reserved slot: user-facing multi-step journey, browser verification with fixtures) |
| Core checkout against live payment service | 10 | 9 | true | 9 | 109 | service-integration-e2e | Selected (real-service correctness above ROI threshold) |
| Dismiss button updates UI state | 6 | 7 | false | 8 | 50 | fixture-e2e | Selected (rank 2 of 3 fixture-e2e budget) |
| Payment error message display (UI) | 5 | 4 | false | 7 | 27 | fixture-e2e | Selected (rank 3 of 3 fixture-e2e budget) |
| Optional filter toggle | 3 | 4 | false | 2 | 14 | fixture-e2e | Not selected (rank 4, budget full) |
| Payment retry against real provider | 8 | 3 | false | 7 | 31 | service-integration-e2e | Below ROI threshold (31 < 50), not selected |
| DB persistence check | 8 | 8 | false | 8 | 72 | Integration | Selected (rank 1 of 3) |
| Pure data transformation | 5 | 3 | false | 4 | 19 | Integration | Selected (rank 2 of 3) |

## Implementation Rules

### Property-Based Test Implementation

When Property annotation exists, fast-check library is required:

```typescript
import fc from 'fast-check'

it('AC2-property: Model name is always gemini-3-pro-image-preview', () => {
  fc.assert(
    fc.property(fc.string(), (prompt) => {
      const result = client.generate(prompt)
      return result.model === 'gemini-3-pro-image-preview'
    })
  )
})
```

**Requirements**:
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

| Judgment Criteria | Mock | Actual |
|-------------------|------|--------|
| Part of test target? | No -> Can mock | Yes -> Actual required |
| Is call verification target of test? | No -> Can mock | Yes -> Actual or verifiable mock |
| External network communication? | Yes -> Mock required | No -> Actual recommended |

**Judgment Flow**:
1. External API (HTTP communication) -> Mock required
2. Component interaction under test -> Actual required
3. Log output verification needed -> Use verifiable mock (vi.fn())
4. Log output verification not needed -> Actual or ignore

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
