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

### Implementation Readiness Check

Before any task processing, locate the work plan to gate against.

**When `$ARGUMENTS` is provided**, it is the work plan path supplied by the user. Use it directly without auto-resolution. Extract `{plan-name}` from the filename by stripping the `.md` extension (and any trailing `-plan` suffix when present).

**When `$ARGUMENTS` is empty**, auto-resolve from task files:
1. List task files in `docs/plans/tasks/` matching this recipe's only consumable pattern (per subagents-orchestration-guide "Layer-Aware Agent Routing", `task-executor-frontend` owns this filename suffix and no other):
   - `{plan-name}-frontend-task-*.md`
   - The bare `{plan-name}-task-*.md` is **not** consumable — that filename is reserved for backend by the routing table and is owned by the backend build recipe. `{plan-name}-backend-task-*.md` is also not consumable for the same reason.
2. From the matched files, also exclude every file matching any of these patterns — they originate from other workflow phases and are not implementation tasks for this run's plan: `*-task-prep-*.md` (readiness preflight tasks), `_overview-*.md` (decomposition overview file), `*-phase*-completion.md` (per-phase completion files), `review-fixes-*.md` (post-implementation review fixes), `integration-tests-*-task-*.md` (integration-test add-on scaffolding)
3. For each remaining file, extract `{plan-name}` by stripping the trailing `-frontend-task-{NN}.md` suffix
4. When at least one task file matches, the work plan is `docs/plans/{plan-name}.md` for the prefix that has the most recent task-file mtime; ties broken by the lexicographically last `{plan-name}`
5. When no `*-frontend-task-*.md` is found AND a non-template work plan exists in `docs/plans/`, do not assume the most-recent plan applies — frontend tasks must be explicitly named. Stop and report: "No `*-frontend-task-*.md` found in `docs/plans/tasks/`. If you intended to run this recipe on a frontend plan, either re-run task-decomposer so it emits frontend-named task files, or pass the work plan path as `$ARGUMENTS`. If the plan is backend, use the backend build recipe instead."

Read the work plan header and find the line `Implementation Readiness: <status>`. Apply this rule:

| Status | Action |
|--------|--------|
| `ready` | Proceed to Consumed Task Set computation |
| `escalated` | Read the work plan's Readiness Report section, surface remaining gaps to the user via AskUserQuestion: "Implementation Readiness is `escalated` with the following remaining gaps: [list]. Continue execution? (y/n)". On `y` proceed; on `n` stop |
| `pending` | Present via AskUserQuestion: "Implementation Readiness is `pending`. Run the readiness preflight first to verify the work plan is implementable, then resume. Continue without preflight? (y/n)". On `y` proceed; on `n` stop |
| absent (line missing) | Treat as `pending` — older work plans created before the readiness marker existed should be preflighted explicitly |

### Consumed Task Set

Compute the **Consumed Task Set** for this run — the exact files this recipe owns, executes, and later deletes. Per the routing table, the only consumable pattern is:

1. List task files in `docs/plans/tasks/` matching `{plan-name}-frontend-task-*.md` for the `{plan-name}` resolved by the readiness check. `{plan-name}-task-*.md` and `{plan-name}-backend-task-*.md` are excluded — they route to `task-executor` and are owned by the backend build recipe
2. Exclude every file matching: `*-task-prep-*.md`, `_overview-*.md`, `*-phase*-completion.md`, `review-fixes-*.md`, `integration-tests-*-task-*.md` (these originate from other workflow phases)

Every subsequent reference to "task files" in this recipe — Task Generation Decision Flow, Task Execution Cycle iteration, and Final Cleanup — uses this set, not the unrestricted `docs/plans/tasks/*.md` glob.

### Task Generation Decision Flow

Analyze the Consumed Task Set and determine the action required. Note: when `$ARGUMENTS` is empty AND no `*-frontend-task-*.md` exist, the readiness check above already stops execution — so the rows below that involve "no tasks" only fire when the user explicitly supplied `$ARGUMENTS`.

| State | Criteria | Next Action |
|-------|----------|-------------|
| Tasks exist | Consumed Task Set is non-empty | User's execution instruction serves as batch approval → Enter autonomous execution immediately |
| No tasks + plan supplied via `$ARGUMENTS` | `$ARGUMENTS` provided AND Consumed Task Set empty | Confirm with user → run task-decomposer (which will emit `*-frontend-task-*.md` per the frontend naming rule) |
| Neither exists + Design Doc exists + `$ARGUMENTS` provided | `$ARGUMENTS` provided, no plan, no Consumed Task Set, but docs/design/*.md exists | Invoke work-planner to create work plan from Design Doc, then proceed to task decomposition |
| Neither exists | No `$ARGUMENTS`, no plan, no Consumed Task Set, no Design Doc | Report missing prerequisites to user and stop |

## Task Decomposition Phase (Conditional)

When the Consumed Task Set is empty:

### 1. User Confirmation
```
No task files in the Consumed Task Set.
Work plan: docs/plans/[plan-name].md

Generate tasks from the work plan? (y/n):
```

### 2. Task Decomposition (if approved)
Invoke task-decomposer using Agent tool:
- `subagent_type`: "task-decomposer"
- `description`: "Decompose work plan"
- `prompt`: "Read work plan at docs/plans/[plan-name].md and decompose into atomic tasks. Output: Individual task files in docs/plans/tasks/. Granularity: 1 task = 1 commit = independently executable"

### 3. Verify Generation
Recompute the Consumed Task Set using the same restricted pattern from the Consumed Task Set section above. Confirm it is now non-empty. If it is still empty, escalate to the user — task-decomposer either failed silently or produced files that don't match the expected pattern.

**Flow**: Task generation → Consumed Task Set recompute → Autonomous execution (in this order)

## Pre-execution Checklist

- [ ] Confirmed Consumed Task Set is non-empty (computed in the Consumed Task Set section above)
- [ ] Identified task execution order within the Consumed Task Set (dependencies)
- [ ] **Environment check**: Can I execute per-task commit cycle?
  - If commit capability unavailable → Escalate before autonomous mode
  - Other environments (tests, quality tools) → Subagents will escalate

## Task Execution Cycle (4-Step Cycle)
**MANDATORY EXECUTION CYCLE**: `task-executor-frontend → escalation check → quality-fixer-frontend → commit`

For EACH task in the Consumed Task Set, YOU MUST:
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

4. **All passed** → Proceed to Final Cleanup

## Final Cleanup

Before the completion report, delete the implementation task files this recipe consumed. Their work is committed; `docs/plans/` is ephemeral working state and is not retained between recipe runs:

- Delete every file in the Consumed Task Set
- Delete every file matching `docs/plans/tasks/{plan-name}-phase*-completion.md` (the per-phase completion files generated by task-decomposer for this `{plan-name}`)
- Delete the corresponding `docs/plans/tasks/_overview-{plan-name}.md` if present
- Preserve the work plan itself (`docs/plans/{plan-name}.md`) — the user decides whether to delete it after final review

If task files cannot be deleted (filesystem error), report the failure but do not block the completion report.

## Output Example
Frontend implementation phase completed.
- Task decomposition: Generated under docs/plans/tasks/
- Implemented tasks: [number] tasks
- Quality checks: All passed
- Commits: [number] commits created
- Cleanup: Task files removed from docs/plans/tasks/
