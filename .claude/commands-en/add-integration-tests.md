---
description: Add integration/E2E tests to existing codebase using Design Docs
---

Execute the `llm-friendly-context` skill (using Skill tool) before writing Agent prompts, handoffs, or generated artifacts.

**Command Context**: Test addition workflow for existing implementations (backend, frontend, or fullstack)

## Orchestrator Definition

**Core Identity**: "I am not a worker. I am an orchestrator."

**First Action**: Register Steps 0-8 with TaskCreate before any execution.

**Why Delegate**: Orchestrator's context is shared across all steps. Direct implementation consumes context needed for review and quality check phases. Task files create context boundaries. Subagents work in isolated context.

**Execution Method**:
- Skeleton generation → delegate to acceptance-test-generator
- Task file creation → orchestrator creates directly (minimal context usage)
- Test implementation → delegate to task-executor
- Test review → delegate to integration-test-reviewer
- Quality checks → delegate to quality-fixer

Document paths: $ARGUMENTS

## Prerequisites

- At least one Design Doc must exist (created manually or via reverse-engineer)
- Existing implementation to test

## Execution Flow

### Step 0: Execute Skill

Execute Skill: documentation-criteria (for task file template in Step 3)

### Step 1: Discover and Validate Documents

Resolve every explicit path in `$ARGUMENTS`, including moved or renamed paths. Then inspect repository documentation locations and metadata for related Design Docs and UI Specs. Conventional `docs/design/` and `docs/ui-spec/` locations are discovery hints rather than required layout.

Classify discovered documents from their declared scope and content:
- backend contracts, persistence, or service responsibilities → **Design Doc (backend)**
- components, UI state, browser behavior, or frontend responsibilities → **Design Doc (frontend)**
- screen/state/interaction specification responsibility → **UI Spec** (optional)
- one responsibility with an ambiguous lane → **single-layer Design Doc** (resolve its executor lane from referenced code and repository ownership)

Continue with documents explicitly named by the user and semantically related artifacts they reference. Ask for confirmation only when multiple plausible document sets or executor lanes would materially change the generated tests.

Skeleton generation begins after Step 1 has resolved a readable Design Doc and identified its accepted behavior.

### Step 2: Skeleton Generation

Invoke acceptance-test-generator **once per Design Doc** (the agent expects a single designDocPath):

For each Design Doc from Step 1:
- `subagent_type`: "acceptance-test-generator"
- `description`: "Generate test skeletons for [layer/name]"
- `prompt`: "Generate test skeletons from Design Doc at [path]." + If UI Spec exists: "UI Spec at [ui-spec path] is available as additional context."

**Expected output per invocation**: `generatedFiles[]` containing the emitted skeleton paths

### Step 3: Create Task Files [GATE]

**Pre-check**: For each Step 2 invocation result, inspect `generatedFiles[]`:
- When it contains emitted files → proceed to task creation for that layer
- When it is empty → skip task creation for that layer; existing or cheaper tests cover its accepted obligations
- When every result is empty → skip Steps 4–7 entirely, report that no additional integration/E2E proof artifact is required, and exit

Create one task file per layer that has generated files, using the monorepo-flow.md naming convention for deterministic agent routing:
- Backend Design Doc → `docs/plans/tasks/integration-tests-backend-task-YYYYMMDD.md`
- Frontend Design Doc → `docs/plans/tasks/integration-tests-frontend-task-YYYYMMDD.md`
- Single-layer confirmed as backend → `docs/plans/tasks/integration-tests-backend-task-YYYYMMDD.md`
- Single-layer confirmed as frontend → `docs/plans/tasks/integration-tests-frontend-task-YYYYMMDD.md`

**Template** (per task file):
```markdown
---
name: Implement [layer] integration tests for [feature name]
type: test-implementation
---

## Objective

Implement test cases defined in skeleton files.

## Target Files

- Skeletons: [every path in the layer's Step 2 generatedFiles]

## Investigation Targets

- Design Doc: [layer-specific Design Doc from Step 1] — reference for AC mapping and contract definitions

## Investigation Notes
(Implementation observations are appended here before implementation begins.)

## Tasks

- [ ] Implement each test case in skeleton
- [ ] Verify all tests pass
- [ ] Ensure coverage meets requirements

## Acceptance Criteria

- All skeleton test cases implemented
- All tests passing
- No quality issues
```

**Output**: "Task file(s) created at [path(s)]. Ready for Step 4."

### Step 4: Test Implementation

For each task file from Step 3, invoke task-executor routed by filename pattern:
- `*-backend-task-*` → `subagent_type`: "task-executor"
- `*-frontend-task-*` → `subagent_type`: "task-executor-frontend"
- `description`: "Implement integration tests"
- `prompt`: "Task file: [task file path from Step 3]. Implement tests following the task file."

Execute one task file at a time through Steps 4→5→6→7 before starting the next.

**Expected output**: `status`, `testsAdded`

### Step 5: Test Review

Invoke integration-test-reviewer using Agent tool:
- `subagent_type`: "integration-test-reviewer"
- `description`: "Review test quality"
- `prompt`: "Review test quality. Test files: [paths from Step 4 testsAdded]. taskFiles: [the same task file path used in Step 4]. diffBase: HEAD. Skeleton files: [every path from the current layer's Step 2 generatedFiles]"

**Expected output**: `status` (approved/needs_revision/blocked), `blockingReason`, and the single `qualityIssues[]` correction list

### Step 6: Apply Review Fixes

Check Step 5 result, branching on `status`:
- `approved` → Mark complete, proceed to Step 7
- `needs_revision` → Apply Review Resolution, re-invoke the routed task-executor in **Fix Mode** with the complete `apply` quality-issue objects, then return to Step 5
- `blocked` → Resolve moved or renamed test paths from the current diff and re-run when the corrected input changes the review target. If the executor produced no readable changed test, return to Step 4 and correct its result; otherwise retain the unproved review for final reporting

Invoke task-executor routed by task filename pattern:
- `*-backend-task-*` → `subagent_type`: "task-executor"
- `*-frontend-task-*` → `subagent_type`: "task-executor-frontend"
- `description`: "Fix review findings"
- `prompt`: "task_file: [the same task file path used in Step 4]. requiredFixes: [complete `apply` quality-issue objects from Step 5, copied verbatim with only their dispositions added]. Apply Fix Mode (the task's checkboxes are already `[x]` from Step 4)."

### Step 7: Quality Check

Invoke quality-fixer routed by task filename pattern:
- `*-backend-task-*` → `subagent_type`: "quality-fixer"
- `*-frontend-task-*` → `subagent_type`: "quality-fixer-frontend"
- `description`: "Final quality assurance"
- `prompt`: "Final quality assurance for the complete current uncommitted worktree. Run all applicable checks. task_file: [task file path]."

**Expected output**: `status` (approved/verification_incomplete/stub_detected/blocked)

Check quality-fixer response:
- `stub_detected` → Return to Step 4 and re-invoke task-executor in **Fix Mode** by passing the same `task_file` and the `incompleteImplementations[]` array, then re-execute Steps 4→5→6→7
- `blocked` → Escalate the user-owned decision reported by quality-fixer
- `approved` or `verification_incomplete` → Proceed to Step 8

### Step 8: Commit

Apply the subagents-orchestration-guide Commit Boundary Check and commit the coherent test task. For `verification_incomplete`, add the limitation trailers and retain the structured limitations for retry before completion.

### Step 9: Final Cleanup

Retry every retained verification limitation whose prerequisite may now be available. A remaining limitation produces a `blocked` completion result naming the unproved test claim and retry condition; committed task checkpoints remain intact.

After all task files have been processed and committed, delete the task files this recipe created. Their work is committed; `docs/plans/` is ephemeral working state and is not retained between recipe runs:

- Delete every file matching `docs/plans/tasks/integration-tests-backend-task-*.md` and `docs/plans/tasks/integration-tests-frontend-task-*.md` created during this run

If a filesystem error leaves task files behind, continue completion with that cleanup failure recorded.

## Scope Boundary for Subagents

Append the following block to every subagent prompt invoked from this recipe:

```
Scope boundary for subagents:
Deliver the accepted test proof consistently across the repository responsibility that owns it.
Treat referenced paths as investigation starting points and include supporting test-harness files when the same proof requires them.
Keep governing artifacts read-only except for assigned progress fields.
Escalate when progress requires a user-owned product, public-contract, major-design, authority, or irreversible decision.
```
