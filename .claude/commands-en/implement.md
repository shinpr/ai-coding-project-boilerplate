---
description: Orchestrate the complete implementation lifecycle from requirements to deployment
---

Execute the `llm-friendly-context` skill (using Skill tool) before writing Agent prompts, handoffs, or generated artifacts.

**Command Context**: Full-cycle implementation management (Requirements Analysis → Design → Planning → Implementation → Quality Assurance)

Strictly adhere to subagents-orchestration-guide skill and operate as an orchestrator — delegate all work through Agent tool, pass data between sub-agents, and report results (permitted tools: see subagents-orchestration-guide "Orchestrator's Permitted Tools").

## Execution Decision Flow

### 1. Current Situation Assessment
Instruction Content: $ARGUMENTS

**Think deeply** Assess the current situation:

| Situation Pattern | Decision Criteria | Next Action |
|------------------|------------------|-------------|
| New Requirements | No existing work, new feature/fix request | Start with requirement-analyzer |
| Flow Continuation | Existing docs/tasks present, continuation directive | Identify next step in subagents-orchestration-guide skill flow |
| Quality Errors | Error detection, test failures, build errors | Execute quality-fixer |
| Ambiguous | Intent unclear, multiple interpretations possible | Confirm with user |

### 2. Progress Verification for Continuation
When continuing existing flow, verify:
- Latest artifacts (PRD/ADR/Design Doc/Work Plan/Tasks)
- Current phase position (Requirements/Design/Planning/Implementation/QA)
- Identify next step in subagents-orchestration-guide skill corresponding flow

### 3. Design Phase

When requirement-analyzer's `crossLayerScope` indicates cross-layer scope (backend + frontend), follow the Cross-Layer Orchestration section in subagents-orchestration-guide skill for Design Doc creation per layer.

### 4. After requirement-analyzer [Stop]

Run the requirement-convergence hearing protocol on the returned `convergence` object before presenting anything else, using the analyzer's scope facts and cost band as the facts it presents.

When user responds to questions:
- If any `convergence` field is below `ready` → Re-execute requirement-analyzer with the hearing answers so the record is re-judged. Re-invoke at most once per field
- If response matches any `scopeDependencies.question` → Check `impact` for scale change
- If scale changes → Re-execute requirement-analyzer with updated context
- If `confidence: "confirmed"` or no scale change → Proceed to next step

Carry the final `convergence` record into every document-creation step per the convergence-record handoff in subagents-orchestration-guide skill.

### 5. After Scale Determination: Register All Flow Steps with TaskCreate (Required)

After scale determination, **register all steps of the applicable subagents-orchestration-guide skill flow with TaskCreate**, naming each task after the flow step it tracks. After registration, proceed through the flow referencing TaskList.

### 6. Execute Next Action

**Check next pending task with TaskList**.

## subagents-orchestration-guide skill Compliance Execution

**Pre-execution Checklist (Required)**:
- [ ] Confirmed relevant subagents-orchestration-guide skill flow
- [ ] Identified current progress position
- [ ] Clarified next step
- [ ] Recognized stopping points → **Use AskUserQuestion for confirmation at all Stop points**
- [ ] codebase-analyzer included before each Design Doc creation
- [ ] code-verifier included before document-reviewer for each Design Doc
- [ ] Understood the 4-step cycle after task execution (task-executor → escalation judgment/follow-up → quality-fixer → commit)

**Flow Adherence**: Follow "Autonomous Execution Task Management" in subagents-orchestration-guide skill, managing 4 steps with TaskCreate/TaskUpdate

## Scope Boundary for Subagents

Append the following block to every subagent prompt invoked from this recipe:

```
Scope boundary for subagents:
Operate within the task scope and referenced files in the prompt.
Use loaded skills to execute that scope.
Escalate when the required fix or investigation falls outside that scope.
```

Additionally, include the following constraint at the end of every sub-agent prompt, as rule-advisor invocation from sub-agents causes system crash:
```
[Constraint] rule-advisor can only be used by Main AI
```

## Mandatory Orchestrator Responsibilities

### Task Execution Quality Cycle
Following "Autonomous Execution Task Management" in subagents-orchestration-guide skill, manage these steps with TaskCreate/TaskUpdate:
1. **INVOKE task-executor**: Execute implementation (cross-layer: see Layer-Aware Agent Routing)
2. **CHECK task-executor response**:
   - `status: "escalation_needed"` or `"blocked"` → STOP and escalate to user
   - `requiresTestReview` is `true` → Execute **integration-test-reviewer**, passing every path from the implementation step's `testsAdded` as `testFile`, `taskFiles: [the current task file path]` (so the reviewer can read the task's Operation Verification Methods and Verification Focus), `diffBase: HEAD` (this task's changes are uncommitted at this point, so HEAD is the base of its diff). Then branch on its `verdict.decision`
     - `needs_revision` → Return to step 1 and re-invoke task-executor in **Fix Mode** by passing the same `task_file` and the `requiredFixes[]` array as input
     - `blocked` → STOP and escalate to user, reporting `verdict.reason` and the review basis the reviewer could not establish
     - `approved` → Proceed to step 3
   - Otherwise → Proceed to step 3
3. **INVOKE quality-fixer**: Execute all quality checks and fixes (cross-layer: see Layer-Aware Agent Routing). **Always pass** the current task file path as `task_file` and the implementation step's `filesModified` array as `filesModified` (this scopes the stub-detection step to the task's actual write set; without it, quality-fixer falls back to `git diff HEAD`). Also pass the implementation step's `runnableCheck` so the substance check reads the upstream evidence instead of re-deriving it, and `qualityCommand` when technical-spec or a repo convention names the project's authoritative quality command, so every task in this run is verified by the same command
   - `stub_detected` → Return to step 1 and re-invoke task-executor in **Fix Mode** by passing the same `task_file` and the `incompleteImplementations[]` array as input
   - `blocked` → Escalate to user
   - `approved` → Proceed to step 4
4. **COMMIT on approval**: Execute git commit

### Security Review (After All Tasks Complete)

After all task cycles finish, invoke security-reviewer before the completion report:
1. **Agent tool** (subagent_type: "security-reviewer") → Pass Design Doc path and implementation file list
2. Check response:
   - `approved` or `approved_with_notes` → Proceed to completion report (include notes if present)
   - `needs_revision` → Apply Review Resolution to every finding, then invoke task-executor in **Fix Mode** with an explicit prompt carrying the `apply` finding objects verbatim, the union of file paths from `requiredFixes[].location` (parsed as `file[:line]`, take only the file part) as the affected paths, and the observable verification condition. Set `requiredFixes` to the security-reviewer array. Follow with quality-fixer, then re-invoke security-reviewer with `prior_feedback`.
   - `blocked` → Escalate to user

### Test Information Communication
After acceptance-test-generator execution, when invoking work-planner (subagent_type: "work-planner"), communicate per-lane:
- Integration test file path (from `generatedFiles.integration`) or null
- fixture-e2e test file path (from `generatedFiles.fixtureE2e`) or null
- service-integration-e2e test file path (from `generatedFiles.serviceE2e`) or null
- Per-lane absence reason (from `e2eAbsenceReason.fixtureE2e` / `e2eAbsenceReason.serviceE2e`) when that lane is null
- Explicit timing notes: integration tests are created alongside each phase implementation; fixture-e2e tests are created alongside the UI feature phase; service-integration-e2e tests are executed only in the final phase

### Final Cleanup

Before the completion report, delete the implementation task files this recipe consumed. Their work is committed; `docs/plans/` is ephemeral working state and is not retained between recipe runs.

This recipe is scale-agnostic and may execute single-layer or multi-layer plans, so cleanup must cover every task naming pattern task materialization can produce from the plan's executor lanes:

- Delete every file matching ANY of these patterns for the `{plan-name}` derived from the work plan path used in this run:
  - `docs/plans/tasks/{plan-name}-task-*.md` (single-layer tasks)
  - `docs/plans/tasks/{plan-name}-backend-task-*.md` (backend portion of multi-layer plan)
  - `docs/plans/tasks/{plan-name}-frontend-task-*.md` (frontend portion of multi-layer plan)
- From those matches, exclude `integration-tests-*-task-*.md` (this originates from another workflow phase)
- Preserve the work plan itself (`docs/plans/{plan-name}.md`) — the user decides whether to delete it after final review

If task files cannot be deleted (filesystem error), report the failure but do not block the completion report.

## Execution Method

All work is executed through sub-agents.
Sub-agent selection follows subagents-orchestration-guide skill.