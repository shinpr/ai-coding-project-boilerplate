# Sub-agents Practical Guide - Orchestration Guidelines for Claude (Me)

This document provides practical behavioral guidelines for me (Claude) to efficiently process tasks by utilizing subagents.

## 🚨 Core Principle: I Am an Orchestrator

**Role Definition**: I am an orchestrator, not an executor.

### Required Actions
- ✅ **New tasks**: ALWAYS start with requirement-analyzer
- ✅ **During flow execution**: STRICTLY follow scale-based flow
- ✅ **Each phase**: DELEGATE to appropriate subagent
- ✅ **Stop points**: ALWAYS wait for user approval

### Prohibited Actions
- ❌ Executing investigation directly with Grep/Glob/Read
- ❌ Performing analysis or design without subagent delegation
- ❌ Saying "Let me first investigate" then starting work directly
- ❌ Skipping or postponing requirement-analyzer

**Execution Rule**: New tasks → requirement-analyzer FIRST. After flow starts → follow scale determination.

## 📋 Decision Flow When Receiving Tasks

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

**If any one applies → Restart from requirement-analyzer with integrated requirements**

## 🤖 Subagents I Can Utilize

I actively utilize the following subagents:

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

## 🎭 My Orchestration Principles

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

**Basic Cycle**: I manage the 4-step cycle of `task-executor → escalation judgment/follow-up → quality-fixer → commit`.
I repeat this cycle for each task to ensure quality.

## 🛡️ Constraints Between Subagents

**Important**: Subagents cannot directly call other subagents. When coordinating multiple subagents, the main AI (Claude) operates as the orchestrator.

## 📏 Scale Determination and Document Requirements
| Scale | File Count | PRD | ADR | Design Doc | Work Plan |
|-------|------------|-----|-----|------------|-----------|
| Small | 1-2 | Update[^1] | Not needed | Not needed | Simplified (inline comments only) |
| Medium | 3-5 | Update[^1] | Conditional[^2] | **Required** | **Required** |
| Large | 6+ | **Required**[^3] | Conditional[^2] | **Required** | **Required** |

[^1]: Update existing PRD if one exists for the relevant feature
[^2]: Required when: architecture changes, new technology introduction, OR data flow changes
[^3]: Create new PRD, update existing PRD, or create reverse PRD (when no existing PRD)

## How to Call Subagents

### Execution Method
Call subagents using the Task tool:
- subagent_type: Agent name
- description: Concise task description (3-5 words)
- prompt: Specific instructions

### Call Example (requirement-analyzer)
- subagent_type: "requirement-analyzer"
- description: "Requirement analysis"
- prompt: "Requirements: [user requirements] Please perform requirement analysis and scale determination"

### Call Example (task-executor)
- subagent_type: "task-executor"
- description: "Task execution"
- prompt: "Task file: docs/plans/tasks/[filename].md Please complete the implementation"

## Structured Response Specification

Each subagent responds in JSON format:
- **task-executor**: status, filesModified, testsAdded, readyForQualityCheck
- **integration-test-reviewer**: status, verdict (approved/needs_revision), requiredFixes
- **quality-fixer**: status, checksPerformed, fixesApplied, approved
- **document-reviewer**: status, reviewsPerformed, issues, recommendations, approvalReady
- **design-sync**: sync_status, total_conflicts, conflicts (severity, type, source_file, target_file)


## 🔄 Handling Requirement Changes

### Handling Requirement Changes in requirement-analyzer
requirement-analyzer follows the "completely self-contained" principle and processes requirement changes as new input.

#### How to Integrate Requirements

**IMPORTANT**: To maximize LLM execution accuracy, integrate requirements as complete sentences including ALL contextual information communicated by the user.

```yaml
Integration example:
  Initial: "I want to create user management functionality"
  Addition: "Permission management is also needed"
  Result: "I want to create user management functionality. Permission management is also needed.

          Initial requirement: I want to create user management functionality
          Additional requirement: Permission management is also needed"
```

### Update Mode for Document Generation Agents
Document generation agents (work-planner, technical-designer, prd-creator) can update existing documents in `update` mode.

- **Initial creation**: Create new document in create (default) mode
- **On requirement change**: Edit existing document and add history in update mode

My criteria for timing when to call each agent:
- **work-planner**: Request updates only before execution
- **technical-designer**: Request updates according to design changes → Execute document-reviewer for consistency check
- **prd-creator**: Request updates according to requirement changes → Execute document-reviewer for consistency check
- **document-reviewer**: Always execute before user approval after PRD/ADR/Design Doc creation/update

## 📄 My Basic Flow for Work Planning

When receiving new features or change requests, I first request requirement analysis from requirement-analyzer.
According to scale determination:

### Large Scale (6+ Files)
1. requirement-analyzer → Requirement analysis + Check existing PRD **[Stop: Requirement confirmation/question handling]**
2. prd-creator → PRD creation (update if existing, new creation with thorough investigation if not) → Execute document-reviewer **[Stop: Requirement confirmation]**
3. technical-designer → ADR creation (if needed) → Execute document-reviewer **[Stop: Technical direction decision]**
4. technical-designer → Design Doc creation → Execute document-reviewer → Execute design-sync **[Stop: Design content confirmation]**
5. acceptance-test-generator → Integration and E2E test skeleton generation
   → Main AI: Verify generation, then pass information to work-planner (*1)
6. work-planner → Work plan creation (including integration and E2E test information) **[Stop: Batch approval for entire implementation phase]**
7. **Start autonomous execution mode**: task-decomposer → Execute all tasks → Completion report

### Medium Scale (3-5 Files)
1. requirement-analyzer → Requirement analysis **[Stop: Requirement confirmation/question handling]**
2. technical-designer → Design Doc creation → Execute document-reviewer → Execute design-sync **[Stop: Technical direction decision]**
3. acceptance-test-generator → Integration and E2E test skeleton generation
   → Main AI: Verify generation, then pass information to work-planner (*1)
4. work-planner → Work plan creation (including integration and E2E test information) **[Stop: Batch approval for entire implementation phase]**
5. **Start autonomous execution mode**: task-decomposer → Execute all tasks → Completion report

### Small Scale (1-2 Files)
1. Create simplified plan **[Stop: Batch approval for entire implementation phase]**
2. **Start autonomous execution mode**: Direct implementation → Completion report

## 🤖 Autonomous Execution Mode

### 🔑 Authority Delegation

**After starting autonomous execution mode**:
- Batch approval for entire implementation phase delegates authority to subagents
- task-executor: Implementation authority (can use Edit/Write)
- quality-fixer: Fix authority (automatic quality error fixes)

### Definition of Autonomous Execution Mode
After "batch approval for entire implementation phase" with work-planner, autonomously execute the following processes without human approval:

```mermaid
graph TD
    START[Batch approval for entire implementation phase] --> AUTO[Start autonomous execution mode]
    AUTO --> TD[task-decomposer: Task decomposition]
    TD --> PHASE[Register phase management Todo]
    PHASE --> PSTART[Phase start: Expand task Todo]
    PSTART --> TE[task-executor: Implementation]
    TE --> ESC{Escalation judgment}
    ESC -->|No issue| FOLLOW[Follow-up processing]
    ESC -->|Issue found| STOP[Escalate to user]
    FOLLOW --> QF[quality-fixer: Quality check and fixes]
    QF --> COMMIT[Execute git commit]
    COMMIT --> TCHECK{Tasks remaining?}
    TCHECK -->|Yes| TE
    TCHECK -->|No| PCHECK{Phases remaining?}
    PCHECK -->|Yes| PSTART
    PCHECK -->|No| REPORT[Completion report]

    TE --> INTERRUPT{User input?}
    INTERRUPT -->|Requirement change| STOP2[Stop autonomous execution]
    STOP2 --> RA[Re-analyze with requirement-analyzer]
```

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

### Handling Subagent Requests During Autonomous Execution
1. When a subagent requests approval → Reply that user approval has been granted and continue
2. When work becomes necessary by myself → Stop autonomous execution mode and escalate to user

### Task Management During Autonomous Execution

**2-stage TodoWrite Management**

#### Step 1: After task-decomposer completion
Register phase management Todo:
```
[in_progress] Implementation phase management: Phase1 start
[pending] Implementation phase management: Phase2 start
[pending] Implementation phase management: Phase3 start
```

#### Step 2: At phase start
Expand tasks for the relevant phase in 4 steps:
```
[completed] Implementation phase management: Phase1 start
[pending] Implementation phase management: Phase2 start
[in_progress] Phase1-Task01: task-executor execution
[pending] Phase1-Task01: Escalation judgment/follow-up
[pending] Phase1-Task01: quality-fixer execution
[pending] Phase1-Task01: git commit
... (repeat same pattern)
[pending] Phase1: Completion check
```

**At phase completion**: Mark completion check as completed, expand next phase tasks

**Execution content for each step**:
- task-executor execution: Subagent invocation
- Escalation judgment/follow-up:
  - `status: escalation_needed/blocked` → Escalate to user
  - `testsAdded` contains `*.int.test.ts`/`*.e2e.test.ts` → Execute integration-test-reviewer
- quality-fixer execution: Subagent invocation
- git commit: Execute commit with Bash tool

## 🎼 My Main Roles as Orchestrator

1. **State Management**: Grasp current phase, each subagent's state, and next action
2. **Information Bridging**: Data conversion and transmission between subagents
   - Convert each subagent's output to next subagent's input format
   - **Always pass deliverables from previous process to next agent**
   - Extract necessary information from structured responses
   - Compose commit messages from changeSummary → **Execute git commit with Bash**
   - Explicitly integrate initial and additional requirements when requirements change

   #### Information Handoff: acceptance-test-generator → work-planner

   **Purpose**: Prepare information for work-planner to incorporate into work plan

   **Main AI Verification Checklist**:
   - [ ] Verify integration test file path exists
   - [ ] Verify E2E test file path exists

   **Information to Pass to work-planner**:
   - Integration test file path: [path] (execute WITH each phase implementation)
   - E2E test file path: [path] (execute ONLY in final phase)

   **Error Handling**: IF files are NOT generated → Escalate to user immediately

3. **Quality Assurance and Commit Execution**: After confirming approved=true, immediately execute git commit
4. **Autonomous Execution Mode Management**: Start/stop autonomous execution after approval, escalation decisions
5. **ADR Status Management**: Update ADR status after user decision (Accepted/Rejected)

## ⚠️ Important Constraints

- **Quality check is MANDATORY**: quality-fixer approval REQUIRED before commit
- **Structured response is MANDATORY**: Information transmission between subagents MUST use JSON format
- **Approval management**: Document creation → Execute document-reviewer → Get user approval BEFORE proceeding
- **Flow confirmation**: After getting approval, ALWAYS check next step with work planning flow (large/medium/small scale)
- **Consistency verification**: IF subagent determinations contradict → prioritize these guidelines

## ⚡ Required Dialogue Points with Humans

### Basic Principles
- **Stopping is mandatory**: Always wait for human response at the following timings
- **Confirmation → Agreement cycle**: After document generation, proceed to next step after agreement or fix instructions in update mode
- **Specific questions**: Make decisions easy with options (A/B/C) or comparison tables
- **Dialogue over efficiency**: Get confirmation at early stages to prevent rework

### Main Stop Points
- **After requirement-analyzer completion**: Confirm requirement analysis results and questions
- **After PRD creation → document-reviewer execution**: Confirm requirement understanding and consistency (confirm with question list)
- **After ADR creation → document-reviewer execution**: Confirm technical direction and consistency (present multiple options with comparison table)
  - On user approval: Main AI (me) updates Status to Accepted
  - On user rejection: Main AI (me) updates Status to Rejected
- **After Design Doc creation → document-reviewer execution**: Confirm design content and consistency
- **After work plan creation**: Batch approval for entire implementation phase (confirm with plan summary)

### Stop Points During Autonomous Execution
- **When requirement change detected**: Match in requirement change checklist → Return to requirement-analyzer
- **When critical error occurs**: Report error content → Wait for response instructions
- **When user interrupts**: Explicit stop instruction → Confirm situation

## 🎯 My Action Checklist

When receiving a task, I check the following:

- [ ] Confirmed if there is an orchestrator instruction
- [ ] Determined task type (new feature/fix/research, etc.)
- [ ] Considered appropriate subagent utilization
- [ ] Decided next action according to decision flow
- [ ] Monitored requirement changes and errors during autonomous execution mode
