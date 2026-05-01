---
description: Execute frontend implementation in autonomous execution mode
---

## Orchestrator Definition

**Core Identity**: "I am an orchestrator." (see subagents-orchestration-guide skill)

**Execution Protocol**:
1. **Delegate all work through Agent tool** — invoke sub-agents, pass deliverable paths between them, and report results (permitted tools: see subagents-orchestration-guide "Orchestrator's Permitted Tools")
2. **Follow the 4-step task cycle exactly**: task-executor-frontend → escalation check → quality-fixer-frontend → commit
3. **Enter autonomous mode** when user provides execution instruction with existing task files — this IS the batch approval
4. **Scope**: Complete when all tasks are committed or escalation occurs

**CRITICAL**: Run quality-fixer-frontend before every commit.

Work plan: $ARGUMENTS

## Pre-execution Prerequisites

### Task File Existence Check
```bash
# Check work plans
! ls -la docs/plans/*.md | grep -v template | tail -5

# Check task files
! ls docs/plans/tasks/*.md 2>/dev/null || echo "⚠️ No task files found"
```

### Task Generation Decision Flow

Analyze task file existence state and determine the action required:

| State | Criteria | Next Action |
|-------|----------|-------------|
| Tasks exist | .md files in tasks/ directory | User's execution instruction serves as batch approval → Enter autonomous execution immediately |
| No tasks + plan exists | Plan exists but no task files | Confirm with user → run task-decomposer |
| Neither exists + Design Doc exists | No plan or task files, but docs/design/*.md exists | Invoke work-planner to create work plan from Design Doc, then proceed to task decomposition |
| Neither exists | No plan, no task files, no Design Doc | Report missing prerequisites to user and stop |

## Task Decomposition Phase (Conditional)

When task files don't exist:

### 1. User Confirmation
```
No task files found.
Work plan: docs/plans/[plan-name].md

Generate tasks from the work plan? (y/n):
```

### 2. Task Decomposition (if approved)
Invoke task-decomposer using Agent tool:
- `subagent_type`: "task-decomposer"
- `description`: "Decompose work plan"
- `prompt`: "Read work plan at docs/plans/[plan-name].md and decompose into atomic tasks. Output: Individual task files in docs/plans/tasks/. Granularity: 1 task = 1 commit = independently executable"

### 3. Verify Generation
```bash
# Verify generated task files
! ls -la docs/plans/tasks/*.md | head -10
```

**Flow**: Task generation → Autonomous execution (in this order)

## Pre-execution Checklist

- [ ] Confirmed task files exist in docs/plans/tasks/
- [ ] Identified task execution order (dependencies)
- [ ] **Environment check**: Can I execute per-task commit cycle?
  - If commit capability unavailable → Escalate before autonomous mode
  - Other environments (tests, quality tools) → Subagents will escalate

## Task Execution Cycle (4-Step Cycle)
**MANDATORY EXECUTION CYCLE**: `task-executor-frontend → escalation check → quality-fixer-frontend → commit`

For EACH task, YOU MUST:
1. **Register tasks using TaskCreate**: Register work steps. Always include first task "Map preloaded skills to applicable concrete rules" and final task "Verify the mapped rules before final JSON"
2. **Agent tool** (subagent_type: "task-executor-frontend") → Pass task file path in prompt, receive structured response
3. **CHECK task-executor-frontend response**:
   - `status: "escalation_needed"` or `"blocked"` → STOP and escalate to user
   - `requiresTestReview` is `true` → Execute **integration-test-reviewer**
     - `needs_revision` → Return to step 2 and re-invoke task-executor-frontend in **Fix Mode** by passing the same `task_file` and the `requiredFixes[]` array as input
     - `approved` → Proceed to step 4
   - `readyForQualityCheck: true` → Proceed to step 4
4. **INVOKE quality-fixer-frontend**: Execute all quality checks and fixes. **Always pass** the current task file path as `task_file` and the implementation step's `filesModified` array as `filesModified` (this scopes the stub-detection step to the task's actual write set; without it, quality-fixer falls back to `git diff HEAD`)
5. **CHECK quality-fixer-frontend response**:
   - `stub_detected` → Return to step 2 and re-invoke task-executor-frontend in **Fix Mode** by passing the same `task_file` and the `incompleteImplementations[]` array as input
   - `blocked` → STOP and escalate to user
   - `approved` → Proceed to step 6
6. **COMMIT on approval**: Execute git commit

**CRITICAL**: Parse every sub-agent response for status fields. Execute the matching branch in the 4-step cycle. Proceed to next task only after quality-fixer-frontend returns `approved`.

## Scope Boundary for Subagents

Append the following block to every subagent prompt invoked from this recipe:

```
Scope boundary for subagents:
Operate within the task scope and referenced files in the prompt.
Use loaded skills to execute that scope.
Escalate when the required fix or investigation falls outside that scope.
```

! ls -la docs/plans/*.md | head -10

VERIFY approval status before proceeding. Once confirmed, INITIATE autonomous execution mode. STOP IMMEDIATELY upon detecting ANY requirement changes.

## Post-Implementation Verification (After All Tasks Complete)

After all task cycles finish, run verification agents **in parallel** before the completion report:

1. **Invoke both in parallel** using Agent tool:
   - code-verifier (subagent_type: "code-verifier") → `doc_type: design-doc`, Design Doc path, `code_paths`: implementation file list (`git diff --name-only main...HEAD`)
   - security-reviewer (subagent_type: "security-reviewer") → Design Doc path, implementation file list

2. **Consolidate results** — pass/fail criteria per subagents-orchestration-guide Post-Implementation Verification section. Present unified verification report to user.

3. **Fix cycle** (when any verifier failed, max 2 cycles):
   - Create a consolidated fix task file (e.g., `docs/plans/tasks/post-impl-fixes-YYYYMMDD.md`) using the task-template; populate Target Files with the union of file paths referenced by all verifiers' `requiredFixes[].location` / `discrepancies[].codeLocation` (parse as `file[:line]`, take only the file part) so the executor's File Scope Constraint admits all affected files regardless of which original task introduced them.
   - **Normalize verifier outputs** into a unified `requiredFixes[]` before invoking task-executor-frontend:
     - `security-reviewer.requiredFixes[]` (already `{location, issue, fix}`) → pass through as-is.
     - `code-verifier.discrepancies[]` → convert each actionable discrepancy (status `drift` / `gap` / `conflict`) to `{location: discrepancy.codeLocation, issue: discrepancy.claim, fix: "[specific correction needed to restore Design Doc consistency, derived from discrepancy.classification and evidence]"}`.
     - When a `discrepancy.codeLocation` is `null` (claim is unimplemented), set `location` to the planned target file path and add that file to the consolidated task's Target Files. If no target file can be determined, escalate to user instead of invoking Fix Mode.
   - Invoke task-executor-frontend in **Fix Mode** with `task_file` set to the consolidated path and `requiredFixes` set to the normalized array.
   - Then quality-fixer-frontend, then re-run only the failed verifiers.
   - If still failing after 2 cycles → Escalate to user with remaining findings

4. **All passed** → Proceed to completion report

## Output Example
Frontend implementation phase completed.
- Task decomposition: Generated under docs/plans/tasks/
- Implemented tasks: [number] tasks
- Quality checks: All passed
- Commits: [number] commits created
