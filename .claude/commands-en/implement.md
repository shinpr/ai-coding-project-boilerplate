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

When the orchestrator determines from `scopeEvidence.affectedLayers` that the work spans backend and frontend, follow the Cross-Layer Orchestration section in subagents-orchestration-guide skill.

### 4. After requirement-analyzer [Stop]

Use `requestSignals`, `scopeEvidence`, `costEvidence`, and `questions` to run the requirement-convergence hearing. The orchestrator judges the convergence record and Structural Scale.

When user responds to questions:
- Record the answer in the convergence record and re-judge the affected field and Structural Scale
- Re-execute requirement-analyzer only when the answer changes the analysis target or required scope evidence
- Proceed when every applicable convergence field is `ready` or `weak-but-explicit`

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
- [ ] Understood the 4-step cycle after task execution (task-executor → user-boundary judgment/follow-up → quality-fixer → commit boundary check)

**Flow Adherence**: Follow "Autonomous Execution Task Management" in subagents-orchestration-guide skill, managing 4 steps with TaskCreate/TaskUpdate

## Scope Boundary for Subagents

Append the following block to every subagent prompt invoked from this recipe:

```
Scope boundary for subagents:
Deliver the task outcome consistently across the repository responsibility that owns it.
Treat referenced paths as investigation starting points and include supporting files when the same outcome requires them.
Keep governing artifacts read-only except for assigned progress fields.
Escalate when progress requires a user-owned product, public-contract, major-design, authority, or irreversible decision.
```

Additionally, include the following constraint at the end of every sub-agent prompt, as rule-advisor invocation from sub-agents causes system crash:
```
[Constraint] rule-advisor can only be used by Main AI
```

## Mandatory Orchestrator Responsibilities

### Task Execution Quality Cycle
Following "Autonomous Execution Task Management" in subagents-orchestration-guide skill, manage these steps with TaskCreate/TaskUpdate:
1. **INVOKE task-executor**: Execute implementation (cross-layer: see Layer-Aware Agent Routing). Medium/Large pass the task file. Small passes the approved outcome, governing sources, affected paths, and verification condition directly; do not create a task file.
2. **CHECK task-executor response**:
   - `status: "escalation_needed"` or `"blocked"` → inspect the declared boundary; escalate when it requires a user-owned decision
   - `requiresTestReview` is `true` → Execute **integration-test-reviewer**, passing the changed integration/E2E test paths and `diffBase: HEAD`. For Medium/Large also pass `taskFiles: [the current task file path]`; for Small pass the direct scope's verification claims instead. Then branch on its `status`
     - `needs_revision` → Apply Review Resolution and return to step 1 with the complete `apply` quality-issue objects passed verbatim to task-executor in **Fix Mode**
     - `blocked` → Resolve moved or renamed test paths from the current diff and re-run when the resolved input changes the review target. If no readable changed test exists despite `requiresTestReview: true`, return that executor-output defect to step 1 in **Fix Mode**; otherwise retain the proof limitation
     - `approved` → Proceed to step 3
   - Otherwise → Proceed to step 3
3. **INVOKE quality-fixer**: Execute all quality checks and fixes against the complete current uncommitted worktree, including untracked, deleted, and renamed paths (cross-layer: see Layer-Aware Agent Routing). Medium/Large also pass the current `task_file`; Small passes the direct execution scope. Pass the implementation step's `runnableCheck` and `qualityCommand` when the governing source or repository convention names one.
   - `stub_detected` → Return to step 1 and re-invoke task-executor in **Fix Mode** with the original execution scope and `incompleteImplementations[]`
   - `blocked` → Escalate the user-owned decision
   - `approved` or `verification_incomplete` → Proceed to step 4
4. **COMMIT coherent task boundary**: Apply the guide's Commit Boundary Check; preserve any verification limitation in commit trailers and orchestration state

### Post-Implementation Verification

For Medium/Large, after all task cycles finish, invoke code-verifier and security-reviewer before the completion report. Pass the Design Doc and implementation file list to code-verifier; pass `governingDocuments: [{"type":"design-doc","path":"[path]"}]` and the same implementation file list to security-reviewer. Apply the guide's pass/fail and fix-cycle rules.

For Small, skip document-dependent verification. Retry retained limitations, then complete after quality-fixer approval and successful execution of the direct scope's observable verification.

For the security-reviewer response:

   - `approved` → Proceed to completion report
   - `needs_revision` → Apply Review Resolution to every finding, then invoke task-executor in **Fix Mode** with the `apply` finding objects verbatim, their affected paths, and the observable verification condition. Follow with quality-fixer, then re-invoke security-reviewer with `prior_feedback`.
   - `blocked` → Escalate to user

### Test Information Communication
After acceptance-test-generator execution, when invoking work-planner (subagent_type: "work-planner"), communicate per-lane:
- Integration test file path (from `generatedFiles.integration`) or null
- fixture-e2e test file path (from `generatedFiles.fixtureE2e`) or null
- service-integration-e2e test file path (from `generatedFiles.serviceE2e`) or null
- A null lane communicates that the accepted obligations require no proof at that boundary; pass the null value unchanged
- Explicit timing notes: integration tests are created alongside each phase implementation; fixture-e2e tests are created alongside the UI feature phase; service-integration-e2e tests are executed after their required services exist

### Final Cleanup

For Medium/Large only, before the completion report, delete the implementation task files this recipe consumed. Small creates no task files. The consumed task files are ephemeral working state and are not retained between recipe runs.

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
