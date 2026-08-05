---
name: subagents-orchestration-guide
description: Coordinates subagents through scale-based planning, approval, implementation, verification, and escalation flows. Use when routing work to subagents, executing an approved work plan, or resuming autonomous execution.
---

# Sub-agents Practical Guide - Orchestration Guidelines for Claude (Me)

This document provides practical behavioral guidelines for me (Claude) to efficiently process tasks by utilizing subagents.

## Core Principle: I Am an Orchestrator

**Role Definition**: I am an orchestrator, not an executor.

### Required Actions
- **New tasks**: Start with requirement-analyzer and select the flow from its recorded scale result
- **During flow execution**: Follow the selected scale flow and its transition conditions
- **Each phase**: Delegate the phase to the agent whose declared responsibility matches its output
- **Stop points**: Continue only after the required user approval is recorded
- **Investigation**: Delegate all investigation to requirement-analyzer or codebase-analyzer (Grep/Glob/Read are specialist-internal tools)
- **Analysis/Design**: Delegate to the specialist whose declared responsibilities include the required output
- **First action**: Pass user requirements to requirement-analyzer before any other step

### First Action Rule

When receiving a new task, pass user requirements directly to requirement-analyzer. Determine the workflow based on its scale assessment result.

requirement-analyzer returns a `convergence` object. Run the requirement-convergence hearing protocol at the requirements stop point on that output, recording each step's evidence, then re-invoke requirement-analyzer with the answers so the record is re-judged. The hearing runs in the orchestrator because it requires AskUserQuestion, and runs after the analysis because the orchestrator investigates nothing itself.

### Requirement Change Detection During Flow

**During flow execution**, if detecting the following in user response, stop flow and go to requirement-analyzer:
- Mentions of new features/behaviors (additional operation methods, display on different screens, etc.)
- Additions of constraints/conditions (data volume limits, permission controls, etc.)
- Changes in technical requirements (processing methods, output format changes, etc.)

When any condition applies, record the integrated requirements and restart from requirement-analyzer.

## Subagents I Can Utilize

### Implementation Support Agents
1. **quality-fixer**: Self-contained processing for overall quality assurance and fixes until completion
2. **task-decomposer**: Materialize each approved work plan implementation item as one task-template file, preserving its declared boundary and dependencies
3. **task-executor**: Individual task execution and structured response
4. **integration-test-reviewer**: Review integration/E2E tests for skeleton compliance
5. **security-reviewer**: Security compliance review against Design Doc and project coding standards after all tasks complete

### Document Creation Agents
6. **requirement-analyzer**: Requirement analysis and work scale determination (WebSearch enabled, latest technical information research)
7. **codebase-analyzer**: Analyze existing codebase to produce focused guidance for technical design
8. **prd-creator**: Product Requirements Document creation (WebSearch enabled, market trend research)
9. **ui-spec-designer**: UI Specification creation from PRD and optional prototype code (frontend/fullstack features)
10. **technical-designer**: ADR/Design Doc creation (latest technology research, Property annotation assignment)
11. **work-planner**: Work plan creation from Design Doc and test skeletons
12. **document-reviewer**: Single document quality, completeness, and rule compliance check
13. **code-verifier**: Verify document-code consistency. Pre-implementation: Design Doc claims against existing codebase. Post-implementation: implementation against Design Doc
14. **design-sync**: Design Doc consistency verification (detects explicit conflicts only)
15. **acceptance-test-generator**: Generate separate integration and E2E test skeletons from Design Doc ACs and optional UI Spec
16. **ui-analyzer**: Gather UI facts (external sources + existing UI code) for frontend design preparation — read-only

## My Orchestration Principles

### Delegation Boundary: What vs How

I pass **what to accomplish** and **where to work**. Each specialist determines **how to execute** autonomously.

**I pass to specialists** (what/where/constraints):
- Task file path — executor agents (task-executor, task-decomposer) receive a task file path; broader scope requires explicit user request
- Target directory or package scope — for discovery/review agents (codebase-analyzer, code-verifier, security-reviewer, integration-test-reviewer)
- Acceptance criteria and hard constraints from the user or design artifacts

**I let specialists determine** (how):
- Specific commands to run (specialists discover these from project configuration and repo conventions)
- Execution order and tool flags
- Executor/fixer agents: which files to inspect or modify within the given scope
- Review/discovery agents: which files to inspect within the given scope (read-only access)

| | Bad (I prescribe how) | Good (I pass what) |
|---|---|---|
| quality-fixer | "Run these checks: 1. lint 2. test" | "Execute all quality checks and fixes" |
| task-executor | "Edit file X and add handler Y" | "Task file: docs/plans/tasks/003-feature.md" |

**Decision precedence when outputs conflict**:
1. User instructions (explicit requests or constraints)
2. Task files and design artifacts (Design Doc, PRD, work plan)
3. Objective repo state (git status, file system, project configuration)
4. Specialist judgment

When two specialists conflict, or when a specialist conflicts with my expectation, I apply the precedence order above. I verify against objective repo state (item 3). I follow specialist output when it aligns with items 1 and 2. When specialist output conflicts with user instructions or design artifacts, I follow user instructions first, then design artifacts.

When a specialist cannot determine execution method from repo state and artifacts, the specialist escalates as blocked. I then escalate to the user with the specialist's blocked details.

### Review Resolution

Apply `references/review-resolution.md` to actionable deliverable-review findings. I decide dispositions, validate results, and route work; the named specialist produces or changes deliverables. That reference owns the finding-level correction loop end to end: disposition assignment, verbatim `apply` handoff, `prior_feedback` re-review, and the convergence and escalation conditions.

### Task Assignment with Responsibility Separation

I understand each subagent's responsibilities and assign work appropriately:

**task-executor Responsibilities** (DELEGATE these):
- Implementation work and test addition
- Confirmation that the added tests pass; repository-wide quality assurance remains the quality-fixer responsibility

**quality-fixer Responsibilities** (DELEGATE these):
- Overall quality assurance (type check, lint, ALL test execution)
- Complete execution of quality error fixes
- Self-contained processing until fix completion
- Final approved judgment (ONLY after all fixes are complete)

### Standard Flow I Manage

**Basic Cycle**: I manage the 4-step cycle of `task-executor -> escalation judgment/follow-up -> quality-fixer -> commit`.
I repeat this cycle for each task to ensure quality.

**Layer-Aware Routing**: For cross-layer features, select executor and quality-fixer by task filename pattern (see Cross-Layer Orchestration).

## Constraints Between Subagents

**Important**: Subagents cannot directly call other subagents. When coordinating multiple subagents, the main AI (Claude) operates as the orchestrator.

## Scale Determination and Document Requirements

The file-count ranges below set the floor. documentation-criteria skill's Structural Escalation raises the confirmed scale — and therefore the required-document row — when any ADR Creation Condition applies, and it only raises a level.

| Scale | Baseline File Count | PRD | ADR | Design Doc | Work Plan |
|-------|---------------------|-----|-----|------------|-----------|
| Small | 1-2 | Update[^1] | Not needed | Not needed | Not needed — task-executor runs from an explicit prompt |
| Medium | 3-5 | Update[^1] | Conditional[^2] | **Required** | **Required** |
| Large | 6+ | **Required**[^3] | Conditional[^2] | **Required** | **Required** |

[^1]: Update existing PRD if one exists for the relevant feature
[^2]: Required when: architecture changes, new technology introduction, OR data flow changes
[^3]: Create new PRD, update existing PRD, or create reverse PRD (when no existing PRD)

## Structured Response Specifications

All subagent invocation uses the **Agent tool** with:
- `subagent_type`: Agent name (e.g., "task-executor")
- `description`: Concise task description (3-5 words)
- `prompt`: Specific instructions including deliverable paths

### Orchestrator's Permitted Tools

The orchestrator coordinates work using only the following tools:

| Tool | Purpose |
|------|---------|
| Agent | Invoke subagents |
| AskUserQuestion | User confirmations and questions |
| TaskCreate / TaskUpdate | Progress tracking |
| Bash | Shell operations (git commit, ls, verification commands) |
| Read | Deliverable documents for information bridging between subagents |

All implementation work (Edit, Write, MultiEdit) is performed by subagents, not the orchestrator.

### Subagent Response Format

Subagents respond in JSON. Each agent declares its own input and output contract — read that contract from the agent when composing a call. This table carries only the signal I branch on and the action each value selects.

| Agent | I branch on | Action per value |
|---|---|---|
| requirement-analyzer | `scale`, `adrRequired`, `convergence` | Select the flow by `scale` — it already includes Structural Escalation. Add the ADR step when `adrRequired`. Run the requirement-convergence hearing on `convergence` before proceeding |
| codebase-analyzer / ui-analyzer | — | Pass the full JSON unchanged to the next specialist; each consumes the fields its own input declaration names |
| task-executor / task-executor-frontend | `status`, `escalation_type`, `requiresTestReview` | `completed` → continue the cycle. `escalation_needed` → handle by `escalation_type` as the agent defines it, presenting any user-decision items. `requiresTestReview: true` → run integration-test-reviewer before quality-fixer |
| quality-fixer / quality-fixer-frontend | `status` | `approved` → commit. `stub_detected` → return `incompleteImplementations[]` to the implementation step, then re-run. `blocked` → see quality-fixer Blocked Handling below |
| document-reviewer | `verdict.decision` | `approved` → proceed. `needs_revision` → run Review Resolution. `rejected` → escalate. Read `recommendations` for checks that did not run before treating an approval as full-scope |
| integration-test-reviewer | `verdict.decision` | `approved` → proceed. `needs_revision` → run Review Resolution. `blocked` → escalate with `verdict.reason`. Top-level `status` is the verification outcome axis, not the routing decision |
| code-verifier / security-reviewer | `summary.status` / `status` | See Post-Implementation Verification Pass/Fail Criteria. A security `blocked` raised by an irreversible-operation hazard names the decision it requires and sits outside the agent layer's authority |
| design-sync | `sync_status` | `CONFLICTS_FOUND` → present the conflicts to the user before proceeding |
| acceptance-test-generator | per-lane `generatedFiles`, per-lane `e2eAbsenceReason` | Verify each non-null path exists, then pass the per-lane paths and absence reasons to work-planner |

**Cross-agent wiring I own**: carry the implementation step's `filesModified` and `runnableCheck` into the following quality-fixer call, and the project's authoritative quality command as `qualityCommand` when the recipe or technical-spec names one.

### quality-fixer Blocked Handling

When quality-fixer returns `status: "blocked"`, discriminate by `reason`:
- `"Cannot determine due to unclear specification"` → read `blockingIssues[]` for specification details
- `"Execution prerequisites not met"` → read `missingPrerequisites[]` with `resolutionSteps` and present to user as actionable next steps
- `"Quality failure outside current task scope"` → present `outOfScopeFailures[]` and `needsUserDecision` to the user and stop. Re-invoke quality-fixer only when the user expands the task scope to include the failure

## My Basic Flow: Planning and Implementation

When receiving new features or change requests, I first request requirement analysis from requirement-analyzer.
According to scale determination:

### Large Scale (6+ Files) - 14 Steps (backend) / 16 Steps (frontend/fullstack)

1. requirement-analyzer → Requirement analysis + Check existing PRD → requirement-convergence hearing, re-invoking requirement-analyzer with the answers **[Stop]**
2. prd-creator → PRD creation (receives the convergence record)
3. document-reviewer → PRD review **[Stop: PRD Approval]**
4. **(frontend/fullstack only)** Ask user for prototype code → ui-spec-designer → UI Spec creation
5. **(frontend/fullstack only)** document-reviewer → UI Spec review **[Stop: UI Spec Approval]**
6. technical-designer → ADR creation (if architecture/technology/data flow changes)
7. document-reviewer → ADR review (if ADR created) **[Stop: ADR Approval]**
8. codebase-analyzer → Codebase analysis (pass requirement-analyzer output + PRD path)
9. technical-designer → Design Doc creation (pass codebase-analyzer output as additional context; cross-layer: per layer, see Cross-Layer Orchestration)
10. code-verifier → Verify Design Doc against existing code (doc_type: design-doc)
11. document-reviewer → Design Doc review (pass code-verifier results as code_verification; cross-layer: per Design Doc)
12. design-sync → Consistency verification **[Stop: Design Doc Approval]**
13. acceptance-test-generator → Test skeleton generation, pass to work-planner (*1)
14. work-planner → Work plan creation
15. document-reviewer → Work plan review (doc_type: WorkPlan; pass the Design Doc path so AC/contract/state coverage is traceable). Run Review Resolution through its correction re-review, escalation, and convergence transitions, using work-planner in update mode for rerouted corrections. On `rejected`: escalate to user. **[Stop: Batch approval]**
16. task-decomposer → Autonomous execution → Completion report

### Medium Scale (3-5 Files) - 10 Steps (backend) / 12 Steps (frontend/fullstack)

1. requirement-analyzer → Requirement analysis → requirement-convergence hearing, re-invoking requirement-analyzer with the answers **[Stop]**
2. **(frontend/fullstack only)** Ask user for prototype code → ui-spec-designer → UI Spec creation (UI Spec informs component structure for technical design)
3. **(frontend/fullstack only)** document-reviewer → UI Spec review **[Stop: UI Spec Approval]**
4. codebase-analyzer → Codebase analysis (pass requirement-analyzer output)
5. technical-designer → Design Doc creation (pass codebase-analyzer output as additional context; cross-layer: per layer, see Cross-Layer Orchestration)
6. code-verifier → Verify Design Doc against existing code (doc_type: design-doc)
7. document-reviewer → Design Doc review (pass code-verifier results as code_verification; cross-layer: per Design Doc)
8. design-sync → Consistency verification **[Stop: Design Doc Approval]**
9. acceptance-test-generator → Test skeleton generation, pass to work-planner (*1)
10. work-planner → Work plan creation
11. document-reviewer → Work plan review (doc_type: WorkPlan; pass the Design Doc path so AC/contract/state coverage is traceable). Run Review Resolution through its correction re-review, escalation, and convergence transitions, using work-planner in update mode for rerouted corrections. On `rejected`: escalate to user. **[Stop: Batch approval]**
12. task-decomposer → Autonomous execution → Completion report

### Small Scale (1-2 Files) - 2 Steps

1. requirement-analyzer → Requirement analysis and confirmed Small scale → requirement-convergence hearing, re-invoking requirement-analyzer with the answers **[Stop]**. The hearing runs at every scale, because `nonGoals` is user-authored and no agent can supply it. When Structural Escalation raises the scale, switch to the Medium flow from this point. Present the confirmed outcome, affected paths, and verification condition **[Stop: Batch approval]**
2. task-executor → quality-fixer → commit → Completion report

Note: At Small scale no Work Plan and no task file are produced. The implementation step still runs through task-executor with the standard 4-step cycle (`task-executor → escalation judgment → quality-fixer → commit`), receiving the confirmed outcome, governing sources, affected paths, and verification condition as an explicit prompt. Direct orchestrator edits are not used.

## Cross-Layer Orchestration

When requirement-analyzer determines the feature spans multiple layers (backend + frontend) via `crossLayerScope`, the following extensions apply. Step numbers below follow the large-scale flow. For medium-scale cross-layer flows, replace the single codebase-analysis and Design Doc segment with the same backend-first, frontend-second sequence below; use the named phase transitions rather than reusing large-flow step numbers.

### Design Phase Extensions

Replace the standard Design Doc creation step with per-layer creation:

| Step | Agent | Purpose |
|------|-------|---------|
| 8 | codebase-analyzer ×2 | Codebase analysis per layer (pass req-analyzer output, filtered to layer) |
| 9 | technical-designer | Backend Design Doc (with backend codebase-analyzer context) |
| 10 | code-verifier | Verify Backend Design Doc against existing code (its result JSON becomes `prior_layer_verification` for step 12) |
| 11 | document-reviewer | Review Backend Design Doc (pass step-10 result as `code_verification` and backend codebase-analyzer JSON as `codebase_analysis`). **[Stop on critical issues]** — structural defects here block step 12. |
| 12 | technical-designer-frontend | Frontend Design Doc (with frontend codebase-analyzer context + reviewed Backend Design Doc + `prior_layer_verification` from step 10 + UI Spec) |
| 13 | code-verifier | Verify Frontend Design Doc against existing code |
| 14 | document-reviewer | Review Frontend Design Doc (pass step-13 result as `code_verification` and frontend codebase-analyzer JSON as `codebase_analysis`). **[Stop on critical issues]** — structural defects here block step 15. |
| 15 | design-sync | Cross-layer consistency verification **[Stop]** |

The `codebase-analyzer ×2` invocations can run in parallel. The backend path (steps 9-11) runs sequentially before step 12 so that the frontend designer reads a backend Design Doc whose structural defects (AC gaps, Fact Disposition Table issues, Verification Strategy defects) have already been surfaced by document-reviewer, and whose code/doc discrepancies have already been enumerated by code-verifier. The frontend designer can then identify which backend contracts have known issues via `prior_layer_verification.discrepancies[]` and the step-11 review feedback, and design around those unstable surfaces (route integration points to stable contracts, or record the dependency in `## Cross-Layer Assumptions`).

**Layer Context in Design Doc Creation**:
- **Backend**: "Create a backend Design Doc from PRD at [path]. Codebase analysis: [JSON from codebase-analyzer for backend layer]. Focus on: API contracts, data layer, business logic, service architecture."
- **Frontend**: "Create a frontend Design Doc from PRD at [path]. Codebase analysis: [JSON from codebase-analyzer for frontend layer]. Reviewed Backend Design Doc at [path] — extract API contracts and Integration Points from this document to populate the frontend Integration Point Map. Backend review findings: [critical/important issues from step-11 document-reviewer, if any]. prior_layer_verification: [JSON from code-verifier on backend Design Doc]. Identify unstable backend contracts via `prior_layer_verification.discrepancies[]` and the review findings; limit verified-claim inference to what the verifier output states explicitly. For contracts you must depend on that remain unverified, list them in the `## Cross-Layer Assumptions` section with justification and verification target. Reference UI Spec at [path] for component structure. Focus on: component hierarchy, state management, UI interactions, data fetching."

**design-sync**: Use frontend Design Doc as source. design-sync auto-discovers other Design Docs in `docs/design/` for comparison.

### Work Planning with Multiple Design Docs

Pass all Design Docs to work-planner with vertical slicing instruction:
- Provide all Design Doc paths explicitly
- Instruct: "Compose phases as vertical feature slices — each phase should contain both backend and frontend work for the same feature area, enabling early integration verification per phase."

### Layer-Aware Agent Routing

During autonomous execution, route agents by task filename pattern. This table also defines the two executor lanes a work plan task entry selects between:

| Executor lane | Filename Pattern | Executor | Quality Fixer |
|---|---|---|---|
| `backend` | `*-task-*` or `*-backend-task-*` | task-executor | quality-fixer |
| `frontend` | `*-frontend-task-*` | task-executor-frontend | quality-fixer-frontend |

A work plan task entry records exactly one lane; task materialization copies that value and selects the filename from this table rather than inferring the layer from target paths.

## Autonomous Execution Mode

### Authority Delegation

**After starting autonomous execution mode**:
- Batch approval for entire implementation phase delegates authority to subagents
- task-executor: Implementation authority (can use Edit/Write)
- quality-fixer: Fix authority (automatic quality error fixes)

### Step 2 Execution Details
- `status: escalation_needed` or `status: blocked` -> Escalate to user
- `requiresTestReview` is `true` -> Execute **integration-test-reviewer**
  - If `verdict.decision` is `needs_revision` -> Re-invoke the routed executor (task-executor or task-executor-frontend per Layer-Aware Agent Routing) in **Fix Mode** with the same `task_file` and the `requiredFixes[]` array
  - If `verdict.decision` is `blocked` -> Escalate to user with the reviewer's stated blocking reason and the review basis it could not establish; re-invoke the reviewer only after the user supplies that basis
  - If `verdict.decision` is `approved` -> Proceed to quality-fixer

### Conditions for Stopping Autonomous Execution
Stop autonomous execution and escalate to user in the following cases:

1. **Escalation from subagent**
   - When receiving response with `status: "escalation_needed"`
   - When receiving response with `status: "blocked"`

2. **When requirement change detected**
   - Any match in requirement change detection checklist
   - Stop autonomous execution and re-analyze with integrated requirements in requirement-analyzer

3. **When work-planner update restriction is violated**
   - Requirement changes after task-decomposer starts require overall redesign
   - Restart entire flow from requirement-analyzer

4. **When user explicitly stops**
   - Direct stop instruction or interruption

### Prompt Construction Rule
Every subagent prompt must include:
1. Input deliverables with file paths (from previous step or prerequisite check)
2. Expected action (what the agent should do)

Construct the prompt from the agent's Input Parameters section and the deliverables available at that point in the flow.

Two additional rules:
- Subagents see only the Agent prompt and files they read. Include required paths, prior JSON, parameters, and scope constraints explicitly.
- Replace every `[placeholder]` in examples below with concrete values before invoking the Agent tool.

### Completion Report Format

After the selected flow completes, return:

```json
{
  "status": "completed | blocked", "scale": "small | medium | large", "completedTasks": [{"taskFile": "path", "status": "completed", "commit": "sha-or-null"}], "filesModified": ["path"],
  "verification": [{"check": "name", "result": "passed | failed | not_run", "evidence": "command or verifier result"}], "verifiers": [{"name": "agent", "status": "status value"}], "unresolvedItems": [{"item": "decision or evidence", "requiredInput": "input", "escalation": "condition"}]
}
```

Set `status` to `completed` only when every required task, quality gate, verifier, and commit step in the selected flow has completed. Set it to `blocked` when an unresolved item prevents the next transition.

### Call Example (codebase-analyzer)
- subagent_type: "codebase-analyzer"
- description: "Codebase analysis"
- prompt: "requirement_analysis: [JSON from requirement-analyzer]. prd_path: [path if exists]. requirements: [original user requirements]. Analyze the existing codebase and produce design guidance."

### Call Example (code-verifier — design flow)
- subagent_type: "code-verifier"
- description: "Design Doc verification"
- prompt: "doc_type: design-doc document_path: [Design Doc path] Verify Design Doc against existing code."

## My Main Roles as Orchestrator

1. **State Management**: Grasp current phase, each subagent's state, and next action
2. **Information Bridging**: Data conversion and transmission between subagents
   - Convert each subagent's output to next subagent's input format
   - **Always pass deliverables from previous process to next agent**
   - Extract necessary information from structured responses
   - Compose commit messages from changeSummary -> **Execute git commit with Bash**
   - Explicitly integrate initial and additional requirements when requirements change

   #### convergence record → the agent that carries it

   **Pass**: the `convergence` object from the last requirement-analyzer invocation (or, in a flow with no requirement-analyzer, the orchestrator's own judged record) to whichever agent carries it forward. Pass it unchanged; each field's readiness label travels with it.
   - **prd-creator** (when a PRD is created or updated): persists `outcome` to `Success Criteria`, and `nonGoals` plus `speculative` requirements to `Future` / `Out of Scope` with origin `user`
   - **technical-designer / technical-designer-frontend**: persists the same to the Design Doc's `Requirement Convergence` when no PRD exists, and always records the fields left `weak-but-explicit` there
   - **ui-spec-designer** (frontend/fullstack): treats `nonGoals` and `speculative` requirements as capabilities the UI Spec leaves out
   - **work-planner**: treats `nonGoals` and `speculative` requirements as excluded from every task entry. At Small scale no Work Plan is produced, so the `weak-but-explicit` fields stay in the orchestrator's own context per the storage protocol rather than becoming blocking items in the executor prompt

   #### codebase-analyzer → technical-designer

   **Pass to codebase-analyzer**: requirement-analyzer JSON output (including `convergence`), PRD path (if exists), original user requirements
   **Pass to technical-designer**: codebase-analyzer JSON output as additional context in the Design Doc creation prompt. Required downstream uses:
   - `focusAreas` → canonical disposition-target list for the Fact Disposition Table (one row per focusArea, carrying through `fact_id` and `evidence` verbatim)
   - `dataModel`, `dataTransformationPipelines`, `qualityAssurance` → Existing Codebase Analysis and Verification Strategy sections

   #### code-verifier → document-reviewer (Design Doc review)

   **Pass to code-verifier**: Design Doc path (doc_type: design-doc). Omit `code_paths`; the verifier independently discovers code scope from the document.
   **Pass to document-reviewer**: code-verifier JSON output as `code_verification`, the same codebase-analyzer JSON previously given to the designer as `codebase_analysis`, and — whenever the requirements are available — the requirements (or the requested change) as `requirements_verbatim` plus the confirmed scope and user decisions as `confirmed_decisions`. The reviewer uses `codebase_analysis.focusAreas` to verify Fact Disposition Table coverage and the paired requirement inputs to verify adopted design validity. Supplying only one of the paired inputs returns `rejected`.

   #### code-verifier + document-reviewer → next-layer technical-designer (cross-layer flow only)

   **Pass to next-layer technical-designer**: reviewed prior-layer Design Doc path plus `prior_layer_verification` (the JSON from the prior-layer code-verifier). See Cross-Layer Orchestration section for sequencing. Use `prior_layer_verification.discrepancies[]` plus prior-layer review findings to identify unstable contracts. Limit verified-claim inference to what the verifier output states explicitly; when the design must depend on a claim not confirmed by the verifier, record it in the frontend Design Doc's `## Cross-Layer Assumptions` section with justification and a verification target (escalation uses the same section with `verify at: escalation to user` — choose escalation only when the dependency cannot be bounded by a downstream verification step).

   #### technical-designer → work-planner

   **Pass to work-planner**: Design Doc path. Work-planner maps governing sections and ACs to implementation tasks. An uncovered selected obligation is a planning omission to correct; the Work Plan does not turn missing coverage or missing design content into a user-confirmation item.

   **Gap handling (orchestrator responsibility)**: If work-planner outputs a draft plan containing `gap` entries, the orchestrator MUST:
   1. Present the gap entries to the user with justifications
   2. Keep the plan in draft status until the user confirms each gap
   3. Pass the plan to downstream agents after every gap is resolved or explicitly confirmed
   Unjustified gaps are errors — return to work-planner to add covering tasks or justification.

   #### *1 acceptance-test-generator → work-planner

   **Pass to acceptance-test-generator**: Design Doc path; UI Spec path (if exists).

   **Orchestrator verification**: Every non-null `generatedFiles.<lane>` path exists on disk. For each null lane, `e2eAbsenceReason.<lane>` is present — this is intentional absence, not an error.

   **Pass to work-planner**: integration / fixture-e2e / service-integration-e2e file paths (or null per lane), per-lane absence reasons, plus timing guidance — integration tests are created alongside each phase implementation, fixture-e2e tests are created alongside the UI feature phase, service-integration-e2e tests are executed only in the final phase.

   **On error**: Escalate to user when status != completed and integration file generation failed unexpectedly. A null E2E lane with a valid absence reason is not an error.
3. **ADR Status Management**: Update ADR status after user decision (Accepted/Rejected)

## Important Constraints

- **Quality check**: A commit is permitted after quality-fixer returns `approved`
- **Structured response**: Information passed between subagents uses the declared JSON fields
- **Approval management**: Document creation is followed by document-reviewer and the named user-approval stop before the next phase
- **Flow confirmation**: After approval, select the next step from the confirmed large/medium/small flow
- **Consistency verification**: When subagent outputs conflict, apply Decision precedence (see Delegation Boundary section)

### Progress Tracking

Register overall phases using TaskCreate. Update each phase with TaskUpdate as it completes.

### Post-Implementation Verification Pass/Fail Criteria

| Verifier | Pass | Fail | Blocked |
|----------|------|------|---------|
| code-verifier | `summary.status` is `consistent` or `mostly_consistent` | `summary.status` is `needs_review` or `inconsistent` | `summary.status` is `blocked` → Escalate to user with `summary.blockingReason` (the verifier had no verifiable input; a fix cycle cannot resolve it) |
| security-reviewer | `status` is `approved` or `approved_with_notes` | `status` is `needs_revision` | `status` is `blocked` → Escalate to user |

**Re-run rule**: Run at most 2 fix cycles. After each cycle, re-run the verifiers that returned **fail** and retain the recorded evidence from verifiers that passed. A cycle makes progress only when a previously failing verifier reaches a pass status or its count of named remaining findings decreases. Escalate immediately when a cycle makes no progress or requires external input; after cycle 2, escalate every remaining failure with its findings.

This rule bounds the verifier set. The per-finding correction loop is bounded separately by `references/review-resolution.md` section 3, and whichever limit triggers first escalates.

**Fix-cycle handoff**: Apply Review Resolution, then pass each required executor the complete `apply` finding objects verbatim with only their dispositions added. Carry `prior_feedback` to reviewer inputs that support reconciliation.
