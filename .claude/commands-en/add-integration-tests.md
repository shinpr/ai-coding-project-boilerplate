---
description: Add integration/E2E tests to existing codebase using Design Docs
---

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

```bash
# Verify at least one document path was provided
test -n "$ARGUMENTS" || { echo "ERROR: No document paths provided"; exit 1; }

# Verify provided paths exist
ls $ARGUMENTS

# Discover additional documents
ls docs/design/*.md 2>/dev/null | grep -v template
ls docs/ui-spec/*.md 2>/dev/null
```

Classify discovered documents by filename:
- Filename contains `backend` → **Design Doc (backend)**
- Filename contains `frontend` → **Design Doc (frontend)**
- Located in `docs/ui-spec/` → **UI Spec** (optional)
- None of the above → **single-layer Design Doc** (layer TBD in gate below)

**[GATE] Present classification results to user as candidates and ask for confirmation before proceeding.** The user may exclude irrelevant documents discovered by the automatic search. If a single-layer Design Doc is detected, ask the user whether it targets backend or frontend to determine correct agent routing.

### Step 2: Skeleton Generation

Invoke acceptance-test-generator **once per Design Doc** (the agent expects a single designDocPath):

For each Design Doc from Step 1:
- `subagent_type`: "acceptance-test-generator"
- `description`: "Generate test skeletons for [layer/name]"
- `prompt`: "Generate test skeletons from Design Doc at [path]." + If UI Spec exists: "UI Spec at [ui-spec path] is available as additional context."

**Expected output per invocation**: `generatedFiles` containing integration and e2e paths

### Step 3: Create Task Files [GATE]

**Pre-check**: For each Step 2 invocation result, inspect `generatedFiles.integration`:
- When `integration` is a path → proceed to task creation for that layer
- When `integration` is `null` → skip task creation for that layer; record the layer and the generator's `e2eAbsenceReason` (when applicable) for the final report
- When all layers return `integration: null` → skip Steps 4–7 entirely, report "No integration test skeletons generated for any layer" with each layer's reason, and exit

Create one task file per layer that has a non-null `integration` path, using the monorepo-flow.md naming convention for deterministic agent routing:
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

- Skeleton: [layer-specific paths from Step 2 generatedFiles]

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
- `prompt`: "Review test quality. Test files: [paths from Step 4 testsAdded]. Skeleton files: [layer-specific paths from Step 2 generatedFiles matching current task's layer]"

**Expected output**: `status` (approved/needs_revision), `requiredFixes`

### Step 6: Apply Review Fixes

Check Step 5 result:
- `status: approved` → Mark complete, proceed to Step 7
- `status: needs_revision` → Re-invoke the routed task-executor in **Fix Mode** with the same `task_file` and `requiredFixes[]` (see prompt detail below), then return to Step 5

Invoke task-executor routed by task filename pattern:
- `*-backend-task-*` → `subagent_type`: "task-executor"
- `*-frontend-task-*` → `subagent_type`: "task-executor-frontend"
- `description`: "Fix review findings"
- `prompt`: "task_file: [the same task file path used in Step 4]. requiredFixes: [the requiredFixes array from Step 5]. Apply Fix Mode (the task's checkboxes are already `[x]` from Step 4)."

### Step 7: Quality Check

Invoke quality-fixer routed by task filename pattern:
- `*-backend-task-*` → `subagent_type`: "quality-fixer"
- `*-frontend-task-*` → `subagent_type`: "quality-fixer-frontend"
- `description`: "Final quality assurance"
- `prompt`: "Final quality assurance for test files added in this workflow. Run all tests and verify coverage. task_file: [task file path]. filesModified: [extract from the most recent implementation step's response — Step 4 normally, or the union of Step 4 and Step 6 when a fix re-execution ran]."

**Expected output**: `status` (approved/stub_detected/blocked)

Check quality-fixer response:
- `stub_detected` → Return to Step 4 and re-invoke task-executor in **Fix Mode** by passing the same `task_file` and the `incompleteImplementations[]` array, then re-execute Steps 4→5→6→7
- `blocked` → Escalate to user
- `approved` → Proceed to Step 8

### Step 8: Commit

On `approved` from quality-fixer:
- Commit test files with appropriate message using Bash

## Scope Boundary for Subagents

Append the following block to every subagent prompt invoked from this recipe:

```
Scope boundary for subagents:
Operate within the task scope and referenced files in the prompt.
New files derived from the requested deliverable are in scope (e.g., test skeleton files specified by the recipe).
Use loaded skills to execute that scope.
Escalate when the required fix or investigation falls outside that scope.
```
