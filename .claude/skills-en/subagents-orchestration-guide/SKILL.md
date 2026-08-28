---
name: subagents-orchestration-guide
description: Coordinates subagents through scale-based planning, approval, implementation, verification, and escalation flows. Use when routing work to subagents, executing an approved work plan, or resuming autonomous execution.
---

# Sub-agents Practical Guide - Orchestration Guidelines for Claude (Me)

## Core Principle: I Am an Orchestrator

**Explicit User Instruction**: The user explicitly instructs and authorizes every subagent call named in the invoked recipe. Execute each applicable call when its prerequisites are met.

### Required Actions
- **New tasks**: Start with requirement-analyzer, then converge requirements and select the Structural Scale from its evidence
- **During flow execution**: Follow the selected scale flow and its transition conditions
- **Each phase**: Delegate the phase to the agent whose declared responsibility matches its output
- **Stop points**: Continue only after the required user approval is recorded
- **Investigation**: Delegate all investigation to requirement-analyzer or codebase-analyzer (Grep/Glob/Read are specialist-internal tools)
- **Analysis/Design**: Delegate to the specialist whose declared responsibilities include the required output
- **First action**: Pass user requirements to requirement-analyzer before any other step

### First Action Rule

When receiving a new task, pass user requirements directly to requirement-analyzer. Use its request, scope, cost, and question evidence to run requirement convergence and assign Structural Scale. The orchestrator owns both judgments. Re-invoke requirement-analyzer only when a hearing answer changes the analysis target or required scope evidence.

### Requirement Change Detection During Flow

Treat a proposed change to the confirmed outcome, desired-future requirements, or non-goals as a requirement change. When evidence shows those value boundaries cannot all remain true, stop at the requirements gate and ask the user which boundary changes. A technical design or implementation correction that preserves them is not a requirement change; update each invalidated technical artifact and resume from the earliest affected technical gate while preserving outputs that remain valid.

## Subagents I Can Utilize

### Implementation Support Agents
1. **quality-fixer**: Self-contained processing for overall quality assurance and fixes until completion
2. **task-decomposer**: Materialize each approved work plan implementation item as one task-template file, preserving its declared boundary and dependencies
3. **task-executor**: Individual task execution and structured response
4. **integration-test-reviewer**: Review integration/E2E tests for skeleton compliance
5. **security-reviewer**: Security compliance review against Design Doc and project coding standards after all tasks complete

### Document Creation Agents
6. **requirement-analyzer**: Compact request, scope, cost, and question evidence collection
7. **codebase-analyzer**: Analyze existing codebase to produce focused guidance for technical design
8. **prd-creator**: Product Requirements Document creation (WebSearch enabled, market trend research)
9. **ui-spec-designer**: UI Specification creation from PRD and optional prototype code (frontend/fullstack features)
10. **technical-designer**: ADR batch or Design Doc creation from confirmed requirements and repository evidence
11. **work-planner**: Work plan creation from Design Doc and test skeletons
12. **document-reviewer**: Single document quality, completeness, and rule compliance check
13. **code-verifier**: Verify Design Doc claims against the existing codebase before implementation
14. **design-sync**: Design Doc consistency verification (detects explicit conflicts only)
15. **acceptance-test-generator**: Generate separate integration and E2E test skeletons from Design Doc ACs and optional UI Spec
16. **ui-analyzer**: Gather UI facts (external sources + existing UI code) for frontend design preparation — read-only
17. **code-reviewer**: Review completed implementation against governing sources and repository quality policy

## My Orchestration Principles

### Delegation Boundary: What vs How

I pass **what to accomplish** and **where to work**. Each specialist determines **how to execute** autonomously.

**I pass to specialists** (what/where/constraints):
- Task file path — executor agents use it as the outcome and investigation entry point; repository ownership determines the complete consistent change set
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

An explicit restriction in the user instruction or confirmed outcome, desired-future requirements, or non-goals is a hard boundary. A technical artifact is the primary implementation baseline, but its How is corrected through the affected technical artifacts when repository evidence invalidates it without changing those value boundaries. Target paths and task-file file lists are investigation starting points unless their governing source explicitly makes them exclusive. Unrelated improvements remain outside the active change.

### Specialist Result Acceptance

Each specialist's agent definition owns its canonical result shape. As receiver, I choose the next action from the result's semantic content, governing sources, produced artifacts, and repository state. Semantically equivalent labels, omitted optional fields, and absent transition labels remain acceptable when those sources support the next action. I resolve operational gaps through inspection or repository-local reversible judgment and continue unaffected work.

I continue incomplete implementation while repository evidence supplies an action that advances the confirmed outcome. When current authority and evidence cannot advance required implementation, I finish with an incomplete report containing the remaining work and observed evidence. I treat a proof-only limitation differently: perform recovery available within current authority and scope, run every available check, retain the complete limitation result, and continue remaining tasks at the recipe's normal reversible boundary. Before final verification, I re-invoke the applicable quality-fixer once with the same scope and affected check; I clear an `approved` result, route `stub_detected` through `incompleteImplementations`, and report only a repeated `verification_incomplete` result. I claim only observed proof. User interaction is reserved for choosing a change to confirmed value boundaries or authorizing an irreversible external action.

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
- Final quality judgment after fixes and every available check complete

### Standard Flow I Manage

**Basic Cycle**: I manage the 4-step cycle of `task-executor -> user-boundary judgment/follow-up -> quality-fixer -> commit`.
I repeat this cycle for each task to ensure quality.

**Layer-Aware Routing**: For cross-layer features, select executor and quality-fixer by task filename pattern (see Cross-Layer Orchestration).

## Constraints Between Subagents

Workflow coordination is flat: the orchestrator issues every specialist call and receives every result. Specialist definitions keep `Agent` outside their tool sets.

## Structural Scale and Document Requirements

The orchestrator applies documentation-criteria to the converged outcome and repository evidence. Scale follows decision burden: Small has one evident implementation within one responsibility boundary, Medium coordinates a boundary or potentially durable choice, and Large contains multiple independently valuable outcomes requiring separate design decisions. File count is supporting evidence only.

| Scale | PRD | ADR | Design Doc | Work Plan |
|-------|-----|-----|------------|-----------|
| Small | Update when product scope changes | Not needed | Not needed | Not needed — task-executor runs from an explicit prompt |
| Medium | Update when product scope changes | Only for decision points that pass both ADR filters | **Required** | **Required** |
| Large | **Required** — create, update, or reverse | Only for decision points that pass both ADR filters | **Required** | **Required** |

A qualifying ADR raises the scale to Medium at minimum. Review all qualifying ADRs as one batch and set accepted decisions to `Accepted` before Design Doc creation.

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
| Bash | Shell operations (git commit, ls, verification commands) |
| Read | Deliverable documents for information bridging between subagents |

All implementation work (Edit, Write, MultiEdit) is performed by subagents, not the orchestrator.

### Subagent Response Format

Each agent declares its own input and output contract. Read that contract when composing a call, then apply Specialist Result Acceptance to the returned semantic content instead of requiring a second routing schema here.

**Cross-agent wiring I own**: ask quality-fixer to inspect the complete current uncommitted worktree, including untracked, deleted, and renamed paths. Carry the implementation step's `runnableCheck`, and the project's authoritative quality command as `qualityCommand` when the recipe or technical-spec names one.

Quality-fixer records checks that could not run and verified unrelated baseline failures in its existing check results. After runnable change-related checks pass, `approved` continues normal routing. A failure caused by the change or in a dependency required by the accepted outcome remains a fix input even when the original task omitted its path.

## My Basic Flow: Planning and Implementation

When receiving new features or change requests, first collect requirement evidence, converge requirements, and assign Structural Scale.

### Large Scale

1. requirement-analyzer → orchestrator convergence and scale judgment **[Stop]**
2. prd-creator → document-reviewer → PRD approval **[Stop]**
3. codebase-analyzer → compact repository evidence
4. **(frontend/fullstack only)** ui-spec-designer → document-reviewer → UI Spec approval **[Stop]**
5. **(when ADR decision points qualify)** technical-designer in `ADRBatch` mode → document-reviewer batch review → resolve findings → set accepted ADRs to `Accepted` **[Stop]**
6. technical-designer in `DesignDoc` mode → code-verifier → document-reviewer → design-sync → Design Doc approval **[Stop]**
7. acceptance-test-generator → work-planner → document-reviewer → batch approval **[Stop]**
8. task-decomposer → autonomous execution → completion report

### Medium Scale

1. requirement-analyzer → orchestrator convergence and scale judgment **[Stop]**
2. codebase-analyzer → compact repository evidence
3. **(frontend/fullstack only)** ui-spec-designer → document-reviewer → UI Spec approval **[Stop]**
4. **(when ADR decision points qualify)** technical-designer in `ADRBatch` mode → document-reviewer batch review → resolve findings → set accepted ADRs to `Accepted` **[Stop]**
5. technical-designer in `DesignDoc` mode → code-verifier → document-reviewer → design-sync → Design Doc approval **[Stop]**
6. acceptance-test-generator → work-planner → document-reviewer → batch approval **[Stop]**
7. task-decomposer → autonomous execution → completion report

### Small Scale

1. requirement-analyzer → orchestrator convergence and scale judgment. Present the confirmed outcome, affected paths, and verification condition **[Stop: Batch approval]**
2. task-executor from that explicit prompt → quality-fixer on the complete current uncommitted worktree → commit → completion report

Small produces no Work Plan or task file. A newly discovered qualifying ADR moves the work to Medium; otherwise no planning document is introduced.

Treat the applicable Structural Scale flow as an evidence-gated sequence. Advance only when the current phase has the artifact, approval, or result required by its stated routing condition. Before reporting completion, resume the earliest applicable phase without that evidence.

## Cross-Layer Orchestration

When the orchestrator determines from `scopeEvidence.affectedLayers` that the feature spans backend and frontend, replace the single codebase-analysis and Design Doc segment with the backend-first, frontend-second sequence below.

### Design Phase Extensions

Replace the standard Design Doc creation step with per-layer creation:

| Step | Agent | Purpose |
|------|-------|---------|
| 8 | codebase-analyzer | Analyze the complete confirmed cross-layer scope, passing exactly one governing source: `prd_path` or `requirements` |
| 9 | technical-designer | Backend Design Doc (with the relevant backend evidence from step 8) |
| 10 | code-verifier | Verify Backend Design Doc against existing code (its result JSON becomes `prior_layer_verification` for step 12) |
| 11 | document-reviewer | Review Backend Design Doc (pass the step-10 result as `verification_evidence` and step-8 JSON as `codebase_analysis`); resolve `needs_revision`, and stop on `rejected` |
| 12 | technical-designer-frontend | Frontend Design Doc (with relevant frontend evidence from step 8 + reviewed Backend Design Doc + `prior_layer_verification` from step 10 + UI Spec) |
| 13 | code-verifier | Verify Frontend Design Doc against existing code |
| 14 | document-reviewer | Review Frontend Design Doc (pass the step-13 result and recorded dispositions as `verification_evidence`, plus step-8 JSON as `codebase_analysis`). Resolve `needs_revision`; a `rejected` verdict stops before step 15. |
| 15 | design-sync | Cross-layer consistency verification **[Stop]** |

Step 8 runs once and its full JSON is reused unchanged by both designers; each consumes the evidence relevant to its layer. The backend path (steps 9-11) runs sequentially before step 12 so the frontend designer receives both repository verification and the reviewed backend contracts.

**Layer Context in Design Doc Creation**:
- **Backend**: "Create a backend Design Doc from PRD at [path]. Codebase analysis: [step-8 JSON; use backend-relevant evidence]. Focus on: API contracts, data layer, business logic, service architecture."
- **Frontend**: "Create a frontend Design Doc from PRD at [path]. Codebase analysis: [step-8 JSON; use frontend-relevant evidence]. Reviewed Backend Design Doc at [path] — extract API contracts and Integration Points from this document to populate the frontend Design Doc's Integration Points. Backend review issues and dispositions: [step-11 document-reviewer result and Review Resolution record]. prior_layer_verification: [JSON from code-verifier on backend Design Doc]. Treat only evidence-backed discrepancies and maintained review issues as unstable contracts. Reference UI Spec at [path] for component structure. Focus on: component hierarchy, state management, UI interactions, data fetching."

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
- `status: escalation_needed` or `status: blocked` -> Apply Specialist Result Acceptance
- `requiresTestReview` is `true` -> Execute **integration-test-reviewer**
  - If `status` is `needs_revision` -> Apply Review Resolution and re-invoke the routed executor (task-executor or task-executor-frontend per Layer-Aware Agent Routing) with the same `task_file` and the complete `apply` quality-issue objects verbatim as `correction_findings`
  - If `status` is `blocked` -> Resolve moved or renamed changed test paths and re-invoke the reviewer once. If no changed test exists despite `requiresTestReview: true`, return that executor-output defect to the routed executor as `correction_findings`. If it returns `blocked` again, record the review as not run and proceed to quality-fixer
  - If `status` is `approved` -> Proceed to quality-fixer

### Conditions for Stopping Autonomous Execution

| Trigger | Action |
|---|---|
| Evidence shows the confirmed outcome, desired-future requirements, and non-goals cannot all remain true without a user choice | Apply Requirement Change Detection and ask which value boundary changes. |
| An irreversible external action requires authorization | Request authorization at the authority gate. |
| Required implementation remains incomplete | Continue while repository evidence supplies an advancing action; otherwise finish with an incomplete report and the observed evidence. |
| A subagent reports an environment or execution prerequisite | Apply the proof-limitation recovery and retry in Specialist Result Acceptance. |
| A requirement changes | Apply Requirement Change Detection above. After task-decomposer starts, invalidate affected tasks; restart document design only when the requirement change invalidates an approved requirement, contract, data flow, verification strategy, or task boundary. |
| The user stops or interrupts | Stop autonomous execution. |

### Prompt Construction Rule
Every subagent prompt must include:
1. Input deliverables with file paths (from previous step or prerequisite check)
2. Expected action (what the agent should do)

Construct the prompt from the agent's Input Parameters section and the deliverables available at that point in the flow.

Two additional rules:
- Subagents see only the Agent prompt and files they read. Include required paths, prior JSON, parameters, and scope constraints explicitly.
- Replace every `[placeholder]` in examples below with concrete values before invoking the Agent tool.

### Call Example (codebase-analyzer)
- subagent_type: "codebase-analyzer"
- description: "Codebase analysis"
- prompt: "Use exactly one governing source: prd_path: [approved PRD path], or requirements: [confirmed requirements verbatim]. Collect compact repository evidence for design."

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
   - Compose commit messages from changeSummary and execute git commit
   - Explicitly integrate initial and additional requirements when requirements change

   #### convergence record → the agent that carries it

   **Pass**: the orchestrator's judged `convergence` record to whichever agent carries it forward. Pass it unchanged; each field's readiness label travels with it.
   - **prd-creator** (when a PRD is created or updated): persists `outcome` to `Success Criteria` and user-authored `nonGoals` to `Out of Scope`; the PRD contains confirmed requirements and boundaries while evaluation requests, speculative ideas, and unselected mechanisms remain only in pre-confirmation convergence context
   - **technical-designer / technical-designer-frontend**: persists the same to the Design Doc's `Requirement Convergence` when no PRD exists, and always records the fields left `weak-but-explicit` there
   - **ui-spec-designer** (frontend/fullstack): receives confirmed UI requirements and user-authored `nonGoals`; unselected candidates create no UI Spec content
   - **work-planner**: treats `nonGoals` as excluded from every task entry; unselected candidates create no planning obligation. At Small scale no Work Plan is produced, so the `weak-but-explicit` fields stay in the orchestrator's own context per the storage protocol rather than becoming blocking items in the executor prompt

   #### codebase-analyzer → technical-designer

   **Pass to codebase-analyzer**: exactly one governing source — the approved PRD path when one exists, otherwise the confirmed requirements
   **Pass to technical-designer**: codebase-analyzer JSON output as additional context in the Design Doc creation prompt. Required downstream uses:
   - `focusAreas` → canonical disposition-target list for the Fact Disposition Table (one row per focusArea, carrying through `fact_id` and `evidence` verbatim)
   - `dataModel`, `dataTransformationPipelines`, `qualityAssurance` → Existing Codebase Analysis and Verification Strategy sections

   #### code-verifier → document-reviewer (Design Doc review)

   **Pass to code-verifier**: Design Doc path (doc_type: design-doc). Omit `code_paths`; the verifier independently discovers code scope from the document.
   **Pass to document-reviewer**: the latest code-verifier result together with recorded Review Resolution dispositions as `verification_evidence`, the same codebase-analyzer JSON previously given to the designer as `codebase_analysis`, the governing source as `confirmed_requirement_context`, and the original request as `requirements_verbatim` when applicable. The reviewer uses `codebase_analysis.focusAreas` to verify Fact Disposition Table coverage and the confirmed requirement context to verify the document's outcome and contract.

   #### applied design-evidence finding → technical-designer

   **Pass to the owning designer**: invoke a fresh `update` call with the existing Design Doc path and complete `correction_findings` copied verbatim with only their `apply` dispositions added. The artifact carries approved requirements, accepted decisions, prior evidence, and unaffected design context; add no orchestrator-authored design instructions. The designer applies its review-triggered bounded self-verification gate and updates the artifact from established evidence. The orchestrator reruns the originating verifier or reviewer only after a completed update.

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

   **Orchestrator verification**: Every path in `generatedFiles[]` exists on disk. An empty list is a valid generation result.

   **Pass to work-planner**: generated paths, plus timing guidance — integration tests are created alongside each phase implementation, fixture-e2e tests are created alongside the UI feature phase, service-integration-e2e tests are executed after their required services exist.
3. **ADR Status Management**: Update ADR status after user decision (Accepted/Rejected)

## Important Constraints

- **Quality check**: A task commit is permitted after quality-fixer returns `approved`
- **Structured response**: Information passed between subagents uses the declared JSON fields
- **Approval management**: Document creation is followed by document-reviewer and the named user-approval stop before the next phase
- **Flow confirmation**: After approval, select the next step from the confirmed large/medium/small flow
- **Consistency verification**: When subagent outputs conflict, apply Decision precedence (see Delegation Boundary section)

### Post-Implementation Review Status Routing

| Reviewer | Complete: empty finding set | Enter Review Resolution | Blocked |
|----------|---------------------------|-------------------------|---------|
| code-reviewer | `verdict` is `pass` | `verdict` is `needs-improvement` or `needs-redesign` | `verdict` is `blocked` → Apply Specialist Result Acceptance |
| security-reviewer | `status` is `approved` | `status` is `needs_revision` | `status` is `blocked` → Apply Specialist Result Acceptance |

Reviewer findings are candidates. Create correction work only from the Review Resolution `apply` set.

**Fix-cycle handoff**: Apply Review Resolution and invoke each correction owner it selects. For an author-owned technical-artifact correction, invoke the layer-appropriate technical designer in update mode, run the artifact's existing document-reviewer and applicable design-sync gates, then re-run the originating reviewer. For an executor-owned correction, invoke the layer-appropriate executor with its original `task_file` or direct-scope fields plus `correction_findings` as the complete `apply` finding objects verbatim with only their dispositions added, then run the applicable quality gate. When both owners are required, Review Resolution's author-first re-evaluation controls the order. Carry `prior_feedback` only to reconciliation reviewers.

**Re-run rule**: After any applied post-implementation correction, re-run each reviewer with at least one correction applied from its latest result. Retain any other reviewer result only when repository evidence establishes that the correction preserved its review boundary; otherwise re-run that reviewer. After recovering a blocked review prerequisite, re-run that reviewer. Review Resolution convergence governs acceptance and preserves resolved declines.
