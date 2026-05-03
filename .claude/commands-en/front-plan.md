---
description: Create frontend work plan from design document and obtain plan approval
---

**Command Context**: This command is dedicated to the frontend planning phase.

## Orchestrator Definition

**Core Identity**: "I am an orchestrator." (see subagents-orchestration-guide skill)

**Execution Protocol**:
1. **Delegate all work** to sub-agents — your role is to invoke sub-agents, pass data between them, and report results
2. **Follow subagents-orchestration-guide skill planning flow**:
   - Execute steps defined below
   - **Stop and obtain approval** for plan content before completion
3. **Scope**: See Scope Boundaries below

**CRITICAL**: Always execute acceptance-test-generator before work-planner — the test skeleton is a required input per subagents-orchestration-guide medium/large flow.

## Scope Boundaries

**Included in this command**:
- Design document selection
- Test skeleton generation with acceptance-test-generator
- Work plan creation with work-planner
- Plan approval obtainment

**Responsibility Boundary**: This command completes with work plan approval.

Follow the planning process below:

## Execution Process

### Step 1: Design Document Selection
   ! ls -la docs/design/*.md | head -10
   - Check for existence of design documents, notify user if none exist
   - Present options if multiple exist (can be specified with $ARGUMENTS)

### Step 2: Test Skeleton Generation
Invoke acceptance-test-generator using Agent tool:
- `subagent_type`: "acceptance-test-generator"
- `description`: "Test skeleton generation"
- If UI Spec exists: `prompt: "Generate test skeletons from Design Doc at [path]. UI Spec at [ui-spec path]."`
- If no UI Spec: `prompt: "Generate test skeletons from Design Doc at [path]."`

Pass per-lane test file paths and absence reasons to work-planner according to subagents-orchestration-guide "acceptance-test-generator → work-planner" section.

### Step 3: Work Plan Creation
Invoke work-planner using Agent tool:
- `subagent_type`: "work-planner"
- `description`: "Work plan creation"
- If test skeletons were generated in Step 2, build the prompt by listing every lane's status:
  - Always include: "Integration test file: [path or 'not generated']"
  - For each E2E lane (`fixtureE2e`, `serviceE2e`):
    - When `generatedFiles.<lane>` is not null: "[lane] test file: [path]"
    - When `generatedFiles.<lane>` is null: "No [lane] skeleton generated (reason: [e2eAbsenceReason.<lane>])"
  - Append placement guidance: "Integration tests are created simultaneously with each phase implementation. fixture-e2e tests are created alongside the UI feature phase. service-integration-e2e tests are executed only in the final phase."
- If test skeletons were not generated:
  `prompt`: "Create work plan from Design Doc at [path]."

- Follow subagents-orchestration-guide Prompt Construction Rule for additional prompt parameters
- Present work plan to user for review. If user requests changes, re-invoke work-planner with revised parameters
- Highlight steps with unclear scope or external dependencies and ask user to confirm

**Scope**: Up to work plan creation and obtaining approval for plan content.

## Response at Completion
End with the following standard response after plan content approval
```
Frontend planning phase completed.
- Work plan: docs/plans/[plan-name].md
- Status: Approved

Please provide separate instructions for implementation.
```
