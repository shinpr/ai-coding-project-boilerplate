---
description: Orchestrate the complete implementation lifecycle from requirements to deployment
---

**Explicit User Instruction**: The user explicitly instructs and authorizes every subagent call named in this recipe. Execute each applicable call when its prerequisites are met.

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

### 5. Bind the Applicable Flow

After Structural Scale is determined, follow only that scale's applicable path. Treat each applicable design, review, approval, planning, implementation, verification, cleanup, and reporting phase as a gate. Advance only when the current phase's stated evidence or approval exists; skip only branches whose stated condition is false.

### 6. Execute Next Action

Execute the earliest applicable phase whose required evidence is not yet present.

## subagents-orchestration-guide skill Compliance Execution

**Pre-execution Checklist (Required)**:
- [ ] Confirmed relevant subagents-orchestration-guide skill flow
- [ ] Identified current progress position
- [ ] Clarified next step
- [ ] Recognized stopping points → **Use AskUserQuestion for confirmation at all Stop points**
- [ ] codebase-analyzer included before each Design Doc creation
- [ ] code-verifier included before document-reviewer for each Design Doc
- [ ] Understood the 4-step cycle after task execution (task-executor → user-boundary judgment/follow-up → quality-fixer → commit boundary check)

**Flow Adherence**: Follow the applicable Structural Scale flow and the 4-step task execution cycle in subagents-orchestration-guide. Advance only when the current phase or cycle step satisfies its stated transition condition.

## Scope Boundary for Subagents

Append the following block to every subagent prompt invoked from this recipe:

```
Scope boundary for subagents:
Deliver the task outcome consistently across the repository responsibility that owns it.
Treat referenced paths as investigation starting points and include supporting files when the same outcome requires them.
Keep governing artifacts read-only except for assigned progress fields.
Return to Requirement Change Detection when confirmed outcome, desired-future requirements, and non-goals cannot all remain true; request authorization when an irreversible external action is required.
```

Additionally, include the following constraint at the end of every sub-agent prompt, as rule-advisor invocation from sub-agents causes system crash:
```
[Constraint] rule-advisor can only be used by Main AI
```

## Mandatory Orchestrator Responsibilities

### Task Execution Quality Cycle
Execute the following dependency-ordered steps, advancing only when the current step's response condition is satisfied:
1. **INVOKE task-executor**: Execute implementation (cross-layer: see Layer-Aware Agent Routing). Medium/Large pass the task file. Small passes the approved outcome, governing sources, affected paths, and verification condition directly; do not create a task file.
2. **CHECK task-executor response**:
   - `status: "escalation_needed"` or `"blocked"` → Apply subagents-orchestration-guide Specialist Result Acceptance
   - `requiresTestReview` is `true` → Execute **integration-test-reviewer**, passing the changed integration/E2E test paths and `diffBase: HEAD`. For Medium/Large also pass `taskFiles: [the current task file path]`; for Small pass the direct scope's verification claims instead. Then branch on its `status`
     - `needs_revision` → Apply Review Resolution and return to step 1 with the original execution scope plus the complete `apply` quality-issue objects passed verbatim as `correction_findings`
     - `blocked` → Resolve moved or renamed test paths from the current diff and re-run when the resolved input changes the review target. If no readable changed test exists despite `requiresTestReview: true`, return that executor-output defect to step 1 as `correction_findings`; otherwise record the review as not run with its `blockingReason` and proceed to step 3
     - `approved` → Proceed to step 3
   - Otherwise → Proceed to step 3
3. **INVOKE quality-fixer**: Execute all quality checks and fixes against the complete current uncommitted worktree, including untracked, deleted, and renamed paths (cross-layer: see Layer-Aware Agent Routing). Medium/Large also pass the current `task_file`; Small passes the direct execution scope. Pass the implementation step's `runnableCheck` and `qualityCommand` when the governing source or repository convention names one.
   - `stub_detected` → Return to step 1 and re-invoke task-executor with the original execution scope and `incompleteImplementations[]`
   - `blocked` → Apply Specialist Result Acceptance
   - `verification_incomplete` → Retain the complete result for final retry and proceed to step 4
   - `approved` → Proceed to step 4
4. **COMMIT**: Commit the completed task change set after `approved` or `verification_incomplete`

### Post-Implementation Review (Medium/Large, After All Tasks Complete)

Apply the proof-limitation retry in subagents-orchestration-guide Specialist Result Acceptance before the document-dependent reviewers. Continue after clearing or retaining each result and report only repeated limitations.

Resolve the Work Plan's readable Design Doc; missing input blocks review.

Emit these Agent calls in one assistant message, then await both:
- code-reviewer (subagent_type: "code-reviewer") → review the completed implementation with the resolved typed `governingDocuments`, the actual files changed by completed tasks as `implementationFiles`, and the Work Plan path
- security-reviewer (subagent_type: "security-reviewer") → review the completed implementation against the same typed `governingDocuments`

Apply subagents-orchestration-guide's Post-Implementation Review status-routing and fix/re-run rules. Present the unified report; proceed to Final Cleanup after the complete review set reaches Review Resolution convergence.

For Small, skip this document-dependent review. Retry a retained verification limitation once after the task commit; complete with observed `observable_verification` evidence and report any proof that remains unavailable.

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
