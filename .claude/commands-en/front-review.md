---
description: Design Doc compliance and security validation with optional auto-fixes
---

Execute the `llm-friendly-context` skill (using Skill tool) before writing Agent prompts, handoffs, or generated artifacts.

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
- `prompt`: "Design Doc: [path]. Implementation files: [git diff file list]. Review security compliance."

**Store output as**: `$STEP_3_OUTPUT`

### Step 4: Verdict and Response

**If security-reviewer returned `blocked`**: Stop immediately. Report the blocked finding and escalate to user. Do not proceed to fix steps.

**Code review criteria**:
- `pass` → acceptable
- `needs-improvement` / `needs-redesign` → route the remaining findings below

**Security criteria**:
- `approved` or `approved_with_notes` → Pass
- `needs_revision` → Fail

**Report both results independently using subagent output fields only** (do not add fields that are not in the subagent response).

**Early exit (no findings to route)**: When code-reviewer's `verdict` is `pass` AND every entry in `acceptanceCriteria[]` has `status: "fulfilled"` AND `identifierMismatches[]` is empty AND `qualityFindings[]` is empty AND security-reviewer's `findings[]` is empty, skip Steps 5-9 and proceed directly to Step 10 — there is nothing to route. Present the clean result to the user.

Otherwise, before presenting to the user, the orchestrator computes a recommended route per finding using the rule below (this rule is internal — do not include it in the user-facing prompt). The rule keys off code-reviewer's existing structured fields only — interpretation of "DD intent" is intentionally avoided to prevent unstable inference:

| Finding source | Pattern detectable from existing fields | Recommended route |
|---------------|-----------------------------------------|-------------------|
| `acceptanceCriteria[]` with `status: "partially_fulfilled"` or `"unfulfilled"` | The cited `gap` indicates the code does not satisfy the AC — needs additional implementation | `c` (Code-side fix) |
| `acceptanceCriteria[]` with `status: "partially_fulfilled"` or `"unfulfilled"` | The cited `gap` indicates the AC text itself diverged from the implemented (and team-accepted) behavior — i.e., the DD's AC wording captured the wrong intent rather than the code missing requirements (verify by reading the AC and comparing against the cited `location`) | `d` (Design-side update — AC text outdated) |
| `identifierMismatches[]` | `codeValue` is a plausible rename of `designDocValue` (camelCase ↔ kebab-case ↔ snake_case, abbreviation expansion/contraction, semantic renaming where both names refer to the same concept) — verify by inspecting the cited `location` to confirm the code uses the new name consistently | `d` (Design-side update — DD likely outdated) |
| `identifierMismatches[]` | All other identifier mismatches (e.g., wrong type, wrong cardinality, missing entirely) | `c` (Code-side fix) |
| `qualityFindings[]` | All categories (`dd_violation`, `maintainability`, `reliability`, `coverage_gap`) | `c` (Code-side fix) |
| security-reviewer `findings[]` | All categories (`confirmed_risk`, `defense_gap`, `hardening`, `policy`) | `c` (Code-side fix) |

The user can override any recommendation per finding. AC items with `status: "fulfilled"` are not routed (no action needed).

Then present to the user (label each finding with its recommended route, grouped by route):

```
Code Review: [verdict from code-reviewer]
  Acceptance Criteria:
  - [fulfilled] [item] (confidence: [high/medium/low])
  - [partially_fulfilled] [item]: [gap] — [suggestion] [recommended: c | d]
  - [unfulfilled] [item]: [gap] — [suggestion] [recommended: c | d]
  Identifier Mismatches:
  - [identifier]: DD=[designDocValue] Code=[codeValue] at [location] [recommended: c | d]
  Quality Findings:
  - [category] [location]: [description] — [rationale] [recommended: c]

Security Review: [status from security-reviewer]
  Findings by category:
  - [confirmed_risk] [location]: [description] — [rationale] [recommended: c]
  - [defense_gap] [location]: [description] — [rationale] [recommended: c]
  - [hardening] [location]: [description] — [rationale] [recommended: c]
  - [policy] [location]: [description] — [rationale] [recommended: c]
  Notes: [notes from security-reviewer, if present]

Resolve discrepancies — confirm or override the recommended route per finding:
  c) Code-side fix       — code violates Design Doc; modify code to match
  d) Design-side update  — code is correct; Design Doc is stale, revise it
  s) Skip                — accept current state without changes
```

Use AskUserQuestion. The default offer is **"accept all recommended routes"** — a single confirmation for the typical case where the orchestrator's recommendations are correct. When the user wants to override, collect per-finding c/d/s decisions instead. If the user selects `s` for everything: skip Steps 5-9, proceed to Step 10.

The user's route decision is the finding's disposition under Review Resolution (the subagents-orchestration-guide skill's `references/review-resolution.md`): `c` and `d` are `apply` on the code side and the design side, `s` is `decline`. Record the route as the disposition and carry the reviewer's finding objects on unchanged.

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
- `prompt`: "Apply these approved code-side findings directly: [complete reviewer finding objects verbatim, with only their orchestrator dispositions added]. Keep the change within the approved routes and stated total size budget (stops at 5 files)."

### Step 7: Quality Check
Invoke quality-fixer-frontend using Agent tool:
- `subagent_type`: "quality-fixer-frontend"
- `description`: "Quality gate check"
- `prompt`: "Confirm quality gate passage for fixed files. filesModified: [extract from the prior implementation step's response]."

### Step 8: Re-validate code-reviewer

Invoke code-reviewer using Agent tool:
- `subagent_type`: "code-reviewer"
- `description`: "Re-validate compliance"
- `prompt`: "Re-validate Design Doc compliance after fixes. Design Doc: [path]. Implementation files: [file list]. prior_feedback: [{id, disposition, reason?, evidence}]. Reconcile every prior item under the reviewer's correction re-review scope."

### Step 9: Re-validate security-reviewer

Invoke security-reviewer using Agent tool (only if security fixes were applied):
- `subagent_type`: "security-reviewer"
- `description`: "Re-validate security"
- `prompt`: "Re-validate security after fixes. Design Doc: [path]. Implementation files: [file list]. prior_feedback: [{id, disposition, reason?, evidence}]. Reconcile every prior item under the reviewer's correction re-review scope."

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
  Notes: [notes from approved_with_notes, if any]

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
