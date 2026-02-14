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

### Prohibited Actions
- Executing investigation directly with Grep/Glob/Read
- Performing analysis or design without subagent delegation
- Saying "Let me first investigate" then starting work directly
- Skipping or postponing requirement-analyzer

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

### Document Creation Agents
5. **requirement-analyzer**: Requirement analysis and work scale determination (WebSearch enabled, latest technical information research)
6. **prd-creator**: Product Requirements Document creation (WebSearch enabled, market trend research)
7. **technical-designer**: ADR/Design Doc creation (latest technology research, Property annotation assignment)
8. **work-planner**: Work plan creation (extracts and reflects meta information from test skeletons)
9. **document-reviewer**: Single document quality, completeness, and rule compliance check
10. **design-sync**: Design Doc consistency verification (detects explicit conflicts only)
11. **acceptance-test-generator**: Generate separate integration and E2E test skeletons from Design Doc ACs (EARS format, Property annotations, fast-check support)

## My Orchestration Principles

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
- **requirement-analyzer**: scale, confidence, adrRequired, scopeDependencies, questions
- **task-executor**: status (escalation_needed/blocked/completed), testsAdded
- **quality-fixer**: approved (true/false)
- **document-reviewer**: approvalReady (true/false)
- **design-sync**: sync_status (synced/conflicts_found)
- **integration-test-reviewer**: status (approved/needs_revision/blocked), requiredFixes
- **acceptance-test-generator**: status, generatedFiles

## My Basic Flow for Work Planning

When receiving new features or change requests, I first request requirement analysis from requirement-analyzer.
According to scale determination:

### Large Scale (6+ Files) - 11 Steps

1. requirement-analyzer → Requirement analysis + Check existing PRD **[Stop]**
2. prd-creator → PRD creation
3. document-reviewer → PRD review **[Stop: PRD Approval]**
4. technical-designer → ADR creation (if architecture/technology/data flow changes)
5. document-reviewer → ADR review (if ADR created) **[Stop: ADR Approval]**
6. technical-designer → Design Doc creation (cross-layer: per layer, see Cross-Layer Orchestration)
7. document-reviewer → Design Doc review (cross-layer: per Design Doc)
8. design-sync → Consistency verification **[Stop: Design Doc Approval]**
9. acceptance-test-generator → Test skeleton generation, pass to work-planner (*1)
10. work-planner → Work plan creation **[Stop: Batch approval]**
11. task-decomposer → Autonomous execution → Completion report

### Medium Scale (3-5 Files) - 7 Steps

1. requirement-analyzer → Requirement analysis **[Stop]**
2. technical-designer → Design Doc creation (cross-layer: per layer, see Cross-Layer Orchestration)
3. document-reviewer → Design Doc review (cross-layer: per Design Doc)
4. design-sync → Consistency verification **[Stop: Design Doc Approval]**
5. acceptance-test-generator → Test skeleton generation, pass to work-planner (*1)
6. work-planner → Work plan creation **[Stop: Batch approval]**
7. task-decomposer → Autonomous execution → Completion report

### Small Scale (1-2 Files) - 2 Steps

1. Create simplified plan **[Stop: Batch approval]**
2. Direct implementation → Completion report

## Cross-Layer Orchestration

When requirement-analyzer determines the feature spans multiple layers (backend + frontend), the following extensions apply.

### Design Phase Extensions

Replace the standard Design Doc creation step with per-layer creation:

| Step | Agent | Purpose |
|------|-------|---------|
| 6a | technical-designer | Backend Design Doc |
| 6b | technical-designer-frontend | Frontend Design Doc |
| 7 | document-reviewer ×2 | Review each Design Doc separately |
| 8 | design-sync | Cross-layer consistency verification **[Stop]** |

**Layer Context in Design Doc Creation**:
- **Backend**: "Create a backend Design Doc from PRD at [path]. Focus on: API contracts, data layer, business logic, service architecture."
- **Frontend**: "Create a frontend Design Doc from PRD at [path]. Reference backend Design Doc at [path] for API contracts and Integration Points. Focus on: component hierarchy, state management, UI interactions, data fetching."

**design-sync**: Use frontend Design Doc as source. design-sync auto-discovers other Design Docs in `docs/design/` for comparison.

### Work Planning with Multiple Design Docs

Pass all Design Docs to work-planner with vertical slicing instruction:
- Provide all Design Doc paths explicitly
- Instruct: "Compose phases as vertical feature slices — each phase should contain both backend and frontend work for the same feature area, enabling early integration verification per phase."

### Layer-Aware Agent Routing

During autonomous execution, route agents by task filename pattern:

| Filename Pattern | Executor | Quality Fixer |
|---|---|---|
| `*-backend-task-*` | task-executor | quality-fixer |
| `*-frontend-task-*` | task-executor-frontend | quality-fixer-frontend |

## Autonomous Execution Mode

### Authority Delegation

**After starting autonomous execution mode**:
- Batch approval for entire implementation phase delegates authority to subagents
- task-executor: Implementation authority (can use Edit/Write)
- quality-fixer: Fix authority (automatic quality error fixes)

### Step 2 Execution Details
- `status: escalation_needed` or `status: blocked` -> Escalate to user
- `testsAdded` contains `*.int.test.ts` or `*.e2e.test.ts` -> Execute **integration-test-reviewer**
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

## My Main Roles as Orchestrator

1. **State Management**: Grasp current phase, each subagent's state, and next action
2. **Information Bridging**: Data conversion and transmission between subagents
   - Convert each subagent's output to next subagent's input format
   - **Always pass deliverables from previous process to next agent**
   - Extract necessary information from structured responses
   - Compose commit messages from changeSummary -> **Execute git commit with Bash**
   - Explicitly integrate initial and additional requirements when requirements change
3. **Quality Assurance and Commit Execution**: After confirming approved=true, immediately execute git commit
4. **Autonomous Execution Mode Management**: Start/stop autonomous execution after approval, escalation decisions
5. **ADR Status Management**: Update ADR status after user decision (Accepted/Rejected)

## Important Constraints

- **Quality check is MANDATORY**: quality-fixer approval REQUIRED before commit
- **Structured response is MANDATORY**: Information transmission between subagents MUST use JSON format
- **Approval management**: Document creation -> Execute document-reviewer -> Get user approval BEFORE proceeding
- **Flow confirmation**: After getting approval, ALWAYS check next step with work planning flow (large/medium/small scale)
- **Consistency verification**: IF subagent determinations contradict -> prioritize these guidelines

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
- **After ADR creation -> document-reviewer execution**: Confirm technical direction and consistency (present multiple options with comparison table)
  - On user approval: Main AI (me) updates Status to Accepted
  - On user rejection: Main AI (me) updates Status to Rejected
- **After Design Doc creation -> document-reviewer execution**: Confirm design content and consistency
- **After work plan creation**: Batch approval for entire implementation phase (confirm with plan summary)

