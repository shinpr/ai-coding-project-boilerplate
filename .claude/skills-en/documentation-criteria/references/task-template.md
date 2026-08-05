# Task: [Task Name]

Metadata:
- Source Work Plan Task: [P1-T1 — the stable ID of the Work Plan task this file materializes]
- Dependencies: none | [Work Plan task ID (docs/plans/tasks/{plan-name}-task-NN.md) -> Deliverable: path, when the prerequisite produces one]
- Executor lane: backend | frontend
- Rollback boundary: [copied unchanged from the Work Plan task]

A dependency names the prerequisite by its stable Work Plan task ID and the task file that carries it, because the file's `-task-{NN}` ordinal follows the task's position in the Work Plan rather than its ID.

A task file produced outside Work Plan materialization (integration-test add-on) sets `Source Work Plan Task: N/A — <what produced it>` and omits `Executor lane` when the producing flow already fixes the executor.

## Implementation Outcome

[The repository change that completes the source Work Plan task.]

## Governing Sources

Every directly constraining citation, preserved unchanged from the Work Plan so the executor reads the authoritative contract at its source.

- [Design Doc path (§ section); AC IDs]
- [UI Spec or ADR path (§ section), when directly constraining]

## Target Files

- [ ] [Implementation file or owner directory]
- [ ] [Test file, when the outcome requires one]

## Investigation Targets

The smallest representative set to read before implementation, each a file path with an optional search hint:

- [Governing document section — e.g., docs/design/payment.md (§ Payment Flow)]
- [Existing implementation — e.g., src/orders/checkout (processOrder function)]
- [Adjacent representative test]

## Decisions and Unresolved Items

(Include this section when task materialization resolved an alternative, optional behavior, or placeholder, or when a required decision is unresolved at materialization time. Omit when the task carries no such items.)

Resolved decisions — each alternative, optional behavior, or placeholder the materialization fixed to an explicit choice:

| Item | Decision | Source / Rule |
|---|---|---|
| [the alternative, optional behavior, or placeholder] | [the selected choice or the deterministic rule that selects it; for a placeholder, the exact temporary output, allowed dependencies, and verification expectation] | [Governing Sources entry, or the basis of the decision rule] |

Blocking unresolved items — decisions that cannot be made at materialization time and block execution. `Kind` determines whether the executor may settle the item or must stop:

- `implementation-detail` — only an internal construct is undecided (placement within the target files, local structure, naming, processing order). The observable behavior is already fixed by the Governing Sources.
- `requirement-decision` — an observable behavior, product rule, security posture, or compatibility guarantee is undecided. No in-scope option can settle it, because the question is what the system should do, not how to build it.

| Item | Kind | Required Input | Smallest In-Scope Option | Escalation Condition |
|---|---|---|---|---|
| [the unresolved decision] | implementation-detail / requirement-decision | [the input needed to resolve it] | [for `implementation-detail`: the smallest option inside this task's Target Files that satisfies the required outcome and every constraint in Governing Sources, or `none` when no in-scope option satisfies them all. For `requirement-decision`: `n/a — stop`] | [who or what to escalate to, and the point at which the executor must stop rather than guess] |

For an `implementation-detail` item, record the smallest in-scope option so the executor applies it instead of escalating the whole decision. For a `requirement-decision` item, the executor stops — recording a candidate here would invite it to settle a decision the requirements have not made.

## Investigation Notes

- [Record only facts that change implementation, scope, or verification.]

## Implementation Steps

1. Read the Investigation Targets and record the relevant repository facts.
2. Add or update the focused test required by the cited verification method.
3. Implement the smallest repository change that completes the outcome.
4. Refactor within the same outcome while focused checks stay green.
5. Run the Operation Verification Methods below.

## Operation Verification Methods

- **Verification method**: [Governing verification method or repository command]
- **Success criteria**: [Observable result tied to the cited ACs]
- **Verification level**: [L1: functional operation as an end-user feature / L2: new tests added and passing / L3: code builds without errors — per implementation-approach skill]

## Verification Focus

(Include this section only when the Work Plan supplies it.)

- **Primary failure**: [copied unchanged from the Work Plan]
- **Observable check**: [copied unchanged from the Work Plan]

## Completion Criteria

- [ ] The cited implementation outcome is complete
- [ ] The cited ACs are satisfied
- [ ] Required focused tests pass
- [ ] Operation verification succeeds
- [ ] (When Verification Focus exists) The Observable check detects the Primary failure
- [ ] (When Decisions and Unresolved Items exist) Every resolved decision is applied as recorded, and every blocking unresolved item is closed — an item still open halts execution and escalates per its Escalation Condition

## Notes

- [Execution-relevant information only]
