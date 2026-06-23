# Work Plan: [Title]

Created Date: YYYY-MM-DD
Type: feature|fix|refactor
Estimated Impact: X files
Related Issue/PR: #XXX (if any)
Review Scope: [planned-files scope derived from Design Doc and task targets; for a revision plan over existing work, base branch + diff range]

## Related Documents
- Design Doc(s):
  - [docs/design/XXX.md]
  - [docs/design/YYY.md] (if multiple, e.g. backend + frontend)
- ADR: [docs/adr/ADR-XXXX.md] (if any)
- PRD: [docs/prd/XXX.md] (if any)

## Verification Strategy (from Design Doc)

### Correctness Proof Method
- **Correctness definition**: [extracted from Design Doc]
- **Verification method**: [extracted from Design Doc]
- **Verification timing**: [extracted from Design Doc]

### Early Verification Point
- **First verification target**: [extracted from Design Doc]
- **Success criteria**: [extracted from Design Doc]
- **Failure response**: [extracted from Design Doc]

### Proof Strategy
- **Proof obligation source**: [test skeleton annotations (primary failure mode, proof obligation) when skeletons exist; otherwise each AC's primary failure mode; plus any applicable Failure Mode Checklist categories mapped to tasks]
- **Per-task propagation**: every task that implements a claim or covers an applicable Failure Mode Checklist category records Proof Obligations (see task template) so downstream review can judge whether the tests prove the claim, not merely run

## Quality Assurance Mechanisms (from Design Doc)

Adopted quality gates for the change area. Each task in this plan must satisfy these mechanisms.

| Mechanism | Enforces | Config/Source | Covered Files | Type |
|-----------|----------|---------------|---------------|------|
| [Tool/check name] | [What quality aspect it enforces] | [path/to/config] | [literal file paths or directory prefixes, or "project-wide"] | executable_check |
| [Domain constraint] | [What it enforces] | [path/to/source] | [literal file paths or directory prefixes, or "project-wide"] | passive_constraint |

## Design-to-Plan Traceability

Maps each Design Doc technical requirement to the covering task(s). One row per extracted item. Every row must have at least one covering task, or an explicit gap justification.

| Design Doc | DD Section | DD Item | Category | Covered By Task(s) | Gap Status | Notes |
|---|---|---|---|---|---|---|
| [docs/design/XXX.md — one of the Related Documents above] | [Section name from DD] | [Specific item] | impl-target / connection-switching / contract-change / verification / prerequisite | [Phase X Task Y] | covered | |
| docs/design/XXX.md | Security Considerations | Input validation for API | prerequisite | — | gap | Deferred to Phase 2 per user decision |

**Category values**: `impl-target` (implementation target), `connection-switching` (connection/switching/registration), `contract-change` (contract change and propagation), `verification` (verification requirement), `prerequisite` (prerequisite work)

**Gap Status values**: `covered` (task exists), `gap` (no task — requires justification in Notes, user confirmation required before plan approval)

## Reference Contract Values

Include this section when the Design Doc specifies a **binding observable value** the implementation must reproduce exactly — extract these from the Design Doc directly, not from the Traceability table's summarized DD Item: a column/label set and order, a derived-display rule (display value derived from another field), or a state-lifecycle negative (the condition under which the state must stay unused). The Traceability table records *that* a row is covered; this table carries the value *verbatim* so the covering task is checked against the exact contract rather than a re-derived summary. Serialized boundaries are owned by the Connection Map below; ADR-derived structural decisions by ADR Bindings. Omit the section when none apply.

| Design Doc (§ Section) | Contract Type | Required Observable Value (verbatim) | Covered By Task(s) |
|---|---|---|---|
| [docs/design/XXX.md (§ Section)] | structure-order / derived-display / state-lifecycle-negative | [the exact value copied from the Design Doc — e.g., "the listed fields in the specified order"; "the label shows the looked-up name in place of the raw code"; "the persisted state is applied only when an explicit restore signal is present"] | [Phase X Task Y] |

## Failure Mode Checklist

Domain-independent failure categories this implementation must guard against. Enumerate all nine categories, mark each in the Applies? column as yes/no, and list a covering task for each that applies; keep entries free of project-specific names.

| Category | Applies? | Covered By Task(s) |
|---|---|---|
| same-value | yes/no | [Phase X Task Y] |
| no-op | yes/no | |
| empty input | yes/no | |
| invalid option | yes/no | |
| missing config | yes/no | |
| unavailable boundary | yes/no | |
| shared-state dependency | yes/no | |
| rollback-only visibility | yes/no | |
| missing-sort-key ordering | yes/no | |

## UI Spec Component → Task Mapping

Include this section when a UI Spec is among the inputs. Maps each component documented in the UI Spec to the task(s) that implement it. This table is read in a downstream step to populate each task's Investigation Targets with the corresponding UI Spec section. Omit the section when no UI Spec exists.

| UI Spec Component (section heading) | States to Cover | Covered By Task(s) | Gap Status | Notes |
|---|---|---|---|---|
| [Use the UI Spec heading exactly as written, e.g., "§ Component: AlertCard"] | [default / loading / empty / error / partial — list the states the implementation must produce] | [Phase X Task Y] | covered | |

**Reference key rule**: The component identifier in column 1 is the UI Spec section heading (verbatim). Component headings are unique, so this reference resolves to exactly one section.

**Gap Status values**: `covered` (task exists), `gap` (no task — requires justification in Notes, user confirmation required before plan approval)

## ADR Bindings

Include this section when ADRs are provided as input or listed in the Design Doc's "Prerequisite ADRs" section. Maps each implementation-binding ADR decision to the task(s) it constrains. Omit the section when no ADR applies.

A decision is **implementation-binding** when it constrains code placement, dependency direction, contract/schema shape, data flow, or persistence. Acceptance criteria and required behaviors are recorded in the Design Doc; this table covers only structural constraints from ADRs.

| ADR | Source Section | Axis | Binding Decision | Covered By Task(s) |
|---|---|---|---|---|
| [docs/adr/ADR-XXXX.md] | Decision / Implementation Guidance | placement \| dependency_direction \| contract_schema \| data_flow \| persistence | [One implementation-binding decision sentence, copied or condensed from the named section] | [Phase X Task Y] |

One row per binding decision. A single ADR can contribute multiple rows. A single task can appear in multiple rows.

## Connection Map

Include this section when the implementation crosses a package, service, or process boundary, **or when a value is serialized and re-parsed across a boundary even within a single runtime** — through a medium such as a query string, route/CLI argument, environment variable, config entry, message/queue payload, storage key, or file (producer and consumer must agree on the exact representation). Document each boundary so boundary context propagates to the implementation tasks on each side in a downstream step. Record each Owner as concrete file path(s), not a bare module/package/component name, so it resolves as an Investigation Target the executor can read. Omit the section when no such boundary exists.

For a serialized boundary, fill Serialized Format and Consumer Parse Rule. Set both to "—" when the contract is already captured by the Expected Signal (e.g., a cross-process call whose body matches the agreed schema); fill them when producer and consumer must agree on a specific encoding of a value (query string, storage key, CLI argument, config entry, message field).

| Boundary | Owner (left side) | Owner (right side) | Serialized Format | Consumer Parse Rule | Expected Signal | Covered By Task(s) |
|---|---|---|---|---|---|---|
| [producing side → consuming side] | [owner on the producing side — concrete file path(s)] | [owner on the consuming side — concrete file path(s)] | [exact representation the producer emits; "—" if not serialized] | [how the consumer decodes/validates it; "—" if not serialized] | [Observable evidence the boundary works — e.g., a response matching the agreed contract, or the consumer reproducing the producer's values] | [Phase X Task Y on each side] |

## Objective
[Why this change is necessary, what problem it solves]

## Impact Scope
### Target Files
- [ ] src/domain/xxx
- [ ] src/application/xxx
- [ ] src/infrastructure/xxx
- [ ] src/presentation/xxx

### Test Files
- [ ] __tests__/xxx.test.ts
- [ ] __tests__/xxx.test.ts

### Documentation
- [ ] ADR creation needed (for architecture changes)
- [ ] Design Doc update needed
- [ ] README update needed

## Implementation Phases

Select ONE phase structure based on implementation approach from Design Doc.
See documentation-criteria skill for detailed Phase Division Criteria.
All quality checks follow the project's standard Quality Check Workflow.
**Delete the unused Option entirely from the final plan.** For hybrid approach, use Option C.

### Option A: Vertical Slice Phase Structure

Use when implementation approach is Vertical Slice. Each phase = one value unit with verification.

#### Phase 1: [Value Unit 1 Name] (Estimated commits: X)
**Purpose**: [First vertical slice — proves approach works]
**Verification**: [From Verification Strategy: early verification point]

##### Tasks
- [ ] Task 1: Implementation
- [ ] Task 2: Verification per Verification Strategy
- [ ] Quality check (staged)

##### Phase Completion Criteria
- [ ] Early verification point passed
- [ ] [Functional criteria]

#### Phase 2: [Value Unit 2 Name] (Estimated commits: X)
**Purpose**: [Subsequent value unit]
**Verification**: [From Verification Strategy]

##### Tasks
- [ ] Task 1: Implementation
- [ ] Task 2: Verification per Verification Strategy
- [ ] Quality check

##### Phase Completion Criteria
- [ ] [Functional criteria]
- [ ] [Quality criteria]

### Option B: Horizontal Slice Phase Structure

Use when implementation approach is Horizontal Slice. Phases follow Foundation → Core → Integration → QA.

#### Phase 1: [Foundation] (Estimated commits: X)
**Purpose**: Contract definitions, interfaces, test preparation

##### Tasks
- [ ] Task 1: Specific work content
- [ ] Task 2: Specific work content
- [ ] Quality check (staged)
- [ ] Unit tests: All related tests pass

##### Phase Completion Criteria
- [ ] [Functional completion criteria]
- [ ] [Quality completion criteria]

#### Phase 2: [Core Feature] (Estimated commits: X)
**Purpose**: Business logic, unit tests

##### Tasks
- [ ] Task 1: Specific work content
- [ ] Task 2: Specific work content
- [ ] Quality check (staged)
- [ ] Integration tests: Verify overall feature functionality

##### Phase Completion Criteria
- [ ] [Functional completion criteria]
- [ ] [Quality completion criteria]

#### Phase 3: [Integration] (Estimated commits: X)
**Purpose**: External connections, presentation layer

##### Tasks
- [ ] Task 1: Specific work content
- [ ] Task 2: Specific work content
- [ ] Quality check (staged)
- [ ] Integration tests: Verify component coordination

##### Phase Completion Criteria
- [ ] [Functional completion criteria]
- [ ] [Quality completion criteria]

### Option C: Hybrid Phase Structure

Use when implementation approach is Hybrid. Combine vertical and horizontal phases as defined in Design Doc implementation approach. Structure phases per Design Doc specification, ensuring each phase has Tasks, Verification, and Phase Completion Criteria sections matching the format above.

### Final Phase: Quality Assurance (Required) (Estimated commits: 1)

This phase is required for ALL implementation approaches.

**Purpose**: Cross-cutting quality assurance and Design Doc consistency verification

#### Tasks
- [ ] Verify all Design Doc acceptance criteria achieved
- [ ] Security review: Verify security considerations from Design Doc are implemented
- [ ] Quality checks (types, lint, format)
- [ ] Execute all tests (including integration/E2E from test skeletons, when provided)
- [ ] Coverage reviewed as a gap signal on critical paths (any enforced threshold per project CI config)
- [ ] Document updates

### Quality Assurance
- [ ] Quality check (staged)

## Risks and Countermeasures
| Risk | Countermeasure |
|------|----------------|
| [Expected risk] | [How to address it] |

## Completion Criteria
- [ ] All phases completed
- [ ] All integration/E2E tests passing (when test skeletons provided)
- [ ] Design Doc acceptance criteria satisfied
- [ ] Staged quality checks completed (zero errors)
- [ ] All tests pass
- [ ] Necessary documentation updated
- [ ] User review approval obtained

## Progress Tracking
### Phase 1
- Start: YYYY-MM-DD HH:MM
- Complete: YYYY-MM-DD HH:MM
- Notes: [Any special remarks]

### Phase 2
- Start: YYYY-MM-DD HH:MM
- Complete: YYYY-MM-DD HH:MM
- Notes: [Any special remarks]

## Notes
[Special notes, reference information, important points, etc.]
