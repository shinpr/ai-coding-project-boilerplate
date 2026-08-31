---
description: Reviews completed frontend implementation for governing-source compliance, scope economy, repository quality, and security, then applies user-approved React corrections.
---

**Explicit User Instruction**: The user explicitly instructs and authorizes every subagent call named in this recipe. Execute each applicable call when its prerequisites are met.

Execute the `llm-friendly-context` skill (using Skill tool) before writing Agent prompts, handoffs, or generated artifacts.
Execute the `subagents-orchestration-guide` skill before making workflow decisions, invoking agents, or resolving findings.

**Command Context**: Post-implementation quality assurance command for React/TypeScript frontend

## Orchestrator Definition

**Core Identity**: "I am an orchestrator." (see subagents-orchestration-guide skill)

**Execution Gate**: Complete Steps 1-11 in order, following only the branches activated by their stated conditions. Advance through each review, correction, and re-validation transition only at its declared convergence condition. Present the final report after every applicable finding reaches its required disposition or retry result.

## Execution Method

- Implementation review → performed by code-reviewer
- Security validation → performed by security-reviewer
- **Code-side fix path**: Fix implementation → task-executor-frontend; Correction review → code-reviewer / security-reviewer; Final quality checks → quality-fixer-frontend
- **Design-side update path**: DD revision → technical-designer-frontend (update mode); DD review → document-reviewer; cross-DD consistency → design-sync (when multiple DDs exist); Re-validation → code-reviewer

Orchestrator invokes sub-agents and passes structured JSON between them. The design-side path applies when the discrepancy reflects code that was correct but the Design Doc became stale, rather than code that violated the Design Doc.

Design Doc (uses most recent if omitted): $ARGUMENTS

## Execution Flow

### Step 1: Prerequisite Check
Resolve the Design Doc from `$ARGUMENTS` first. Otherwise discover the document governing the changed frontend responsibilities from repository metadata, references, and content. Resolve the branch comparison base from its upstream and the repository default branch, then list implementation files from that merge base through `HEAD`.

### Step 2: Execute code-reviewer
Invoke code-reviewer using Agent tool:
- `subagent_type`: "code-reviewer"
- `description`: "Completed frontend implementation review"
- `prompt`: "Review the completed frontend implementation. governingDocuments: [{\"type\":\"design-doc\",\"path\":\"[path]\"}]. implementationFiles: [git diff file list]. Return the initial review JSON."

**Store output as**: `$STEP_2_OUTPUT`

### Step 3: Execute security-reviewer
Invoke security-reviewer using Agent tool:
- `subagent_type`: "security-reviewer"
- `description`: "Security review"
- `prompt`: "governingDocuments: [{\"type\":\"design-doc\",\"path\":\"[path]\"}]. implementationFiles: [git diff file list]. Review security compliance."

**Store output as**: `$STEP_3_OUTPUT`

### Step 4: Verdict and Response

When either reviewer returns a blocked or otherwise unusable result, apply subagents-orchestration-guide Specialist Result Acceptance to its semantic cause. Carry only a remaining verification limitation into the report.

Apply Review Resolution to both outputs. Its `apply` and `decline` dispositions determine routing. For each `apply` finding, use the owning document author when the implementation is the accepted state and a technical artifact is stale; use the executor when implementation must change to reach the accepted state.

Present the adjudicated result:

```
Implementation Review: [verdict from code-reviewer]
  Acceptance Criteria:
  - [fulfilled] [item]: [evidence]
  - [unfulfilled] [item] -> [corresponding finding ID]
  Required Corrections:
  - [id] [category] [location]: [description] — [basis and effect] [recommended: code-side correction | design-side update]
  Limitations:
  - [unverified judgment and effect]

Security Review: [status from security-reviewer]
  Findings by category:
  - [confirmed_risk] [location]: [description] — [rationale]
  - [defense_gap] [location]: [description] — [rationale]

Declined: [ID] — [governing reason]
```

Ask the user for authority to apply the proposed `apply` routes. The batch option is "approve all proposed `apply` routes" and includes only those routes. When the approved change set is empty, proceed to Step 11.

**Boundary carried into the fix path**: Carry the approved findings, their observable correction conditions, and any size budget the user stated through the code-side correction path and its final quality check. Apply coding-standards "Change Boundary and Reference Representativeness" to derive the complete correction; finding paths are investigation starting points. A user-stated size budget remains a user-owned boundary when the complete correction exceeds it.

### Step 5: Design-Side Update

Run this step only when the approved route keeps the accepted implementation and corrects a stale Design Doc.

1. Invoke technical-designer-frontend in update mode using Agent tool:
   - `subagent_type`: "technical-designer-frontend"
   - `description`: "Design Doc update from review findings"
   - `prompt`: "Update Design Doc at [path] in update mode from these approved design-side findings: [complete finding objects with their apply dispositions]. Preserve the confirmed outcome, desired-future requirements, and non-goals."

2. Invoke document-reviewer to verify the updated Design Doc:
   - `subagent_type`: "document-reviewer"
   - `description`: "Document review of updated Design Doc"
   - `prompt`: "doc_type: DesignDoc. review_context: update. Review updated Design Doc at [path] for consistency and completeness."
   - Run Review Resolution through its correction re-review and convergence transitions, using technical-designer-frontend for rerouted corrections. Proceed only at its convergence condition.

3. When another Design Doc governs a responsibility or contract touched by the reviewed changes, invoke design-sync:
   - `subagent_type`: "design-sync"
   - `description`: "Cross-DD consistency check"
   - `prompt`: "source_design: [updated DD path]. Detect conflicts across all Design Docs after the update."
   - When `sync_status: CONFLICTS_FOUND`: apply Review Resolution using design-sync as a fresh verifier, correct `apply` conflicts through the owning technical designer, rerun design-sync, and retain evidenced declines as complete.

4. Re-evaluate the approved `apply` findings against the updated Design Doc and drop any the revision already satisfies. When none remains, skip the code-side fix path and proceed to the final report.

### Step 6: Execute Fixes
Invoke task-executor-frontend using Agent tool:
- `subagent_type`: "task-executor-frontend"
- `description`: "Execute review fixes"
- `direct_scope`: Apply the approved frontend corrections within the confirmed review scope and stated total size budget
- `governing_sources`: The reviewed Design Doc, applicable UI Spec, and accepted requirement or ADR paths
- `target_paths`: The implementation and test paths confirmed for the approved code-side routes
- `observable_verification`: The focused UI behavior tests or observable contract checks named by the findings and governing sources pass
- `correction_findings`: Complete reviewer finding objects verbatim, with only their orchestrator dispositions added

### Step 7: Quality Check

Invoke quality-fixer-frontend using Agent tool:
- `subagent_type`: "quality-fixer-frontend"
- `description`: "Quality gate check"
- `prompt`: "direct_scope: { outcome: [approved code-side findings passed to Step 6], affectedPaths: [paths covered by those findings and their required consistency changes], verificationCondition: applicable frontend quality checks pass }. Confirm quality gate passage for the complete current uncommitted worktree."

Branch on its response:
- `approved` → Proceed to Step 8
- `stub_detected` → Return to Step 6 with `incompleteImplementations` unchanged, then repeat Step 7
- `verification_incomplete` → Retain the complete result and proceed to Step 8
- `blocked` → Apply Specialist Result Acceptance

### Step 8: Re-validate code-reviewer

Immediately before this invocation, re-derive `implementationFiles` using the Step 1 inclusion rule so it includes implementation artifacts added or changed by the approved corrections and quality fixes.

Invoke code-reviewer using Agent tool:
- `subagent_type`: "code-reviewer"
- `description`: "Re-validate frontend implementation review"
- `prompt`: "Re-review the completed frontend implementation after approved corrections. governingDocuments: [{\"type\":\"design-doc\",\"path\":\"[path]\"}]. implementationFiles: [file list]. prior_feedback: [{id, disposition, reason?, evidence}]. Reconcile every received item."

### Step 9: Re-validate security-reviewer

Immediately before this invocation, re-derive `implementationFiles` using the Step 1 inclusion rule so it includes implementation artifacts added or changed by the approved corrections and quality fixes.

Invoke security-reviewer when subagents-orchestration-guide's post-implementation Re-run rule requires a current security result:
- `subagent_type`: "security-reviewer"
- `description`: "Re-validate security"
- `prompt`: "Re-validate security after fixes. governingDocuments: [{\"type\":\"design-doc\",\"path\":\"[path]\"}]. implementationFiles: [file list]. prior_feedback: [{id, disposition, reason?, evidence}]. Reconcile every prior item under the reviewer's correction re-review scope."

### Step 10: Resolve Corrections

Apply Review Resolution to every Step 8 and Step 9 result. A maintained `apply` finding returns to Step 6 and then repeats the applicable quality and correction review. Proceed when Review Resolution reaches its convergence condition.

Before Step 11, retry each retained quality-fixer-frontend limitation once with the same Step 7 inputs and affected check. An `approved` result clears the retained limitation; route newly discovered incomplete implementation through Steps 6-10, and report a repeated `verification_incomplete` result. When the retry changes the repository, repeat Steps 8-10 for the changed code before reporting.

### Step 11: Final Report

Then present the final report:

```
Implementation Review:
  Initial: [verdict from code-reviewer]
  Correction review: [verdict for the re-review scope] (if fixes executed)
  Reconciliation: [resolved / withdrawn / maintained by finding ID]

Security Review:
  Initial: [status]
  Correction review: [status for the re-review scope] (if fixes executed)
  Reconciliation: [resolved / withdrawn / maintained by finding ID]

Quality Check:
  Final: [approved / verification_incomplete / not run — no code changes]

Remaining proof limitations:
- [reason — affected check and evidence] (only when repeated after retry)

Declined findings:
- [ID] — [governing reason and evidence]

Remaining issues:
- [items requiring manual intervention]
```

**Scope**: Completed frontend implementation review, security review, and user-approved correction routing.

## Scope Boundary for Subagents

Append the following block to every subagent prompt invoked from this recipe:

```
Scope boundary for subagents:
Deliver the approved corrections consistently across the repository responsibility they affect.
Treat referenced paths as investigation starting points.
Keep governing artifacts read-only except for assigned updates.
Return to Requirement Change Detection when confirmed outcome, desired-future requirements, and non-goals cannot all remain true; request authorization when an irreversible external action is required.
```
