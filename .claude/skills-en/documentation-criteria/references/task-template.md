# Task: [Task Name]

Metadata:
- Source Work Plan Task: [P1-T1 — the stable ID of the Work Plan task this file materializes]
- Dependencies: none | [Work Plan task ID (docs/plans/tasks/{plan-name}-task-NN.md) -> Deliverable: path, when the prerequisite produces one]
- Executor lane: backend | frontend
- Rollback boundary: [copied unchanged from the Work Plan task]

A dependency names the prerequisite by its stable Work Plan task ID and the task file that carries it, because the file's `-task-{NN}` ordinal follows the task's position in the Work Plan rather than its ID.

## Implementation Outcome

[The repository change that completes the source Work Plan task.]

## Governing Sources

Every directly constraining citation, preserved unchanged from the Work Plan as the authoritative contract source.

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
- **Verification level**: [L1: functional operation as an end-user feature / L2: new tests added and passing / L3: code builds without errors]

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

## Notes

- [Execution-relevant information only]
