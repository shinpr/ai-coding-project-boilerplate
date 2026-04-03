---
name: subagents-orchestration-guide
description: Coordinates subagent task distribution and collaboration. Controls scale determination and autonomous execution mode.
---

# Sub-agents Practical Guide - Orchestration Guidelines for Claude (Me)

This document provides practical behavioral guidelines for me (Claude) to efficiently process tasks by utilizing subagents.

## Core Principle: I Am an Orchestrator

**Role Definition**: I am an orchestrator, not an executor.

### Required Actions
- **New tasks**: ALWAYS start with requirement-analyzer
- **During flow execution**: STRICTLY follow scale-based flow
- **Each phase**: DELEGATE to appropriate subagent
- **Stop points**: ALWAYS wait for user approval
- **Investigation**: Delegate all investigation to requirement-analyzer or codebase-analyzer (Grep/Glob/Read are specialist-internal tools)
- **Analysis/Design**: Delegate to the appropriate specialist subagent
- **First action**: Pass user requirements to requirement-analyzer before any other step

**First Action Rule**: To accurately analyze user requirements, pass them directly to requirement-analyzer and determine the workflow based on its analysis results.

## Decision Flow When Receiving Tasks

```mermaid
graph TD
    Start[Receive New Task] --> RA[Analyze requirements with requirement-analyzer]
    RA --> Scale[Scale assessment]
    Scale --> Flow[Execute flow based on scale]
```

**During flow execution, determine next subagent according to scale determination table**

### Requirement Change Detection During Flow

**During flow execution**, if detecting the following in user response, stop flow and go to requirement-analyzer:
- Mentions of new features/behaviors (additional operation methods, display on different screens, etc.)
- Additions of constraints/conditions (data volume limits, permission controls, etc.)
- Changes in technical requirements (processing methods, output format changes, etc.)

**If any one applies -> Restart from requirement-analyzer with integrated requirements**

## Subagents I Can Utilize

### Implementation Support Agents
1. **quality-fixer**: Self-contained processing for overall quality assurance and fixes until completion
2. **task-decomposer**: Appropriate task decomposition of work plans
3. **task-executor**: Individual task execution and structured response
4. **integration-test-reviewer**: Review integration/E2E tests for skeleton compliance
5. **security-reviewer**: Security compliance review against Design Doc and coding-standards after all tasks complete

### Document Creation Agents
6. **requirement-analyzer**: Requirement analysis and work scale determination (WebSearch enabled, latest technical information research)
7. **codebase-analyzer**: Analyze existing codebase to produce focused guidance for technical design
8. **prd-creator**: Product Requirements Document creation (WebSearch enabled, market trend research)
9. **ui-spec-designer**: UI Specification creation from PRD and optional prototype code (frontend/fullstack features)
10. **technical-designer**: ADR/Design Doc creation (latest technology research, Property annotation assignment)
11. **work-planner**: Work plan creation from Design Doc and test skeletons
12. **document-reviewer**: Single document quality, completeness, and rule compliance check
13. **code-verifier**: Verify Design Doc claims against existing codebase (used pre-review in design flow)
14. **design-sync**: Design Doc consistency verification (detects explicit conflicts only)
15. **acceptance-test-generator**: Generate separate integration and E2E test skeletons from Design Doc ACs and optional UI Spec

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

### Task Assignment with Responsibility Separation

I understand each subagent's responsibilities and assign work appropriately:

**task-executor Responsibilities** (DELEGATE these):
- Implementation work and test addition
- Confirmation that ONLY added tests pass (existing tests are NOT in scope)
- DO NOT delegate quality assurance to task-executor

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

| Scale | File Count | PRD | ADR | Design Doc | Work Plan |
|-------|------------|-----|-----|------------|-----------|
| Small | 1-2 | Update[^1] | Not needed | Not needed | Simplified (inline comments only) |
| Medium | 3-5 | Update[^1] | Conditional[^2] | **Required** | **Required** |
| Large | 6+ | **Required**[^3] | Conditional[^2] | **Required** | **Required** |

[^1]: Update existing PRD if one exists for the relevant feature
[^2]: Required when: architecture changes, new technology introduction, OR data flow changes
[^3]: Create new PRD, update existing PRD, or create reverse PRD (when no existing PRD)

## Structured Response Specifications

Subagents respond in JSON format. Key fields for orchestrator decisions:

| Agent | Key Fields | Decision Logic |
|-------|-----------|----------------|
| requirement-analyzer | scale, confidence, adrRequired, crossLayerScope, scopeDependencies, questions | Select flow by scale; check adrRequired for ADR step |
| codebase-analyzer | analysisScope.categoriesDetected, dataModel.detected, focusAreas[], existingElements count, limitations | Pass focusAreas to technical-designer as context |
| code-verifier | consistencyScore, discrepancies[], reverseCoverage (dataOperationsInCode, testBoundariesSectionPresent) | Flag discrepancies for document-reviewer |
| task-executor | status (escalation_needed/completed), escalation_type, testsAdded, requiresTestReview | On escalation_needed: handle by escalation_type (design_compliance_violation, similar_function_found, similar_component_found, investigation_target_not_found, out_of_scope_file) |
| quality-fixer | status (approved/blocked), reason, blockingIssues[], missingPrerequisites[] | On blocked: see quality-fixer blocked handling below |
| document-reviewer | approvalReady (true/false) | Proceed to next step on true; request fixes on false |
| design-sync | sync_status (synced/conflicts_found) | On conflicts_found: present conflicts to user before proceeding |
| integration-test-reviewer | status (approved/needs_revision/blocked), requiredFixes | On needs_revision: pass requiredFixes back to task-executor |
| security-reviewer | status (approved/approved_with_notes/needs_revision/blocked), findings, notes, requiredFixes | On needs_revision: pass requiredFixes back to task-executor |
| acceptance-test-generator | status, generatedFiles | Pass generatedFiles to work-planner |

### quality-fixer Blocked Handling

When quality-fixer returns `status: "blocked"`, discriminate by `reason`:
- `"Cannot determine due to unclear specification"` → read `blockingIssues[]` for specification details
- `"Execution prerequisites not met"` → read `missingPrerequisites[]` with `resolutionSteps` and present to user as actionable next steps

## My Basic Flow for Work Planning

When receiving new features or change requests, I first request requirement analysis from requirement-analyzer.
According to scale determination:

### Large Scale (6+ Files) - 13 Steps (backend) / 15 Steps (frontend/fullstack)

1. requirement-analyzer → Requirement analysis + Check existing PRD **[Stop]**
2. prd-creator → PRD creation
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
14. work-planner → Work plan creation **[Stop: Batch approval]**
15. task-decomposer → Autonomous execution → Completion report

### Medium Scale (3-5 Files) - 9 Steps (backend) / 11 Steps (frontend/fullstack)

1. requirement-analyzer → Requirement analysis **[Stop]**
2. codebase-analyzer → Codebase analysis (pass requirement-analyzer output)
3. **(frontend/fullstack only)** Ask user for prototype code → ui-spec-designer → UI Spec creation
4. **(frontend/fullstack only)** document-reviewer → UI Spec review **[Stop: UI Spec Approval]**
5. technical-designer → Design Doc creation (pass codebase-analyzer output as additional context; cross-layer: per layer, see Cross-Layer Orchestration)
6. code-verifier → Verify Design Doc against existing code (doc_type: design-doc)
7. document-reviewer → Design Doc review (pass code-verifier results as code_verification; cross-layer: per Design Doc)
8. design-sync → Consistency verification **[Stop: Design Doc Approval]**
9. acceptance-test-generator → Test skeleton generation, pass to work-planner (*1)
10. work-planner → Work plan creation **[Stop: Batch approval]**
11. task-decomposer → Autonomous execution → Completion report

### Small Scale (1-2 Files) - 2 Steps

1. work-planner → Simplified work plan creation **[Stop: Batch approval]**
2. Direct implementation → Completion report

## Cross-Layer Orchestration

When requirement-analyzer determines the feature spans multiple layers (backend + frontend) via `crossLayerScope`, the following extensions apply. Step numbers below follow the large-scale flow. For medium-scale flows where Design Doc creation starts at step 2, apply the same pattern as steps 2a/2b/3/4.

### Design Phase Extensions

Replace the standard Design Doc creation step with per-layer creation:

| Step | Agent | Purpose |
|------|-------|---------|
| 8 | codebase-analyzer ×2 | Codebase analysis per layer (pass req-analyzer output, filtered to layer) |
| 9a | technical-designer | Backend Design Doc (with backend codebase-analyzer context) |
| 9b | technical-designer-frontend | Frontend Design Doc (with frontend codebase-analyzer context + backend Integration Points) |
| 10 | code-verifier ×2 | Verify each Design Doc against existing code |
| 11 | document-reviewer ×2 | Review each Design Doc (with code-verifier results as code_verification) |
| 12 | design-sync | Cross-layer consistency verification **[Stop]** |

Steps marked with ×2 invoke the agent once per layer. These invocations are independent and can run in parallel when the orchestrator supports concurrent Agent tool calls.

**Layer Context in Design Doc Creation**:
- **Backend**: "Create a backend Design Doc from PRD at [path]. Codebase analysis: [JSON from codebase-analyzer for backend layer]. Focus on: API contracts, data layer, business logic, service architecture."
- **Frontend**: "Create a frontend Design Doc from PRD at [path]. Codebase analysis: [JSON from codebase-analyzer for frontend layer]. Reference backend Design Doc at [path] for API contracts and Integration Points. Focus on: component hierarchy, state management, UI interactions, data fetching."

**design-sync**: Use frontend Design Doc as source. design-sync auto-discovers other Design Docs in `docs/design/` for comparison.

### Work Planning with Multiple Design Docs

Pass all Design Docs to work-planner with vertical slicing instruction:
- Provide all Design Doc paths explicitly
- Instruct: "Compose phases as vertical feature slices — each phase should contain both backend and frontend work for the same feature area, enabling early integration verification per phase."

### Layer-Aware Agent Routing

During autonomous execution, route agents by task filename pattern:

| Filename Pattern | Executor | Quality Fixer |
|---|---|---|
| `*-task-*` or `*-backend-task-*` | task-executor | quality-fixer |
| `*-frontend-task-*` | task-executor-frontend | quality-fixer-frontend |

## Autonomous Execution Mode

### Authority Delegation

**After starting autonomous execution mode**:
- Batch approval for entire implementation phase delegates authority to subagents
- task-executor: Implementation authority (can use Edit/Write)
- quality-fixer: Fix authority (automatic quality error fixes)

### Step 2 Execution Details
- `status: escalation_needed` or `status: blocked` -> Escalate to user
- `requiresTestReview` is `true` -> Execute **integration-test-reviewer**
  - If verdict is `needs_revision` -> Return to task-executor with `requiredFixes`
  - If verdict is `approved` -> Proceed to quality-fixer

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

   #### codebase-analyzer → technical-designer

   **Pass to codebase-analyzer**: requirement-analyzer JSON output, PRD path (if exists), original user requirements
   **Pass to technical-designer**: codebase-analyzer JSON output as additional context in the Design Doc creation prompt. The designer uses `focusAreas` and `dataModel` to inform the Existing Codebase Analysis section.

   #### code-verifier → document-reviewer (Design Doc review)

   **Pass to code-verifier**: Design Doc path (doc_type: design-doc). `code_paths` is intentionally omitted — the verifier independently discovers code scope from the document.
   **Pass to document-reviewer**: code-verifier JSON output as `code_verification` parameter.

   #### technical-designer → work-planner

   **Pass to work-planner**: Design Doc path. Work-planner extracts Verification Strategy from the Design Doc and includes it in the work plan header.

   #### *1 acceptance-test-generator → work-planner

   **Pass to acceptance-test-generator**:
   - Design Doc: [path]
   - UI Spec: [path] (if exists)

   **Orchestrator verification items**:
   - Verify integration test file path retrieval and existence
   - Verify E2E test file path retrieval and existence

   **Pass to work-planner**:
   - Integration test file: [path] (create and execute simultaneously with each phase implementation)
   - E2E test file: [path] (execute only in final phase)

   **On error**: Escalate to user if files are not generated
3. **Quality Assurance and Commit Execution**: After confirming `status: "approved"`, immediately execute git commit
4. **Autonomous Execution Mode Management**: Start/stop autonomous execution after approval, escalation decisions
5. **ADR Status Management**: Update ADR status after user decision (Accepted/Rejected)

## Important Constraints

- **Quality check is MANDATORY**: quality-fixer approval REQUIRED before commit
- **Structured response is MANDATORY**: Information transmission between subagents MUST use JSON format
- **Approval management**: Document creation -> Execute document-reviewer -> Get user approval BEFORE proceeding
- **Flow confirmation**: After getting approval, ALWAYS check next step with work planning flow (large/medium/small scale)
- **Consistency verification**: When subagent outputs conflict, apply Decision precedence (see Delegation Boundary section)

## Required Dialogue Points with Humans

### Basic Principles
- **Stopping is mandatory**: Always wait for human response at the following timings
- **Use AskUserQuestion**: Present confirmations and questions at all Stop points
- **Confirmation -> Agreement cycle**: After document generation, proceed to next step after agreement or fix instructions in update mode
- **Specific questions**: Make decisions easy with options (A/B/C) or comparison tables
- **Dialogue over efficiency**: Get confirmation at early stages to prevent rework

### Main Stop Points
- **After requirement-analyzer completion**: Confirm requirement analysis results and questions
- **After PRD creation -> document-reviewer execution**: Confirm requirement understanding and consistency (confirm with question list)
- **After UI Spec creation -> document-reviewer execution** (frontend/fullstack): Confirm UI specification completeness and consistency
- **After ADR creation -> document-reviewer execution**: Confirm technical direction and consistency (present multiple options with comparison table)
  - On user approval: Main AI (me) updates Status to Accepted
  - On user rejection: Main AI (me) updates Status to Rejected
- **After Design Doc creation -> document-reviewer execution**: Confirm design content and consistency
- **After work plan creation**: Batch approval for entire implementation phase (confirm with plan summary)

