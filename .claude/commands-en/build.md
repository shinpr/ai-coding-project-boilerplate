---
description: Execute materialized task files in autonomous execution mode
---

Execute the `llm-friendly-context` skill (using Skill tool) before writing Agent prompts, handoffs, or generated artifacts.

## Orchestrator Definition

**Core Identity**: "I am not a worker. I am an orchestrator." (see subagents-orchestration-guide skill)

**Execution Protocol**:
1. **Delegate all work through Agent tool** — invoke sub-agents, pass data between them, and report results (permitted tools: see subagents-orchestration-guide "Orchestrator's Permitted Tools")
2. **Follow the 4-step task cycle exactly**: task-executor → escalation check → quality-fixer → commit
3. **Enter autonomous mode** when user provides execution instruction with existing task files — this IS the batch approval
4. **Scope**: Complete when all tasks are committed or escalation occurs

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
6. When neither consumable patterns nor `*-frontend-task-*.md` match, fall back to the most-recent-mtime non-template `.md` in `docs/plans/` ONLY after **positively verifying the plan is a backend plan**. Absence of frontend markers is not enough — many plan templates include layer-neutral paths (e.g., `src/presentation`, `src/app`) that match neither marker set, so a confirmed backend signal is required. Read the plan and check:

   **Backend signals (need at least one)**:
   - Every task's `Executor lane` is `backend`
   - Task `Scope` entries exclusively match backend markers: `**/api/**`, `**/server/**`, `**/services/**`, `**/backend/**`, `**/handlers/**`, `**/repositories/**`, or the project's backend-equivalent paths declared in `technical-spec` skill
   - The plan's `## Governing Documents` references a Design Doc whose filename explicitly identifies it as backend (e.g., `*-backend-design.md`, `backend-*-design.md`)
   - The plan title or `## Implementation Scope` explicitly identifies the work as backend (e.g., "backend implementation", "API endpoint", "database migration", "server-side")

   **Frontend signals (any disqualifies, even if a backend signal is also present)**:
   - Any task's `Executor lane` is `frontend`
   - `## Governing Documents` entry pointing to `docs/ui-spec/*`
   - Task `Scope` entries exclusively under frontend paths (`**/components/**`, `**/pages/**`, `**/web/**`, `**/*.tsx`, `**/*.jsx`)
   - Plan title or `## Implementation Scope` explicitly mentions React, UI components, screens, or frontend

   **Decision**:
   - At least one backend signal AND zero frontend signals → plan is acceptable; proceed
   - Otherwise (no backend signal found, OR any frontend signal present, OR layer-neutral paths only) → stop and report: "Cannot positively verify the most-recent work plan at `[path]` is a backend plan (signals examined: [list of signals checked and their results]). Pass the intended backend plan path as `$ARGUMENTS`, or run task-decomposer first on a plan whose task entries declare `Executor lane: backend`, so `docs/plans/tasks/` receives backend-named task files."
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
| No tasks + plan auto-resolved | Consumed Task Set empty AND plan came from auto-resolution AND Step 6 confirmed at least one backend signal with zero frontend signals | Confirm with user → run task-decomposer (the layer verification in Step 6 already excluded frontend and ambiguous plans, so this is safe) |

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
  - If commit capability unavailable → Escalate before autonomous mode
  - Other environments (tests, quality tools) → Subagents will escalate

## Task Execution Cycle (4-Step Cycle)
**MANDATORY EXECUTION CYCLE**: `task-executor → escalation check → quality-fixer → commit`

Before the first iteration, register this recipe's phases once using TaskCreate: "Execute consumed task set", "Run post-implementation verification", "Clean up consumed task files", "Report completion". Update each with TaskUpdate as it completes.

For EACH task in the Consumed Task Set, YOU MUST:
1. **EXECUTE**: Invoke task-executor to implement the task (cross-layer: see Layer-Aware Agent Routing in subagents-orchestration-guide)
2. **BRANCH ON EXECUTOR RESULT**:
   - `status: "escalation_needed"` or `"blocked"` → STOP and escalate to user
   - `requiresTestReview` is `true` → Execute **integration-test-reviewer**, passing every path from the implementation step's `testsAdded` as `testFile`, `taskFiles: [the current task file path]` (so the reviewer can read the task's Operation Verification Methods and Verification Focus), `diffBase: HEAD` (this task's changes are uncommitted at this point, so HEAD is the base of its diff). Then branch on its `verdict.decision`
     - `needs_revision` → Return to step 1 and re-invoke task-executor in **Fix Mode** by passing the same `task_file` and the `requiredFixes[]` array as input
     - `blocked` → STOP and escalate to user, reporting `verdict.reason` and the review basis the reviewer could not establish
     - `approved` → Proceed to step 3
   - `readyForQualityCheck: true` → Proceed to step 3
3. **QUALITY-FIX**: Invoke quality-fixer to execute all quality checks and fixes (cross-layer: see Layer-Aware Agent Routing). **Always pass** the current task file path as `task_file` and the implementation step's `filesModified` array as `filesModified` (this scopes the stub-detection step to the task's actual write set; without it, quality-fixer falls back to `git diff HEAD`). Also pass the implementation step's `runnableCheck` so the substance check reads the upstream evidence instead of re-deriving it, and `qualityCommand` when technical-spec or a repo convention names the project's authoritative quality command, so every task in this run is verified by the same command. Then branch on its response:
   - `stub_detected` → Return to step 1 and re-invoke task-executor in **Fix Mode** by passing the same `task_file` and the `incompleteImplementations[]` array as input
   - `blocked` → STOP and escalate to user (discriminate by `reason` per quality-fixer blocked handling in subagents-orchestration-guide)
   - `approved` → Proceed to step 4
4. **COMMIT on approval**: Execute git commit

**CRITICAL**: Parse every sub-agent response for status fields. Execute the matching branch in the 4-step cycle. Proceed to next task only after quality-fixer returns `approved`.

## Scope Boundary for Subagents

Append the following block to every subagent prompt invoked from this recipe:

```
Scope boundary for subagents:
Operate within the task scope and referenced files in the prompt.
Use loaded skills to execute that scope.
Escalate when the required fix or investigation falls outside that scope.
```

After approval confirmation, start autonomous execution mode. STOP IMMEDIATELY upon detecting ANY requirement changes.

## Post-Implementation Verification (After All Tasks Complete)

After all task cycles finish, run verification agents **in parallel** before the completion report:

1. **Invoke both in parallel** using Agent tool:
   - code-verifier (subagent_type: "code-verifier") → `doc_type: design-doc`, Design Doc path, `code_paths`: implementation file list (`git diff --name-only main...HEAD`)
   - security-reviewer (subagent_type: "security-reviewer") → Design Doc path and implementation file list

2. **Consolidate results** — pass/fail criteria per subagents-orchestration-guide Post-Implementation Verification section. Present unified verification report to user.

3. **Fix cycle** (when any verifier failed, max 2 cycles):
   - Apply Review Resolution to every actionable finding, then **normalize verifier outputs** into a unified `requiredFixes[]` before invoking task-executor. Forward each `apply` finding object verbatim with only its disposition added:
     - `security-reviewer.requiredFixes[]` (already `{location, issue, fix}`) → pass through as-is.
     - `code-verifier.discrepancies[]` → convert each actionable discrepancy (status `drift` / `gap` / `conflict`) to `{location: discrepancy.codeLocation, issue: discrepancy.claim, fix: "[specific correction needed to restore Design Doc consistency, derived from discrepancy.classification and evidence]"}`.
     - When a `discrepancy.codeLocation` is `null` (claim is unimplemented), set `location` to the planned target file path. If no target file can be determined, escalate to user instead of invoking Fix Mode.
   - Invoke task-executor in **Fix Mode** with an explicit prompt naming the affected paths and the observable verification condition, and `requiredFixes` set to the normalized array. No fix task file is created — the finding objects are the execution scope.
   - Then quality-fixer, then re-run only the failed verifiers.
   - If still failing after 2 cycles → Escalate to user with remaining findings

4. **All passed** → Proceed to Final Cleanup

## Final Cleanup

Before the completion report, delete the implementation task files this recipe consumed. Their work is committed; `docs/plans/` is ephemeral working state and is not retained between recipe runs:

- Delete every file in the Consumed Task Set
- Preserve the work plan itself (`docs/plans/{plan-name}.md`) — the user decides whether to delete it after final review

If task files cannot be deleted (filesystem error), report the failure but do not block the completion report.

## Completion Report Contract

Final report must include:
- Task materialization status
- Implemented task count
- Quality check result
- Commit count
- Cleanup result
- Escalation or blocking summary, if any

**Responsibility Boundary**:
- IN SCOPE: Task materialization to implementation completion
- OUT OF SCOPE: Design phase, planning phase
