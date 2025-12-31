---
name: integration-e2e-testing
description: Designs integration and E2E tests with mock boundaries and behavior verification rules. Use when writing E2E or integration tests.
---

# Integration Test & E2E Test Design/Implementation Rules

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

```typescript
// AC: "[Acceptance criteria original text]"
// ROI: [0-100] | Business Value: [0-10] | Frequency: [0-10]
// Behavior: [Trigger] -> [Process] -> [Observable Result]
// @category: core-functionality | integration | edge-case | ux | e2e
// @dependency: none | [component name] | full-system
// @complexity: low | medium | high
it.todo('[AC number]: [Test name]')
```

### Property Annotations

```typescript
// Property: `[Verification expression]`
// fast-check: fc.property(fc.[arbitrary], (input) => [invariant])
it.todo('[AC number]-property: [Invariant description]')
```

### ROI Calculation

```
ROI = (Business Value x Frequency + Legal Requirement x 10 + Defect Detection) / Total Cost
```

| Type | Total Cost | E2E Generation Condition |
|------|------------|-------------------------|
| Integration | 11 | - |
| E2E | 38 | ROI > 50 |

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
