---
description: Design Doc compliance and security validation with optional auto-fixes
---

Execute the `llm-friendly-context` skill (using Skill tool) before writing Agent prompts, handoffs, or generated artifacts.
Execute the `subagents-orchestration-guide` skill before making workflow decisions, invoking agents, or resolving findings.

**Command Context**: Post-implementation quality assurance command for React/TypeScript frontend

## Orchestrator Definition

**Core Identity**: "I am an orchestrator." (see subagents-orchestration-guide skill)

**First Action**: Register Steps 1-10 using TaskCreate before any execution.

## Execution Method

- Compliance validation → performed by code-reviewer
- Security validation → performed by security-reviewer
- **Code-side fix path**: Fix implementation → task-executor-frontend; Quality checks → quality-fixer-frontend; Re-validation → code-reviewer / security-reviewer
- **Design-side update path**: DD revision → technical-designer-frontend (update mode); DD review → document-reviewer; cross-DD consistency → design-sync (when multiple DDs exist); Re-validation → code-reviewer

Orchestrator invokes sub-agents and passes structured JSON between them. The design-side path applies when the discrepancy reflects code that was correct but the Design Doc became stale, rather than code that violated the Design Doc.

Design Doc (uses most recent if omitted): $ARGUMENTS

## Execution Flow

### Step 1: Prerequisite Check
```bash
# Identify Design Doc
ls docs/design/*.md | grep -v template | tail -1

# Check implementation files
git diff --name-only main...HEAD
```

### Step 2: Execute code-reviewer
Invoke code-reviewer using Agent tool:
- `subagent_type`: "code-reviewer"
- `description`: "Code compliance review"
- `prompt`: "Design Doc: [path]. Implementation files: [git diff file list]. Review mode: full. Validate Design Doc compliance and return structured JSON report."

**Store output as**: `$STEP_2_OUTPUT`

### Step 3: Execute security-reviewer
Invoke security-reviewer using Agent tool:
- `subagent_type`: "security-reviewer"
- `description`: "Security review"
- `prompt`: "governingDocuments: [{\"type\":\"design-doc\",\"path\":\"[path]\"}]. implementationFiles: [git diff file list]. Review security compliance."

**Store output as**: `$STEP_3_OUTPUT`

### Step 4: Verdict and Response

**If security-reviewer returned `blocked`**: Stop at this gate, report the blocking reason and any returned finding, then escalate to the user.

Apply Review Resolution to both outputs before reporting or routing them. Finding dispositions determine routing. Ask the user only for `user_decision_required` items or for implementation authority after the proposed `apply` set is known.

For each `apply` or `user_decision_required` finding, compute a proposed route:

| Finding pattern | Recommended route |
|-----------------|-------------------|
| `dd_violation` where code matches the original requirement but the Design Doc captured a different design | `d` (Design-side update) |
| `dd_violation` where code drifted from a still-correct Design Doc | `c` (Code-side fix) |
| `reliability`, `security`, or `maintainability` finding | `c` (Code-side fix) |

Present the adjudicated result. Group `apply` and `user_decision_required` findings by proposed route and list declined IDs with reasons separately:

```
Code Review: [verdict from code-reviewer]
  Acceptance Criteria:
  - [fulfilled] [item] (confidence: [high/medium/low])
  - [unfulfilled] [item]: [gap] — [suggestion] [recommended: c | d]
  Identifier Mismatches:
  - [identifier]: DD=[designDocValue] Code=[codeValue] at [location] [recommended: c | d]
  Quality Findings:
  - [category] [location]: [description] — [rationale] [recommended: c]

Security Review: [status from security-reviewer]
  Findings by category:
  - [confirmed_risk] [location]: [description] — [rationale] [recommended: c]
  - [defense_gap] [location]: [description] — [rationale] [recommended: c]

Approve the proposed changes or decide unresolved items:
  c) Code-side fix       — code violates Design Doc; modify code to match
  d) Design-side update  — code is correct; Design Doc is stale, revise it
  s) Decline             — record the governing reason and accept current state
```

This review command authorizes analysis; obtain separate user authority before applying changes. The batch option is "approve all proposed `apply` routes". Collect an explicit decision for each `user_decision_required` item. When the approved change set is empty, proceed to Step 10.

**Scope carried into the fix path**: Pass the approved findings, their routes, the files and sections they cover, and any size budget the user stated to every agent invoked from Steps 5-9. Before re-validation, map each diff hunk to an approved finding or to a consistency update that finding required; request a scope decision for any unmapped hunk or for a diff that exceeds a stated budget, rather than accepting it as part of the fix.

### Step 5: Design-Side Update

Run this step only when the user routed at least one finding to `d`. When all routes are `c` or `s`, skip directly to Step 6.

1. Invoke technical-designer-frontend in update mode using Agent tool:
   - `subagent_type`: "technical-designer-frontend"
   - `description`: "Design Doc update from review findings"
   - `prompt`: "Update Design Doc at [path] in update mode. The implementation has diverged in the following ways that the team has decided to ratify in the design rather than in the code: [list of `d`-routed findings with codeLocation and designDocValue from $STEP_2_OUTPUT]. Reflect the current code behavior in the relevant sections and add a history entry."

2. Invoke document-reviewer to verify the updated Design Doc:
   - `subagent_type`: "document-reviewer"
   - `description`: "Document review of updated Design Doc"
   - `prompt`: "doc_type: DesignDoc. review_context: update. Review updated Design Doc at [path] for consistency and completeness."
   - Run Review Resolution through its correction re-review, escalation, and convergence transitions, using technical-designer-frontend for rerouted corrections. Proceed only at its convergence condition.

3. When multiple Design Docs exist (`ls docs/design/*.md | grep -v template | wc -l > 1`), invoke design-sync:
   - `subagent_type`: "design-sync"
   - `description`: "Cross-DD consistency check"
   - `prompt`: "source_design: [updated DD path]. Detect conflicts across all Design Docs after the update."
   - When `sync_status: CONFLICTS_FOUND`: present conflicts to the user; resolution requires re-invoking technical-designer-frontend for affected DDs.

4. After Step 5 completes:
   - If the user selected zero `c` routes (whether all `d`, all `s`, or a `d` + `s` mix with no `c`) → skip Steps 6-7, proceed to Step 8 for re-validation
   - If the user selected both `d` and `c` → re-evaluate the `c`-routed findings against the updated DD and drop any that are now satisfied by the DD revision; then proceed to Step 6 with the remaining `c` findings

### Step 6: Execute Fixes
Invoke task-executor-frontend using Agent tool:
- `subagent_type`: "task-executor-frontend"
- `description`: "Execute review fixes"
- `prompt`: "Apply these approved code-side findings directly: [complete reviewer finding objects verbatim, with only their orchestrator dispositions added]. Keep the change within the approved routes and stated total size budget."

### Step 7: Quality Check
Invoke quality-fixer-frontend using Agent tool:
- `subagent_type`: "quality-fixer-frontend"
- `description`: "Quality gate check"
- `prompt`: "direct_scope: { outcome: [approved code-side findings passed to Step 6], affectedPaths: [paths covered by those findings and their required consistency changes], verificationCondition: applicable project quality checks pass }. Confirm quality gate passage for the complete current uncommitted worktree."

### Step 8: Re-validate code-reviewer

Invoke code-reviewer using Agent tool:
- `subagent_type`: "code-reviewer"
- `description`: "Re-validate compliance"
- `prompt`: "Re-validate Design Doc compliance after fixes. Design Doc: [path]. Implementation files: [file list]. prior_feedback: [{id, disposition, reason?, evidence}]. Reconcile every prior item under the reviewer's correction re-review scope."

### Step 9: Re-validate security-reviewer

Invoke security-reviewer using Agent tool (only if security fixes were applied):
- `subagent_type`: "security-reviewer"
- `description`: "Re-validate security"
- `prompt`: "Re-validate security after fixes. governingDocuments: [{\"type\":\"design-doc\",\"path\":\"[path]\"}]. implementationFiles: [file list]. prior_feedback: [{id, disposition, reason?, evidence}]. Reconcile every prior item under the reviewer's correction re-review scope."

### Step 10: Final Report

Apply Review Resolution to every Step 8 and Step 9 result. Follow its `maintained` transitions, repeat the affected verification after a rerouted correction, stop at its escalation conditions, and proceed at its convergence condition.

Then present the final report:

```
Code Review:
  Initial: [verdict from code-reviewer]
  Correction review: [verdict for the re-review scope] (if fixes executed)
  Reconciliation: [resolved / withdrawn / maintained by finding ID]

Security Review:
  Initial: [status]
  Correction review: [status for the re-review scope] (if fixes executed)
  Reconciliation: [resolved / withdrawn / maintained by finding ID]
Declined findings:
- [ID] — [governing reason and evidence]

Remaining issues:
- [items requiring manual intervention]
```

## Auto-fixable Items (code-side path)
- Simple unimplemented acceptance criteria
- Error handling additions
- Contract definition fixes
- Function splitting (length/complexity improvements)
- Security confirmed_risk and defense_gap fixes (input validation, auth checks, output encoding)

## Non-fixable Items
- Fundamental business logic changes
- Architecture-level modifications
- Committed secrets (blocked → human intervention)

## Design-Side Update Triggers
Discrepancies suitable for the design-side path (code is correct, DD became stale):
- Identifier renames where the new identifier reflects the team's current naming
- Behavioral changes that match the original requirement intent better than what the DD captured
- Component splits or merges where the new structure is sound and the DD documented the prior structure
- New ACs that the implementation already satisfies but the DD never enumerated

**Scope**: Design Doc compliance validation, security review, code-side auto-fixes, and design-side update routing.

## Scope Boundary for Subagents

Append the following block to every subagent prompt invoked from this recipe:

```
Scope boundary for subagents:
Operate within the task scope and referenced files in the prompt.
Use loaded skills to execute that scope.
Escalate when the required fix or investigation falls outside that scope.
```
