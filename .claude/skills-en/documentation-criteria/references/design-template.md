# [Feature Name] Design Document

## Overview

[Explain the purpose and overview of this feature in 2-3 sentences]

### Referenced UI Spec (when applicable)
- UI Spec path: [docs/ui-spec/xxx-ui-spec.md]
- Component structure and state design are inherited from UI Spec

## Background and Context

### Prerequisite ADRs

List the accepted ADRs that govern the changed responsibility, including accepted common ADRs, and verify this design aligns with each recorded decision.

- [docs/adr/ADR-XXXX.md]: [Related decision items]
- Reference common technical ADRs when applicable

### Requirement Convergence

Records confirmed requirements and boundaries. Evaluation requests, speculative ideas, and unselected mechanisms remain only in pre-confirmation convergence context. Mark the first two bullets `N/A — covered by PRD [path]` when a PRD holds them, or the whole section `N/A — reverse-engineer/as-is document`. Open questions stay here in every case, because design readiness depends on them.

- **Outcome**: [one observable result this change must produce]
- **Non-Goals**: [capability the user excluded | None — user confirmed there are none]
- **Open questions**: [field the user agreed to leave unresolved | None]

### Standards and Assumptions

#### Applicable Standards
- [Standard/convention] `[explicit]` — Source: [config / rule file / doc path]
- [Observed pattern] `[implicit]` — Evidence: [file paths] — Confirmed: [Yes/No]

#### Assumed Behaviors
Behavioral or factual claims the design relies on but does not itself define — framework/library defaults, capabilities assumed already provided, features assumed already implemented — whose falsity would invalidate the design approach, and that are not already covered by the Fact Disposition Table or Cross-Layer Assumptions. Each claim carries evidence. Before verification, use `Confirmed: No` for a specific unresolved premise and state the exact evidence needed and its design effect. A premise that can change the Selected Design must be resolved before approval. After verification, `Confirmed: No` is valid only for residual implementation uncertainty whose possible outcomes leave the Selected Design valid; add a matching Risks and Mitigation row that restates the claim as its Risk, names how it will be verified or guarded, and propagates the check downstream as `verify at [step or artifact]`. For a framework/library default, pair the official documentation with the resolved package version from the lockfile or configuration. Mark the slot N/A when the design relies on no such claims.

- [ ] [Claim — e.g., "framework X defaults to Y", "service already returns Z"] — Evidence: [file:line / command output / doc URL paired with resolved package version / exact evidence needed] — Design effect: [what changes if false | Selected Design remains valid] — Confirmed: [Yes/No]

#### Bounded Self-Verification Evidence (when applied)

Include only when a fresh review-triggered update executed a capability probe. Keep the durable record compact; raw logs and temporary artifacts are discarded during probe cleanup.

| Applied finding | Premise | Method and observed boundary | Observation | Limitation | Design effect |
|---|---|---|---|---|---|
| [finding ID] | [exact premise] | [bounded method and consumer-visible postcondition] | [observed result] | [remaining limitation that constrains the design effect, or None] | [Selected Design change or confirmation] |

#### Quality Assurance Mechanisms
How quality is enforced in the change area. Each item is either adopted (will be enforced during implementation) or noted (observed but not adopted, with reason).

- [ ] [Tool/check name] — Enforces: [what] — Config: [path] — Covers: [literal file paths or directory prefixes, or "project-wide"] — Type: `executable_check` — Status: `adopted` / `noted (reason)`
- [ ] [Domain-specific constraint] — Enforces: [what] — Source: [path] — Covers: [literal file paths or directory prefixes, or "project-wide"] — Type: `passive_constraint` — Status: `adopted` / `noted (reason)`

### Problem to Solve

[Specific problems or challenges this feature aims to address]

### Current Challenges

[Current system issues or limitations]

### Requirements

#### Functional Requirements

- [List mandatory functional requirements]

#### Non-Functional Requirements

- **Performance**: [Response time, throughput requirements]
- **Scalability**: [Requirements for handling increased load]
- **Reliability**: [Error rate, availability requirements]
- **Maintainability**: [Code readability and changeability]

## Acceptance Criteria (AC) - EARS Format

Each AC is written in EARS format. Keywords determine test type.

Keep the smallest representative set of observable behaviors that has a stable repository-verifiable pass/fail condition. Use repository-controlled contract/interface proof instead of a live external connection unless the confirmed requirement needs that boundary. Include a performance threshold only with a sourced target and reproducible benchmark, and exact visual positioning only with an approved visual contract and deterministic comparison. Implementation details remain outside ACs.

### [Functional Requirement]

- [ ] **When** [trigger], the system shall [observable response with pass/fail threshold]
- [ ] **If** [exception condition], **then** the system shall [observable exception behavior]
- [ ] **While** [state], the system shall [invariant]
- [ ] [Ubiquitous requirement stated as an observable system behavior]
  - **Property**: `[invariant expression, only when property-based verification is warranted]`

## Existing Codebase Analysis

### Implementation Path Mapping
| Type | Path | Description |
|------|------|-------------|
| Existing | src/[actual-path] | [Current implementation] |
| New | src/[planned-path] | [Planned new creation] |

### Integration Points (Include even for new implementations)
- **Integration Target**: [What to connect with]
- **Invocation Method**: [How it will be invoked]

### Code Inspection Evidence
- [path:function] — [relevance: similar functionality / integration point / pattern reference]

### Fact Disposition Table

One row per codebase analysis `focusAreas` entry. This table binds structural existing-behavior facts to the design; other sections referencing existing behavior cite the row by `fact_id`.

| Fact ID | Focus Area | Disposition | Rationale | Evidence | Related Files |
|---------|------------|-------------|-----------|----------|---------------|
| [fact_id from focusAreas] | [area name from focusAreas] | preserve / transform / remove / out-of-scope | [per disposition — preserve: confirmation-only ("retained without modification"); transform: new observable outcome ("now returns 404 instead of 410"); remove: reason + PRD/UI Spec citation when policy-driven; out-of-scope: cite the scope-defining section] | [evidence value carried verbatim from focusAreas] | [comma-separated path list carried verbatim from focusAreas.relatedFiles, e.g., `src/auth/createUser.ts, src/api/routes/users.ts`] |

### Cross-Layer Assumptions (cross-layer flow only)

When this Design Doc depends on unverified claims from a prior-layer Design Doc (see Prior-Layer Verification), list each with justification and downstream verification target:

- [claim]: [justification]; verify at [step or artifact]

## Design

### Change Impact Map

```yaml
Change Target: [Component/feature to change]
Direct Impact:
  - [Files/functions requiring direct changes]
  - [Interface change points]
Indirect Impact:
  - [Data format changes]
  - [Processing time changes]
No Ripple Effect:
  - [Explicitly specify unaffected features]
```

### Interface Change Matrix

| Existing | New | Conversion Required | Compatibility Method |
|----------|-----|--------------------|--------------------|
| [Function/method/operation name] | [Function/method/operation name] | [Yes/No] | [Approach: adapter, wrapper, deprecation, etc.] |

### Architecture Overview

[How this feature is positioned within the overall system]

Add an architecture or data-flow Mermaid diagram only when the changed relationships remain unclear in prose or a compact table.

### Data Flow

```
[Express data flow using diagrams or pseudo-code]
```

### Integration Points List

| Integration Point | Location | Old Implementation | New Implementation | Switching Method | Verification Method |
|-------------------|----------|-------------------|-------------------|------------------|-------------------|
| Integration Point 1 | [Class/Function] | [Existing Process] | [New Process] | [DI/Factory etc.] | [How to verify this switching works] |
| Integration Point 2 | [Another Location] | [Existing] | [New] | [Method] | [Verification approach] |

### Main Components

#### Component 1

- **Responsibility**: [Scope of responsibility for this component]
- **Interface**: [APIs and type definitions provided]
- **Dependencies**: [Relationships with other components]

#### Component 2

- **Responsibility**: [Scope of responsibility for this component]
- **Interface**: [APIs and type definitions provided]
- **Dependencies**: [Relationships with other components]

### Selected Design

Describe the complete selected end-to-end path. Candidate paths and rejected additions remain active analysis; an accepted ADR may retain alternatives as decision history. Mark this whole section `N/A — reverse-engineer/as-is document` for a reverse-engineer/as-is document.

[Selected responsibilities, control/data flow, and use of existing system capabilities]

For each added design surface—user decision, setting, mode, concept, output, persistent state, implementation path, public contract, abstraction, service, or component split—record:

- **Addition**: [selected design surface]
- **Current evidence**: [requirement, accepted decision, verified constraint, observed problem, or evidence-backed material risk]
- **Lower-surface insufficiency**: [why reuse, derivation, on-demand computation, or current-boundary ownership does not satisfy the same condition]
- **Subtraction result**: [confirmed outcome, required boundary, or proof that becomes unmet when removed]

Use `None — existing design surface is sufficient` when the selected design adds none of these surfaces.

### Data Representation Decision (When the Converged Design Introduces or Modifies Structures)
Evaluate existing structures: semantic fit, responsibility fit, lifecycle fit, boundary/interop cost.
- All fit → reuse existing
- 1-2 fail → extend with adapter
- 3+ fail → new structure justified

**Decision**: [reuse / extend / new] — [rationale]

### Type Definitions

```typescript
// Record types that cross module, process, persistence, or public API boundaries
```

### Data Contract

When a UI Spec states that a surface displays a value, the contract feeding that surface carries it. A field set that cannot render a specified display is incomplete, not a simplification.

#### Component 1

```yaml
Input:
  Type: [TypeScript type definition]
  Preconditions: [Required items, format constraints]
  Validation: [Validation method]

Output:
  Type: [TypeScript type definition]
  Guarantees: [Conditions that must always be met]
  On Error: [Exception/null/default value]

Invariants:
  - [Conditions that remain unchanged before and after processing]
```

### Field Propagation Map (When Fields Cross Boundaries)

A boundary includes a **serialized boundary** — a value encoded on one side and parsed on the other (query string, CLI argument, environment variable, config entry, message/queue payload, storage key, or file), not only in-memory crossings. For a serialized row, append the **Serialized Format** (`Serialized: [exact representation the producer emits]`) and the **Consumer Parse Rule** (`Parse: [how the consumer decodes/validates it]`) so producer and consumer agree; omit that suffix for in-memory crossings.

- [field]: [ComponentA → B] — preserved / transformed / dropped — [reason]
- [field]: [ComponentA → B] — transformed — Serialized: [exact representation]; Parse: [decode/validate rule] — [reason] (serialized boundary)

### State Transitions and Invariants

[If the feature involves state management, describe state transitions and invariants here]

```
[State A] ---(event 1)---> [State B]
[State B] ---(event 2)---> [State C]
```

**Invariants**:
- [Condition that must always hold true]
- [Constraints on valid state transitions]

### UI Error State Design (when feature includes frontend)

| Component / Screen | Loading | Empty | Error | Partial |
|-------------------|---------|-------|-------|---------|
| [Component name] | [Skeleton / spinner] | [Empty state + CTA] | [Error message + Retry] | [Cached display + Banner] |

### Client State Design (when feature includes frontend)

| State Category | State | Management Method | Sync Strategy | Reset/Clear Behavior |
|---------------|-------|-------------------|---------------|----------------------|
| Server state | [Fetched data] | [Cache library / custom hook] | [Polling / WebSocket / manual refresh] | [Cleared on clear-all / preserved] |
| Local UI state | [Modal open, tab selection] | [useState / useReducer] | - | [Reset to default / preserved] |
| Temporary state | [Form input, draft] | [useState / form library] | [Auto-save / manual save] | [Cleared on reset / persisted] |

Fill the Reset/Clear Behavior column when the feature has a reset or clear-all operation. A state that must return to its unused/default value on reset is a state-lifecycle negative contract (the state stays unused/default after reset; Contract Type `state-lifecycle-negative`) — record it so it is verified rather than assumed.

### UI Action - API Contract Mapping (when feature includes frontend)

| UI Action | API Endpoint | Request | Response | Error Contract |
|-----------|-------------|---------|----------|----------------|
| [Button click / form submit] | [POST /api/xxx] | [Request body fields] | [Response fields] | [Error codes and UI handling] |

### Error Handling

| Error Category | Example | Detection | Recovery Strategy | User Impact |
|---------------|---------|-----------|-------------------|-------------|
| [Validation / External / Infrastructure / Business logic] | [Specific error] | [How detected] | [Retry / Fallback / Propagate / Log-and-continue] | [User-facing message or silent handling] |

### Logging and Monitoring

- **Log events**: [Key events to log: state transitions, external calls, error occurrences, performance thresholds]
- **Log levels**: [Which events at DEBUG/INFO/WARN/ERROR]
- **Sensitive data**: [Fields to mask or exclude — coordinate with Security Considerations]
- **Monitoring**: [Metrics to track, alert thresholds, dashboard requirements]

## Implementation Plan

### Implementation Approach

**Selected Approach**: [Approach name or combination]
**Selection Reason**: [Reason considering project constraints and technical dependencies]

### Technical Dependencies and Implementation Order

#### Required Implementation Order
1. **[Component/Feature A]**
   - Technical Reason: [Why this needs to be implemented first]
   - Dependent Elements: [Other components that depend on this]

2. **[Component/Feature B]**
   - Technical Reason: [Technical necessity to implement after A]
   - Prerequisites: [Required pre-implementations]

### Migration Strategy

[Technical migration approach, ensuring backward compatibility]

## Security Considerations

Evaluate the following for this feature's trust boundaries and data flow:

- **Authentication & Authorization**: What authentication is required for new entry points? What authorization checks protect resource access?
- **Input Validation**: Where does external input enter the system? How is it validated before processing?
- **Sensitive Data Handling**: What data requires protection (encryption, masking, access control)? What data is safe to include in logs and error responses?

Mark items as N/A with brief rationale when the feature has no relevant trust boundary.

## Test Boundaries

### Mock Boundary Decisions

| Component/Dependency | Mock? | Rationale |
|---------------------|-------|-----------|
| [External API / DB / File system / etc.] | [Yes/No] | [Why this boundary was chosen] |

### Data Layer Testing Strategy

- **Schema dependencies**: [List tables/models this feature reads from or writes to, with paths to their definitions]
- **Test data approach**: [How test data is provided — fixtures, factories, seed scripts, or real database]
- **Mock limitations acknowledged**: [What cannot be reliably tested with mocks alone for this feature]

Mark as N/A with brief rationale when the feature has no data layer dependencies.

### Integration Verification Points

- [List critical integration points that require testing beyond unit-level mocks]

## Verification Strategy

Verification Strategy defines what correctness means and how to prove it at design time. L1/L2/L3 (verification granularity tiers) define completion verification granularity at task execution time.

### Correctness Proof Method

How will this change's correctness be demonstrated?

- **Correctness definition**: [What "correct" means for this change — e.g., "output matches existing behavior", "all ACs pass in production-equivalent environment", "generated queries execute without error on target DB"]
- **Verification method**: [Specific technique — e.g., "compare new implementation output against existing implementation", "run against staging DB", "contract test with real API"]
- **Verification timing**: [When verification occurs — e.g., "after first vertical slice", "per repository", "at integration phase"]

### Early Verification Point

What is verified first, and how, to confirm the approach is correct before scaling?

- **First verification target**: [The smallest unit that proves the approach works — e.g., "first repository migration", "single API endpoint", "one screen flow"]
- **Success criteria**: [Observable outcome — e.g., "CSV download produces identical output to legacy", "API returns 200 with expected schema"]
- **Failure response**: [What to do if early verification fails — e.g., "reassess approach before proceeding", "escalate to user"]

### Output Comparison (When Replacing or Modifying Existing Behavior)

How will behavioral equivalence be verified between existing and new implementation?

- **Comparison input**: [Identical input used for both implementations — e.g., "same DB snapshot", "same API request payload"]
- **Expected output fields**: [Specific fields/columns to compare — e.g., "all output columns", "response body fields: id, status, amount"]
- **Diff method**: [How to compare — e.g., "file-level diff", "JSON field-by-field comparison", "row count + spot check"]
- **Transformation pipeline coverage**: [Each step from codebase analysis `dataTransformationPipelines` and what the comparison covers]

Mark as N/A with brief rationale when the design introduces entirely new behavior with no existing equivalent.

## Design Boundaries

Record boundaries needed by a current requirement, implementation, or verification. This section contains selected design boundaries rather than discovered candidates or unselected future possibilities.

- **Intentional limitations**: [Current behavior or responsibility deliberately kept outside the selected design, with the governing scope reason]
- **Existing extension points used**: [Interfaces or hooks the selected design uses, with each named current consumer | None]

## Risks and Mitigation

Include only evidenced residual risks that can change rollout, rollback, contract handling, or verification strategy while leaving the Selected Design valid.

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| [Risk 1] | High/Medium/Low | High/Medium/Low | [Countermeasure] |

## References

- [Related documentation and links]

## Update History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| YYYY-MM-DD | 1.0 | Initial version | [Name] |
