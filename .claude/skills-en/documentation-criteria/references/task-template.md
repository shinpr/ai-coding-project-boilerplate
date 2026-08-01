# Task: [Task Name]

Metadata:
- Source Work Plan Task: [Phase X Task Y — the stable ID of the work plan item this task materializes]
- Dependencies: Phase 1 Task 2 (docs/plans/tasks/{plan-name}-task-01.md) -> Deliverable: docs/plans/analysis/research-results.md
- Provides: docs/plans/analysis/api-spec.md (for research/design tasks)
- Implementation outcome: [Observable behavior, contract, migration, or downstream-consumable deliverable completed by this task]
- Rollback boundary: [Behavior, contract, migration, or persisted state reverted together in one commit]
- Executor lane: [backend | frontend]

A dependency names the prerequisite by its stable ID, the task file that carries it, and the deliverable path the executor reads — the executor resolves paths from this section, so the path stays alongside the ID.

A task file produced outside work-plan materialization — a review fix, a readiness preflight task, an integration-test add-on, or a small-scale task written directly — has no work plan item behind it. Set `Source Work Plan Task: N/A — <what produced it>` and fill the remaining fields from the task itself; omit `Executor lane` when the producing flow already fixes the executor.

## Implementation Content
[What this task will achieve]
*Reference dependency deliverables if applicable

## Target Files
- [ ] [Implementation file path]
- [ ] [Test file path]

## Investigation Targets
Files to read before starting implementation (file path, with optional search hint):
- [e.g., src/orders/checkout (processOrder function) — determined during task materialization based on task nature]

## Change Category
(Include this field only when the task is a bug fix, regression, state-change, or boundary-change — populated during task materialization. Omit otherwise.)

`Change Category: <one or more of bug-fix, regression, state-change, boundary-change — comma-separated>`

When present, the implementation sweeps the cases sharing the same path, contract, persisted state, or external boundary for the same class of defect (see Implementation Steps Red Phase).

## Binding Decisions
(Include this section when the work plan's ADR Bindings table covers this task. Omit otherwise.)

Each row is an ADR decision the implementation in this task must comply with.

| Source | Axis | Decision | Compliance Check |
|---|---|---|---|
| [docs/adr/ADR-XXXX.md (§ <Source Section>) — substitute the section name (`Decision` or `Implementation Guidance`) from the matching work plan row] | [Axis value copied verbatim from the work plan's ADR Bindings row] | [Binding decision copied from the work plan's ADR Bindings row] | [Y/N-answerable positive predicate that evaluates whether the planned/final implementation satisfies the decision] |

## Reference Contracts
(Include this section when the work plan's Reference Contract Values table covers this task. Omit otherwise.)

Each row is a DD-derived observable contract the implementation in this task must reproduce exactly. Serialized boundaries are carried by the Boundary Context (from the work plan's Connection Map); ADR-derived structural decisions by Binding Decisions above.

| Source | Contract Type | Required Observable Value | Compliance Check |
|---|---|---|---|
| [Design Doc path (§ Section) copied from the matching work plan Reference Contract Values row] | [structure-order / derived-display / state-lifecycle-negative, copied from the work plan row] | [Required Observable Value copied verbatim from the work plan row] | [Y/N-answerable positive predicate that evaluates whether the planned/final implementation reproduces the value] |

## First-Pass Risk Coverage
(Include this section when a work plan First-Pass Risk Coverage row lists this task's `Source Work Plan Task` in its Covered By Task(s) column. Copy the row verbatim, minus that column. Omit the section otherwise.)

| Operation | Reaching Routes | Safe Default On Incomplete Evidence | mutation | partial-evidence | retry | concurrency | identity | input-route |
|---|---|---|---|---|---|---|---|---|
| [copied from the plan row] | [copied] | [copied] | covered / n/a / blocked | | | | | |

Each disposition is a decision already made, and its value fixes how this task treats the hazard:

- `covered` — the hazard's prevention outcome is required here. Implement it and leave it verifiable; the matching Proof Obligation above is what downstream review checks it against, and its absence is the defect to find
- `n/a` — this hazard requires no dedicated implementation and no Proof Obligation of its own. Leave in place any safety that is already present, shared with a `covered` hazard, or obtained as a side effect of another requirement; review accepts it as-is
- `blocked` — no decision exists yet, so this row also appears in Decisions and Unresolved Items below with `Kind: requirement-decision`. Execution stops there rather than choosing a behavior

Whether a mechanism this task introduces is a justified addition is decided in Adopted Additions Correspondence against the Design Doc, not from this table.

## Decisions and Unresolved Items
(Include this section when task materialization resolved an alternative, optional behavior, or placeholder, or when a required decision is unresolved at materialization time. Omit when the task carries no such items.)

Resolved decisions — each alternative, optional behavior, or placeholder the materialization fixed to an explicit choice:

| Item | Decision | Source / Rule |
|---|---|---|
| [the alternative, optional behavior, or placeholder] | [the selected choice or the deterministic rule that selects it; for a placeholder, the exact temporary output, allowed dependencies, and verification expectation] | [work plan / Design Doc / UI Spec / ADR section, or the basis of the decision rule] |

Blocking unresolved items — decisions that cannot be made at materialization time and block execution. `Kind` determines whether the executor may settle the item or must stop:

- `implementation-detail` — only an internal construct is undecided (placement within the target files, local structure, naming, processing order). The observable behavior is already fixed by the requirements and the contracts above.
- `requirement-decision` — an observable behavior, product rule, security posture, or compatibility guarantee is undecided. No in-scope option can settle it, because the question is what the system should do, not how to build it.

| Item | Kind | Required Input | Smallest In-Scope Option | Escalation Condition |
|---|---|---|---|---|
| [the unresolved decision] | implementation-detail / requirement-decision | [the input needed to resolve it] | [for `implementation-detail`: the smallest option inside this task's Target Files that satisfies the required outcome and every Binding Decision and Reference Contract, or `none` when no in-scope option satisfies them all. For `requirement-decision`: `n/a — stop`] | [who or what to escalate to, and the point at which the executor must stop rather than guess] |

For an `implementation-detail` item, record the smallest in-scope option so the executor applies it instead of escalating the whole decision. For a `requirement-decision` item, the executor stops — recording a candidate here would invite it to settle a decision the requirements have not made.

## Investigation Notes
(Implementation observations are appended here before implementation begins. When Binding Decisions exist, record the planned implementation approach and each Compliance Check result here.)

## Implementation Steps (TDD: Red-Green-Refactor)
### 1. Red Phase
- [ ] Read all Investigation Targets and record key observations
- [ ] (When Change Category is set) Sweep the adjacent cases sharing the same path/contract/state/boundary for the same class of defect; fold any found within scope into the failing tests
- [ ] Review dependency deliverables (if any)
- [ ] Verify/create contract definitions
- [ ] Write failing tests
- [ ] Run tests and confirm failure

### 2. Green Phase
- [ ] Add minimal implementation to pass tests
- [ ] Run only added tests and confirm they pass

### 3. Refactor Phase
- [ ] Improve code (maintain passing tests)
- [ ] Confirm added tests still pass

## Quality Assurance Mechanisms
(From work plan header — mechanisms relevant to this task's target files)
- [Tool/check name] — Enforces: [what] — Config/Source: [path] — Type: `executable_check` | `passive_constraint`

## Operation Verification Methods
(Derived from Verification Strategy in work plan)
- **Verification method**: [What to verify and how — e.g., "compare new implementation output against existing implementation at src/legacy/order_calc", "run endpoint against test database and verify response matches contract"]
- **Success criteria**: [Observable outcome that proves correctness — e.g., "output matches existing implementation for all input combinations", "API returns 200 with expected schema"]
- **Failure response**: [What to do if verification fails — e.g., "reassess approach before proceeding", "escalate to user"]
- **Verification level**: [L1: Functional operation as end-user feature / L2: New tests added and passing / L3: Code builds without errors]

## Proof Obligations
(One entry per AC, claim, or applicable Failure Mode Checklist category this task covers. Derived from test skeleton annotations when present, otherwise from the AC's primary failure mode or the mapped Failure Mode category. Each test must prove its claim. Repeat the block below once per claim; the heading carries the AC ID, claim ID, or `Failure Mode: <category>` so downstream review can resolve coverage per claim.)

### Obligation: [AC ID, claim ID, or Failure Mode category — e.g., `Failure Mode: missing-sort-key ordering`]
- **Claim**: [the AC behavior, claim, or failure-mode condition this task must prove]
- **Primary failure mode**: [the regression the test turns red on]
- **Boundary to exercise**: [public/integration boundary the test traverses, or "in-process unit"]
- **State assertion**: [observable state before → action → after for state-changing claims; "N/A" otherwise]
- **Mock boundary rationale**: [which boundaries may be mocked and why; "none" when all real]
- **Residual**: [what this proof leaves unestablished, if any]

## Completion Criteria
- [ ] All added tests pass
- [ ] Operation verified per Operation Verification Methods above
- [ ] Each Proof Obligation is met: the test turns red under its primary failure mode and exercises the stated boundary
- [ ] Deliverables created (for research/design tasks)
- [ ] (When Binding Decisions exist) Every Compliance Check evaluates to `Y` against the final implementation, with evidence recorded in Investigation Notes (file:line, test result, or command output)
- [ ] (When Reference Contracts exist) Every Reference Contract Compliance Check evaluates to `Y` against the final implementation, with evidence recorded in Investigation Notes
- [ ] (When Decisions and Unresolved Items exist) Every resolved decision is applied as recorded, and no blocking unresolved item remains open — if one does, execution halts and is escalated per its Escalation Condition

## Notes
- Impact scope: [Areas where changes may propagate]
- Scope boundary: [Files to preserve unchanged — path and reason]
