---
description: Execute decomposed tasks in autonomous execution mode
---

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

### Implementation Readiness Check

Before any task processing, locate the work plan to gate against.

**When `$ARGUMENTS` is provided**, it is the work plan path supplied by the user. Use it directly without auto-resolution. Extract `{plan-name}` from the filename by stripping the `.md` extension (and any trailing `-plan` suffix when present).

**When `$ARGUMENTS` is empty**, auto-resolve from task files:
1. List task files in `docs/plans/tasks/` matching this recipe's consumable patterns (these correspond to the routes in subagents-orchestration-guide "Layer-Aware Agent Routing" that go through `task-executor`):
   - `{plan-name}-task-*.md` (single-layer; reserved for backend by the routing table)
   - `{plan-name}-backend-task-*.md` (backend portion of a multi-layer plan)
   - `{plan-name}-frontend-task-*.md` is **not** consumable by this recipe — it routes to `task-executor-frontend` and is owned by the frontend build recipe
2. From the matched files, also exclude every file matching any of these patterns — they originate from other workflow phases and are not implementation tasks for this run's plan: `*-task-prep-*.md` (readiness preflight tasks), `_overview-*.md` (decomposition overview file), `*-phase*-completion.md` (per-phase completion files), `review-fixes-*.md` (post-implementation review fixes), `integration-tests-*-task-*.md` (integration-test add-on scaffolding)
3. For each remaining file, extract `{plan-name}` by stripping the trailing `-task-{NN}.md` or `-backend-task-{NN}.md` suffix
4. When at least one task file matches, the work plan is `docs/plans/{plan-name}.md` for the prefix that has the most recent task-file mtime; ties broken by the lexicographically last `{plan-name}`
5. **When the consumable patterns find no matches but `*-frontend-task-*.md` files exist in `docs/plans/tasks/`**: stop and report: "Only frontend-named task files were found. If you intended to run the frontend build recipe, switch to it. If the plan is backend, re-run task-decomposer so it emits backend-named task files, or pass the work plan path as `$ARGUMENTS`."
6. When neither consumable patterns nor `*-frontend-task-*.md` match, fall back to the most-recent-mtime non-template `.md` in `docs/plans/` ONLY after **positively verifying the plan is a backend plan**. Absence of frontend markers is not enough — many plan templates include layer-neutral paths (e.g., `src/presentation`, `src/app`) that match neither marker set, so a confirmed backend signal is required. Read the plan and check:

   **Backend signals (need at least one)**:
   - Target Files in `## Impact Scope > ### Target Files` (or equivalent) exclusively match backend markers: `**/api/**`, `**/server/**`, `**/services/**`, `**/backend/**`, `**/handlers/**`, `**/repositories/**`, or the project's backend-equivalent paths declared in `technical-spec` skill
   - The plan's `## Related Documents` references a Design Doc whose filename explicitly identifies it as backend (e.g., `*-backend-design.md`, `backend-*-design.md`)
   - The plan title, `## Objective`, or `## Background` section explicitly identifies the work as backend (e.g., "backend implementation", "API endpoint", "database migration", "server-side")

   **Frontend signals (any disqualifies, even if a backend signal is also present)**:
   - `## Related Documents` entry pointing to `docs/ui-spec/*`
   - An `## UI Spec Component → Task Mapping` section
   - Target Files exclusively under frontend paths (`**/components/**`, `**/pages/**`, `**/web/**`, `**/*.tsx`, `**/*.jsx`)
   - Plan title or objective explicitly mentions React, UI components, screens, or frontend

   **Decision**:
   - At least one backend signal AND zero frontend signals → plan is acceptable; proceed
   - Otherwise (no backend signal found, OR any frontend signal present, OR layer-neutral paths only) → stop and report: "Cannot positively verify the most-recent work plan at `[path]` is a backend plan (signals examined: [list of signals checked and their results]). Pass the intended backend plan path as `$ARGUMENTS`, or run task-decomposer first to populate `docs/plans/tasks/` with backend-named task files."
7. When no plan exists at all in `docs/plans/`, stop and report: "No work plan found. Pass a work plan path as `$ARGUMENTS`, or complete the planning phase first."

Read the work plan header and find the line `Implementation Readiness: <status>`. Apply this rule:

| Status | Action |
|--------|--------|
| `ready` | Proceed to Consumed Task Set computation |
| `escalated` | Read the work plan's Readiness Report section, surface remaining gaps to the user via AskUserQuestion: "Implementation Readiness is `escalated` with the following remaining gaps: [list]. Continue execution? (y/n)". On `y` proceed; on `n` stop |
| `pending` | Present via AskUserQuestion: "Implementation Readiness is `pending`. Run the readiness preflight first to verify the work plan is implementable, then resume. Continue without preflight? (y/n)". On `y` proceed; on `n` stop |
| absent (line missing) | Treat as `pending` — older work plans created before the readiness marker existed should be preflighted explicitly |

### Consumed Task Set

Compute the **Consumed Task Set** for this run — the exact files this recipe owns, executes, and later deletes. Use the same consumable patterns as the Implementation Readiness Check:

1. List task files in `docs/plans/tasks/` matching `{plan-name}-task-*.md` OR `{plan-name}-backend-task-*.md` for the `{plan-name}` resolved by the readiness check. `{plan-name}-frontend-task-*.md` is excluded — it is owned by the frontend build recipe
2. Exclude every file matching: `*-task-prep-*.md`, `_overview-*.md`, `*-phase*-completion.md`, `review-fixes-*.md`, `integration-tests-*-task-*.md` (these originate from other workflow phases)

Every subsequent reference to "task files" in this recipe — Task Generation Decision Flow, Task Execution Cycle iteration, and Final Cleanup — uses this set, not the unrestricted `docs/plans/tasks/*.md` glob.

### Task Generation Decision Flow

Analyze the Consumed Task Set and determine the action required. Reaching this section implies the readiness check above resolved a work plan (Steps 1-6 succeeded); the "no plan" state is already terminated by readiness-check Step 7 and never reaches this table.

| State | Criteria | Next Action |
|-------|----------|-------------|
| Tasks exist | Consumed Task Set is non-empty | User's execution instruction serves as batch approval → Enter autonomous execution immediately |
| No tasks + plan supplied via `$ARGUMENTS` | `$ARGUMENTS` provided AND Consumed Task Set empty | Confirm with user → run task-decomposer |
| No tasks + plan auto-resolved | Consumed Task Set empty AND plan came from auto-resolution AND Step 6 confirmed at least one backend signal with zero frontend signals | Confirm with user → run task-decomposer (the layer verification in Step 6 already excluded frontend and ambiguous plans, so this is safe) |

To bootstrap from a Design Doc when no plan exists yet, run the planning recipe first to produce a work plan, then re-invoke this recipe — the readiness check above intentionally requires a resolved work plan rather than auto-creating one, to keep the layer decision explicit.

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
**MANDATORY EXECUTION CYCLE**: `task-executor → escalation check → quality-fixer → commit`

For EACH task in the Consumed Task Set, YOU MUST:
1. **Register tasks using TaskCreate**: Register work steps. Always include first task "Map preloaded skills to applicable concrete rules" and final task "Verify the mapped rules before final JSON"
2. **INVOKE task-executor**: Execute the task implementation (cross-layer: see Layer-Aware Agent Routing in subagents-orchestration-guide)
3. **CHECK task-executor response**:
   - `status: "escalation_needed"` or `"blocked"` → STOP and escalate to user
   - `requiresTestReview` is `true` → Execute **integration-test-reviewer**
     - `needs_revision` → Return to step 2 and re-invoke task-executor in **Fix Mode** by passing the same `task_file` and the `requiredFixes[]` array as input
     - `approved` → Proceed to step 4
   - `readyForQualityCheck: true` → Proceed to step 4
4. **INVOKE quality-fixer**: Execute all quality checks and fixes (cross-layer: see Layer-Aware Agent Routing). **Always pass** the current task file path as `task_file` and the implementation step's `filesModified` array as `filesModified` (this scopes the stub-detection step to the task's actual write set; without it, quality-fixer falls back to `git diff HEAD`)
5. **CHECK quality-fixer response**:
   - `stub_detected` → Return to step 2 and re-invoke task-executor in **Fix Mode** by passing the same `task_file` and the `incompleteImplementations[]` array as input
   - `blocked` → STOP and escalate to user
   - `approved` → Proceed to step 6
6. **COMMIT on approval**: Execute git commit

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
   - security-reviewer (subagent_type: "security-reviewer") → Design Doc path, implementation file list

2. **Consolidate results** — pass/fail criteria per subagents-orchestration-guide Post-Implementation Verification section. Present unified verification report to user.

3. **Fix cycle** (when any verifier failed, max 2 cycles):
   - Create a consolidated fix task file (e.g., `docs/plans/tasks/post-impl-fixes-YYYYMMDD.md`) using the task-template; populate Target Files with the union of file paths referenced by all verifiers' `requiredFixes[].location` / `discrepancies[].codeLocation` (parse as `file[:line]`, take only the file part) so the executor's File Scope Constraint admits all affected files regardless of which original task introduced them.
   - **Normalize verifier outputs** into a unified `requiredFixes[]` before invoking task-executor:
     - `security-reviewer.requiredFixes[]` (already `{location, issue, fix}`) → pass through as-is.
     - `code-verifier.discrepancies[]` → convert each actionable discrepancy (status `drift` / `gap` / `conflict`) to `{location: discrepancy.codeLocation, issue: discrepancy.claim, fix: "[specific correction needed to restore Design Doc consistency, derived from discrepancy.classification and evidence]"}`.
     - When a `discrepancy.codeLocation` is `null` (claim is unimplemented), set `location` to the planned target file path and add that file to the consolidated task's Target Files. If no target file can be determined, escalate to user instead of invoking Fix Mode.
   - Invoke task-executor in **Fix Mode** with `task_file` set to the consolidated path and `requiredFixes` set to the normalized array.
   - Then quality-fixer, then re-run only the failed verifiers.
   - If still failing after 2 cycles → Escalate to user with remaining findings

4. **All passed** → Proceed to Final Cleanup

## Final Cleanup

Before the completion report, delete the implementation task files this recipe consumed. Their work is committed; `docs/plans/` is ephemeral working state and is not retained between recipe runs:

- Delete every file in the Consumed Task Set
- Delete every file matching `docs/plans/tasks/{plan-name}-phase*-completion.md` (the per-phase completion files generated by task-decomposer for this `{plan-name}`)
- Delete the corresponding `docs/plans/tasks/_overview-{plan-name}.md` if present
- Preserve the work plan itself (`docs/plans/{plan-name}.md`) — the user decides whether to delete it after final review

If task files cannot be deleted (filesystem error), report the failure but do not block the completion report.

## Completion Report Contract

Final report must include:
- Task decomposition status
- Implemented task count
- Quality check result
- Commit count
- Cleanup result
- Escalation or blocking summary, if any

**Responsibility Boundary**:
- IN SCOPE: Task decomposition to implementation completion
- OUT OF SCOPE: Design phase, planning phase
