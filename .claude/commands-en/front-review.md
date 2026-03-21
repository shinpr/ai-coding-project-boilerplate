---
description: Design Doc compliance and security validation with optional auto-fixes
---

**Command Context**: Post-implementation quality assurance command for React/TypeScript frontend

## Execution Method

- Compliance validation -> performed by code-reviewer
- Security validation -> performed by security-reviewer
- Rule analysis -> performed by rule-advisor
- Fix implementation -> performed by task-executor-frontend
- Quality checks -> performed by quality-fixer-frontend
- Re-validation -> performed by code-reviewer / security-reviewer

Orchestrator invokes sub-agents and passes structured JSON between them.

Design Doc (uses most recent if omitted): $ARGUMENTS

**Think deeply** Understand the essence of compliance validation and execute:

## Execution Flow

### 1. Prerequisite Check
```bash
# Identify Design Doc
ls docs/design/*.md | grep -v template | tail -1

# Check implementation files
git diff --name-only main...HEAD
```

### 2. Execute code-reviewer
Invoke code-reviewer using Agent tool:
- `subagent_type`: "code-reviewer"
- `description`: "Code compliance review"
- `prompt`: "Design Doc: [path]. Implementation files: [git diff file list]. Review mode: full. Validate Design Doc compliance and return structured JSON report with complianceRate, verdict, acceptanceCriteria, and qualityIssues."

**Store output as**: `$STEP_2_OUTPUT`

### 3. Execute security-reviewer
Invoke security-reviewer using Agent tool:
- `subagent_type`: "security-reviewer"
- `description`: "Security review"
- `prompt`: "Design Doc: [path]. Implementation files: [git diff file list]. Review security compliance."

**Store output as**: `$STEP_3_OUTPUT`

### 4. Verdict and Response

**If security-reviewer returned `blocked`**: Stop immediately. Report the blocked finding and escalate to user. Do not proceed to fix steps.

**Code compliance criteria (considering project stage)**:
- Prototype: Pass at 70%+
- Production: 90%+ recommended

**Security criteria**:
- `approved` or `approved_with_notes` → Pass
- `needs_revision` → Fail

**Report both results independently using subagent output fields only** (do not add fields that are not in the subagent response):

```
Code Compliance: [complianceRate from code-reviewer]
  Verdict: [verdict from code-reviewer]
  Acceptance Criteria:
  - [fulfilled] [item]
  - [partially_fulfilled] [item]: [gap] — [suggestion]
  - [unfulfilled] [item]: [gap] — [suggestion]

Security Review: [status from security-reviewer]
  Findings by category:
  - [confirmed_risk] [location]: [description] — [rationale]
  - [defense_gap] [location]: [description] — [rationale]
  - [hardening] [location]: [description] — [rationale]
  - [policy] [location]: [description] — [rationale]
  Notes: [notes from security-reviewer, if present]

Execute fixes? (y/n):
```

If both pass and user selects `n`: Skip fix steps, proceed to Final Report.

If user selects `y`:

## Pre-fix Metacognition

### 5. Execute rule-advisor
Invoke rule-advisor using Agent tool:
- `subagent_type`: "rule-advisor"
- `description`: "Analyze fix approach"
- `prompt`: "Task: Fix review findings. Code issues: $STEP_2_OUTPUT. Security findings: $STEP_3_OUTPUT. Analyze fix essence and select appropriate rules."

### 6. Create Task File
Register work steps using TaskCreate. Always include: first "Confirm skill constraints", final "Verify skill fidelity". Create task file following task template (see documentation-criteria skill) -> `docs/plans/tasks/review-fixes-YYYYMMDD.md`. Include both code compliance issues and security requiredFixes.

### 7. Execute Fixes
Invoke task-executor-frontend using Agent tool:
- `subagent_type`: "task-executor-frontend"
- `description`: "Execute review fixes"
- `prompt`: "Task file: docs/plans/tasks/review-fixes-YYYYMMDD.md. Apply staged fixes (stops at 5 files)."

### 8. Quality Check
Invoke quality-fixer-frontend using Agent tool:
- `subagent_type`: "quality-fixer-frontend"
- `description`: "Quality gate check"
- `prompt`: "Confirm quality gate passage for fixed files."

### 9. Re-validate code-reviewer
Invoke code-reviewer using Agent tool:
- `subagent_type`: "code-reviewer"
- `description`: "Re-validate compliance"
- `prompt`: "Re-validate Design Doc compliance after fixes. Prior issues: $STEP_2_OUTPUT. Design Doc: [path]. Implementation files: [file list]."

### 10. Re-validate security-reviewer (only if security fixes were applied)
Invoke security-reviewer using Agent tool:
- `subagent_type`: "security-reviewer"
- `description`: "Re-validate security"
- `prompt`: "Re-validate security after fixes. Prior findings: $STEP_3_OUTPUT. Design Doc: [path]. Implementation files: [file list]."

### Final Report
```
Code Compliance:
  Initial: [X]%
  Final: [Y]% (if fixes executed)

Security Review:
  Initial: [status]
  Final: [status] (if fixes executed)
  Notes: [notes from approved_with_notes, if any]

Remaining issues:
- [items requiring manual intervention]
```

## Auto-fixable Items
- Simple unimplemented acceptance criteria
- Error handling additions
- Contract definition fixes
- Function splitting (length/complexity improvements)
- Security confirmed_risk and defense_gap fixes (input validation, auth checks, output encoding)

## Non-fixable Items
- Fundamental business logic changes
- Architecture-level modifications
- Design Doc deficiencies
- Committed secrets (blocked → human intervention)

**Scope**: Design Doc compliance validation, security review, and auto-fixes.
