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
Resolve the Design Doc from `$ARGUMENTS` first. Otherwise discover the document governing the changed frontend responsibilities from repository metadata, references, and content. Resolve the branch comparison base from its upstream and the repository default branch, then list implementation files from that merge base through `HEAD`.

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

Apply Review Resolution to both outputs. Its dispositions determine what happens next: `apply` findings become code corrections, `user_decision_required` findings carry a decision only the user can make, `decline` findings are recorded with their reason. Each finding already names its code location, so no further routing classification is needed.

Present the adjudicated result:

```
Code Review: [verdict from code-reviewer]
  Acceptance Criteria:
  - [fulfilled] [item] (confidence: [high/medium/low])
  - [unfulfilled] [item]: [gap] — [suggestion]
  Identifier Mismatches:
  - [identifier]: DD=[designDocValue] Code=[codeValue] at [location]
  Quality Findings:
  - [category] [location]: [description] — [rationale]

Security Review: [status from security-reviewer]
  Findings by category:
  - [confirmed_risk] [location]: [description] — [rationale]
  - [defense_gap] [location]: [description] — [rationale]

Declined: [ID] — [governing reason]
```

Ask the user for two things only: authority to apply the proposed `apply` set, and a decision on each `user_decision_required` item. For a `user_decision_required` item the user may decide that the code is correct and the Design Doc is stale; those items go to Step 5. When no approved change remains, proceed to Step 10.

**Boundary carried into the fix path**: Pass the approved findings, their observable correction conditions, and any size budget the user stated to every agent invoked from Steps 5-9. Treat finding paths as investigation starting points. Before re-validation, map each diff hunk to a finding or to the same repository responsibility required to make that correction consistent. Keep a different independently executable outcome outside this fix. A user-stated size budget remains a user-owned boundary when the complete correction exceeds it.

### Step 5: Design-Side Update

Run this step only for `user_decision_required` items the user resolved by ratifying the current code in the design.

1. Invoke technical-designer-frontend in update mode using Agent tool:
   - `subagent_type`: "technical-designer-frontend"
   - `description`: "Design Doc update from review findings"
   - `prompt`: "Update Design Doc at [path] in update mode. The implementation has diverged in the following ways that the user decided to ratify in the design rather than in the code: [complete finding objects with the recorded user decision]. Reflect the current code behavior in the relevant sections and add a history entry."

2. Invoke document-reviewer to verify the updated Design Doc:
   - `subagent_type`: "document-reviewer"
   - `description`: "Document review of updated Design Doc"
   - `prompt`: "doc_type: DesignDoc. review_context: update. Review updated Design Doc at [path] for consistency and completeness."
   - Run Review Resolution through its correction re-review, escalation, and convergence transitions, using technical-designer-frontend for rerouted corrections. Proceed only at its convergence condition.

3. When another Design Doc governs a responsibility or contract touched by the reviewed changes, invoke design-sync:
   - `subagent_type`: "design-sync"
   - `description`: "Cross-DD consistency check"
   - `prompt`: "source_design: [updated DD path]. Detect conflicts across all Design Docs after the update."
   - When `sync_status: CONFLICTS_FOUND`: present conflicts to the user; resolution requires re-invoking technical-designer-frontend for affected DDs.

4. Re-evaluate the approved `apply` findings against the updated Design Doc and drop any the revision already satisfies. When none remains, skip Steps 6-7 and proceed to Step 8.

### Step 6: Execute Fixes
Invoke task-executor-frontend using Agent tool:
- `subagent_type`: "task-executor-frontend"
- `description`: "Execute review fixes"
- `prompt`: "Apply these approved code-side findings directly: [complete reviewer finding objects verbatim, with only their orchestrator dispositions added]. Deliver each observable correction consistently across its owning repository responsibility. Respect the stated total size budget."

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

**Scope**: Design Doc compliance validation, security review, code-side auto-fixes, and design-side updates the user ratifies.

## Scope Boundary for Subagents

Append the following block to every subagent prompt invoked from this recipe:

```
Scope boundary for subagents:
Operate within the task scope and referenced files in the prompt.
Use loaded skills to execute that scope.
Escalate when the required fix or investigation falls outside that scope.
```
