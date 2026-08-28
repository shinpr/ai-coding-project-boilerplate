---
description: Execute materialized task files in autonomous execution mode
---

**Explicit User Instruction**: The user explicitly instructs and authorizes every subagent call named in this recipe. Execute each applicable call when its prerequisites are met.

Execute the `llm-friendly-context` skill (using Skill tool) before writing Agent prompts, handoffs, or generated artifacts.

## Orchestrator Definition

**Core Identity**: "I am not a worker. I am an orchestrator." (see subagents-orchestration-guide skill)

**Execution Protocol**:
1. **Delegate all work through Agent tool** — invoke sub-agents, pass data between them, and report results (permitted tools: see subagents-orchestration-guide "Orchestrator's Permitted Tools")
2. **Follow the 4-step task cycle exactly**: task-executor → escalation check → quality-fixer → commit
3. **Enter autonomous mode** when user provides execution instruction with existing task files — this IS the batch approval
4. **Scope**: Complete consumed task-set execution, post-implementation review, consumed-task cleanup, and completion reporting in order, or stop autonomous execution at the current phase for a confirmed value-boundary choice or irreversible-action authorization. Advance only when the current phase's stated transition condition is satisfied.

**CRITICAL**: Run quality-fixer before every commit.

Work plan: $ARGUMENTS

## Pre-execution Prerequisites

### Work Plan Resolution

Before any task processing, locate the work plan.

**When `$ARGUMENTS` is provided**, it is the work plan path supplied by the user. Use it directly without auto-resolution. Extract `{plan-name}` from the filename by stripping the `.md` extension (and any trailing `-plan` suffix when present).

**When `$ARGUMENTS` is empty**, auto-resolve from task files:
1. List task files in `docs/plans/tasks/` matching this recipe's consumable patterns (these correspond to the routes in subagents-orchestration-guide "Layer-Aware Agent Routing" that go through `task-executor`):
   - `{plan-name}-task-*.md` (single-layer; reserved for backend by the routing table)
   - `{plan-name}-backend-task-*.md` (backend portion of a multi-layer plan)
   - `{plan-name}-frontend-task-*.md` is **not** consumable by this recipe — it routes to `task-executor-frontend` and is owned by the frontend build recipe
2. From the matched files, also exclude every file matching any of these patterns — they originate from other workflow phases and are not implementation tasks for this run's plan: `integration-tests-*-task-*.md` (integration-test add-on scaffolding)
3. For each remaining file, extract `{plan-name}` by stripping the trailing `-task-{NN}.md` or `-backend-task-{NN}.md` suffix
4. When at least one task file matches, the work plan is `docs/plans/{plan-name}.md` for the prefix that has the most recent task-file mtime; ties broken by the lexicographically last `{plan-name}`
5. **When the consumable patterns find no matches but `*-frontend-task-*.md` files exist in `docs/plans/tasks/`**: stop and report: "Only frontend-named task files were found. If you intended to run the frontend build recipe, switch to it. If the plan is backend, correct the affected work plan task entries to `Executor lane: backend` and regenerate the task files, or pass the work plan path as `$ARGUMENTS`." Filenames follow the plan's declared lanes, so re-running task materialization alone leaves them unchanged.
6. When neither consumable patterns nor `*-frontend-task-*.md` match, read the most-recent-mtime non-template `.md` in `docs/plans/` and decide from the `Executor lane` every task entry declares:
   - Every task is `backend` → the plan is a backend plan; proceed
   - Any task is `frontend`, or any task omits the lane → stop and report: "Cannot confirm the most-recent work plan at `[path]` is a backend plan from its task `Executor lane` values. Pass the intended backend plan path as `$ARGUMENTS`, or run task-decomposer so `docs/plans/tasks/` receives backend-named task files."
7. When no plan exists at all in `docs/plans/`, stop and report: "No work plan found. Pass a work plan path as `$ARGUMENTS`, or complete the planning phase first."

### Consumed Task Set

Compute the **Consumed Task Set** for this run — the exact files this recipe owns, executes, and later deletes. Use the same consumable patterns as Work Plan Resolution:

1. List task files in `docs/plans/tasks/` matching `{plan-name}-task-*.md` OR `{plan-name}-backend-task-*.md` for the `{plan-name}` resolved by Work Plan Resolution. `{plan-name}-frontend-task-*.md` is excluded — it is owned by the frontend build recipe
2. Exclude every file matching: `integration-tests-*-task-*.md` (this originates from another workflow phase)

Every subsequent reference to "task files" in this recipe — Task Generation Decision Flow, Task Execution Cycle iteration, and Final Cleanup — uses this set, not the unrestricted `docs/plans/tasks/*.md` glob.

### Task Generation Decision Flow

Analyze the Consumed Task Set and determine the action required. Reaching this section implies Work Plan Resolution above resolved a work plan (Steps 1-6 succeeded); the "no plan" state is already terminated by Work Plan Resolution Step 7 and never reaches this table.

| State | Criteria | Next Action |
|-------|----------|-------------|
| Tasks exist | Consumed Task Set is non-empty | User's execution instruction serves as batch approval → Enter autonomous execution immediately |
| No tasks + plan supplied via `$ARGUMENTS` | `$ARGUMENTS` provided AND Consumed Task Set empty | Confirm with user → run task-decomposer |
| No tasks + plan auto-resolved | Consumed Task Set empty AND plan came from auto-resolution AND Step 6 confirmed every task declares `Executor lane: backend` | Confirm with user → run task-decomposer (Step 6 already excluded frontend and lane-less plans, so this is safe) |

To bootstrap from a Design Doc when no plan exists yet, run the planning recipe first to produce a work plan, then re-invoke this recipe — Work Plan Resolution above intentionally requires a resolved work plan rather than auto-creating one, to keep the layer decision explicit.

## Task Materialization Phase (Conditional)

When the Consumed Task Set is empty:

### 1. User Confirmation
```
No task files in the Consumed Task Set.
Work plan: docs/plans/[plan-name].md

Generate tasks from the work plan? (y/n):
```

### 2. Task Materialization (if approved)
Invoke task-decomposer using Agent tool:
- `subagent_type`: "task-decomposer"
- `description`: "Materialize work plan tasks"
- `prompt`: "Read work plan at docs/plans/[plan-name].md and output one single-commit task file per work plan implementation item in docs/plans/tasks/, selecting each filename from the item's Executor lane."

### 3. Verify Generation
Recompute the Consumed Task Set using the same restricted pattern from the Consumed Task Set section above. Confirm it is now non-empty. If it is still empty, escalate to the user — task-decomposer either failed silently or produced files that don't match the expected pattern.

**Flow**: Task generation → Consumed Task Set recompute → Autonomous execution (in this order)

## Pre-execution Checklist

- [ ] Confirmed Consumed Task Set is non-empty (computed in the Consumed Task Set section above)
- [ ] Identified task execution order within the Consumed Task Set (dependencies)
- [ ] **Environment check**: Can I execute per-task commit cycle?
  - If commit capability is unavailable → Apply Specialist Result Acceptance before autonomous mode
  - Test and quality-tool limitations → Subagents run unaffected checks and record exactly what could not run

## Task Execution Cycle (4-Step Cycle)
**MANDATORY EXECUTION CYCLE**: `task-executor → escalation check → quality-fixer → commit`

For EACH task in the Consumed Task Set, YOU MUST:
1. **EXECUTE**: Invoke task-executor to implement the task (cross-layer: see Layer-Aware Agent Routing in subagents-orchestration-guide)
2. **BRANCH ON EXECUTOR RESULT**:
   - `status: "escalation_needed"` or `"blocked"` → Apply subagents-orchestration-guide Specialist Result Acceptance
   - `requiresTestReview` is `true` → Execute **integration-test-reviewer**, passing every path from the implementation step's `testsAdded` as `testFile`, `taskFiles: [the current task file path]` (so the reviewer can read the task's Operation Verification Methods and Verification Focus), `diffBase: HEAD` (this task's changes are uncommitted at this point, so HEAD is the base of its diff). Then branch on its `status`
     - `needs_revision` → Apply Review Resolution and return to step 1 with the same `task_file` plus the complete `apply` quality-issue objects passed verbatim as `correction_findings`
     - `blocked` → Resolve moved or renamed test paths from the current diff and re-run when the resolved input changes the review target. If no readable changed test exists despite `requiresTestReview: true`, return that executor-output defect to step 1 as `correction_findings`; otherwise record the review as not run with its `blockingReason` and proceed to step 3
     - `approved` → Proceed to step 3
   - `readyForQualityCheck: true` → Proceed to step 3
3. **QUALITY-FIX**: Invoke quality-fixer against the complete current uncommitted worktree, including untracked, deleted, and renamed paths (cross-layer: see Layer-Aware Agent Routing). Pass the current `task_file`, the implementation step's `runnableCheck`, and `qualityCommand` when technical-spec or a repository convention names one. Then branch on its response:
   - `stub_detected` → Return to step 1 and re-invoke task-executor with the same `task_file` and the `incompleteImplementations[]` array
   - `blocked` → Apply Specialist Result Acceptance
   - `verification_incomplete` → Retain the complete result for final retry and proceed to step 4
   - `approved` → Proceed to step 4
4. **COMMIT**: Commit the completed task change set after `approved` or `verification_incomplete`

**CRITICAL**: Parse every sub-agent response for its routing meaning. Proceed to the next task after step 4, retaining any `verification_incomplete` result for the final retry.

## Scope Boundary for Subagents

Append the following block to every subagent prompt invoked from this recipe:

```
Scope boundary for subagents:
Deliver the task outcome consistently across the repository responsibility that owns it.
Treat referenced paths as investigation starting points and include supporting files when the same outcome requires them.
Keep governing artifacts read-only except for assigned progress fields.
Return to Requirement Change Detection when confirmed outcome, desired-future requirements, and non-goals cannot all remain true; request authorization when an irreversible external action is required.
```

After approval confirmation, start autonomous execution mode. STOP IMMEDIATELY upon detecting ANY requirement changes.

## Post-Implementation Review (After All Tasks Complete)

Before invoking post-implementation reviewers, apply the proof-limitation retry in subagents-orchestration-guide Specialist Result Acceptance. Continue with the reviewers after clearing or retaining each result; include only repeated limitations in the completion report.

Resolve the Work Plan's readable Design Doc; missing input blocks review.

Emit these Agent calls in one assistant message, then await both:
- code-reviewer (subagent_type: "code-reviewer") → review the completed implementation with the resolved typed `governingDocuments`, the actual files changed by completed tasks as `implementationFiles`, and the Work Plan path
- security-reviewer (subagent_type: "security-reviewer") → review the completed implementation against the same typed `governingDocuments`

Apply subagents-orchestration-guide's Post-Implementation Review status-routing and fix/re-run rules. Present the unified report; proceed to Final Cleanup after the complete review set reaches Review Resolution convergence.

## Final Cleanup

Before the completion report, delete the implementation task files this recipe consumed. Their work is committed; `docs/plans/` is ephemeral working state and is not retained between recipe runs:

- Delete every file in the Consumed Task Set
- Preserve the work plan itself (`docs/plans/{plan-name}.md`) — the user decides whether to delete it after final review

If a filesystem error leaves task files behind, continue the completion report with that cleanup failure recorded.

## Completion Report Contract

Final report must include:
- Task materialization status
- Implemented task count
- Quality check result, including checks that did not run or unrelated baseline failures when present
- Verification limitations that remained after final retry
- Commit count
- Cleanup result
- Escalation or blocking summary, if any

**Responsibility Boundary**:
- IN SCOPE: Task materialization to implementation completion
- OUT OF SCOPE: Design phase, planning phase
