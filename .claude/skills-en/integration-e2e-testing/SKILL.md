---
name: integration-e2e-testing
description: Designs integration and E2E tests with mock boundaries and behavior verification rules. Use when writing E2E or integration tests.
---

# Integration Test & E2E Test Design/Implementation Rules

## References

- **[references/e2e-design.md](references/e2e-design.md)** - E2E test design principles with Playwright (candidate sources, selection criteria, UI Spec mapping)
- **[references/e2e-environment-prerequisites.md](references/e2e-environment-prerequisites.md)** - E2E environment prerequisites (seed data, auth fixtures, environment checklist)

## Test Types and Limits

| Type | Purpose | File Format | Limit |
|------|---------|-------------|-------|
| Integration Test | Component interaction verification | `*.int.test.ts` | 3 per feature |
| E2E Test | Critical user journey verification | `*.e2e.test.ts` | 1-2 per feature |

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

Each test MUST include the following annotations.

```typescript
// AC: "[Acceptance criteria original text]"
// ROI: [0-100] | Business Value: [0-10] | Frequency: [0-10]
// Behavior: [Trigger] -> [Process] -> [Observable Result]
// @category: core-functionality | integration | edge-case | ux | e2e
// @dependency: none | [component name] | full-system
// @complexity: low | medium | high
// @real-dependency: [component name] (optional, when Test Boundaries specify non-mock setup)
```

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

Multi-step journeys are further classified for E2E budget decisions:

| Classification | Condition | E2E Reserved Slot | Example |
|---|---|---|---|
| **User-facing** | A human user directly triggers and observes the steps (via UI, CLI, or direct API interaction) | Eligible | Web checkout flow, CLI setup wizard, mobile onboarding |
| **Service-internal** | Steps are triggered by backend services without direct user interaction | Not eligible for reserved slot | Async job pipeline, service-to-service saga, scheduled batch processing |

**Scope of this classification**:
- **Reserved E2E slot**: Only user-facing journeys qualify. Service-internal journeys are excluded from the reserved slot.
- **Normal ROI > 50 path**: Both user-facing and service-internal journeys compete for the additional E2E slot (up to 1) on ROI merit alone. Classification does not affect this path.
- **E2E Gap Check**: Only user-facing journeys trigger the gap warning. Service-internal journeys do not.

### ROI Calculation

ROI is used to **rank candidates within the same test type** (integration candidates against each other, E2E candidates against each other). Cross-type comparison is unnecessary because integration and E2E budgets are selected independently.

```
ROI Score = Business Value × User Frequency + Legal Requirement × 10 + Defect Detection
              (range: 0–120)
```

Higher ROI Score = higher priority within its test type. No normalization or capping is applied — the raw score is used directly for ranking. Deduplication is a separate step that removes candidates entirely; it does not modify scores.

### ROI Threshold for E2E

E2E tests have high ownership cost (creation, execution, and maintenance are each 3-10× higher than integration tests). To justify creation, an E2E candidate (beyond the must-keep reserved slot) requires **ROI Score > 50**.

### ROI Calculation Examples

| Scenario | BV | Freq | Legal | Defect | ROI Score | Test Type | Selection Outcome |
|----------|----|------|-------|--------|-----------|-----------|-------------------|
| Core checkout flow | 10 | 9 | true | 9 | 109 | E2E | Selected (reserved slot: user-facing multi-step journey) |
| Payment error handling | 8 | 3 | false | 7 | 31 | E2E | Below threshold (31 < 50), not selected |
| Profile save flow | 7 | 6 | false | 6 | 48 | E2E | Below threshold (48 < 50), not selected |
| DB persistence check | 8 | 8 | false | 8 | 72 | Integration | Selected (rank 1 of 3) |
| Error message display | 5 | 3 | false | 4 | 19 | Integration | Selected (rank 2 of 3) |
| Optional filter toggle | 3 | 4 | false | 2 | 14 | Integration | Not selected (rank 4, budget full) |

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

- Execute only after all components are implemented
- Do not use mocks (`@dependency: full-system`)

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
