---
description: Add integration/E2E tests to existing codebase using Design Docs
---

**Explicit User Instruction**: The user explicitly instructs and authorizes every subagent call named in this recipe. Execute each applicable call when its prerequisites are met.

Execute the `llm-friendly-context` skill (using Skill tool) before writing Agent prompts, handoffs, or generated artifacts.
Execute the `subagents-orchestration-guide` skill before making workflow decisions, invoking agents, or resolving findings.

**Command Context**: Test addition workflow for existing implementations (backend, frontend, or fullstack)

## Orchestrator Definition

**Core Identity**: "I am an orchestrator."

**Execution Gate**: Complete Steps 1-7 in order for each generated layer. Advance only through the current step's stated output or response gate. Report completion after every layer completes review, quality assurance, commit, and the retained-limitation retry.

**Execution Method**:
- Skeleton generation → delegate to acceptance-test-generator
- Test implementation → delegate to task-executor
- Test review → delegate to integration-test-reviewer
- Quality checks → delegate to quality-fixer

Document paths: $ARGUMENTS

## Prerequisites

- At least one Design Doc must exist (created manually or via reverse-engineer)
- Existing implementation to test

## Execution Flow

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

Invoke acceptance-test-generator once per Design Doc:
- `subagent_type`: "acceptance-test-generator"
- `description`: "Generate test skeletons for [layer/name]"
- `prompt`: "Generate test skeletons from Design Doc at [path]." + When a UI Spec exists: "UI Spec at [ui-spec path] is available as additional context."

**Expected output per invocation**: `generatedFiles[]` containing the emitted skeleton paths. An empty list means no additional integration/E2E proof is required for that Design Doc.

When every result is empty, report that no additional integration/E2E proof artifact is required and finish.

### Step 3: Test Implementation

For each layer with generated skeletons, record the current `HEAD` as `diffBase`, then invoke its executor:
- Backend or single-layer backend → `subagent_type`: "task-executor"
- Frontend → `subagent_type`: "task-executor-frontend"
- `description`: "Implement integration tests"
- `direct_scope`: Implement every test defined by the layer-specific generated skeletons
- `governing_sources`: Layer-specific Design Doc, applicable UI Spec, and generated skeleton paths
- `target_paths`: Generated test paths and existing setup or fixture paths identified from the repository
- `observable_verification`: Execute the implemented tests and verify every skeleton claim at its declared boundary

Execute one layer at a time through Steps 3→4→5→6→7 before starting the next.

**Expected output**: `status`, `testsAdded`, `runnableCheck`

Apply Specialist Result Acceptance after every executor invocation. Proceed to Step 4 when the response and repository state confirm at least one changed integration/E2E test file; continue implementation while an advancing action remains.

### Step 4: Test Review

Invoke integration-test-reviewer:
- `subagent_type`: "integration-test-reviewer"
- `description`: "Review test quality"
- `testFile`: Confirmed changed integration/E2E test paths
- `diffBase`: Revision recorded before Step 3
- `designDocPath`: Layer-specific Design Doc
- In the prompt, name the generated skeleton paths as the claims being reviewed when their annotations are not present in the changed test files

**Expected output**: `status` (`approved`, `needs_revision`, or `blocked`), `qualityIssues[]`, and correction re-review `prior_feedback_reconciliation` when applicable

### Step 5: Apply Review Fixes

Check Step 4 result:
- `approved` → Proceed to Step 6
- `blocked` → Apply Specialist Result Acceptance
- `needs_revision` → Apply Review Resolution, re-invoke the same layer executor with the original Step 3 scope plus the complete `apply` quality-issue objects as `correction_findings`, then return to Step 4 with `prior_feedback`

### Step 6: Quality Check

Invoke the current layer's quality-fixer:
- Backend or single-layer backend → `subagent_type`: "quality-fixer"
- Frontend → `subagent_type`: "quality-fixer-frontend"
- `description`: "Final quality assurance"
- `direct_scope`: Reuse the Step 3 direct scope and affected paths
- `runnableCheck`: The latest executor result's `runnableCheck`
- `prompt`: "Run every repository-configured quality check applicable to the tests added in this workflow and verify their intended observable behavior."

**Expected output**: `status` (`approved`, `stub_detected`, `verification_incomplete`, or `blocked`)

Check the result:
- `stub_detected` → Return to Step 3 with `incompleteImplementations` unchanged, then re-execute Steps 3→4→5→6
- `blocked` → Apply Specialist Result Acceptance
- `verification_incomplete` → Retain the complete result for the Specialist Result Acceptance retry and proceed to Step 7
- `approved` → Proceed to Step 7

### Step 7: Commit and Retained-Limitation Retry

On `approved` or `verification_incomplete`, commit the completed test change using the repository's normal commit boundary and message convention.

After every layer has a clean commit boundary, apply the proof-limitation retry in Specialist Result Acceptance with the same layer quality-fixer inputs. Clear an `approved` result, route `stub_detected` through Steps 3→6, and retain a repeated `verification_incomplete` result for the completion report while continuing the workflow.

In the completion report, list each repeated verification limitation and each declined actionable finding with its ID, governing reason, and evidence when any occurred.

## Scope Boundary for Subagents

Append the following block to every subagent prompt invoked from this recipe:

```
Scope boundary for subagents:
Deliver the accepted test proof consistently across the repository responsibility that owns it.
Treat referenced paths as investigation starting points and include supporting test-harness files when the same proof requires them.
Keep governing artifacts read-only except for assigned progress fields.
Return to Requirement Change Detection when confirmed outcome, desired-future requirements, and non-goals cannot all remain true; request authorization when an irreversible external action is required.
```
