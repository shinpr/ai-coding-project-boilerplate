---
description: Create work plan from design document and obtain plan approval
---

**Explicit User Instruction**: The user explicitly instructs and authorizes every subagent call named in this recipe. Execute each applicable call when its prerequisites are met.

Execute the `llm-friendly-context` skill (using Skill tool) before writing Agent prompts, handoffs, or generated artifacts.

**Command Context**: This command is dedicated to the planning phase.

## Orchestrator Definition

**Core Identity**: "I am not a worker. I am an orchestrator." (see subagents-orchestration-guide skill)

**Execution Protocol**:
1. **Delegate all work through Agent tool** — invoke sub-agents, pass data between them, and report results (permitted tools: see subagents-orchestration-guide "Orchestrator's Permitted Tools")
2. **Follow subagents-orchestration-guide skill planning flow exactly**:
   - Execute steps defined below
   - **Stop and obtain approval** for plan content before completion
3. **Scope**: Complete when work plan receives approval

**CRITICAL**: Always execute acceptance-test-generator before work-planner — the test skeleton is a required input per subagents-orchestration-guide medium/large flow.

## Scope Boundaries

**Included in this command**:
- Design document selection
- Test skeleton generation with acceptance-test-generator
- Work plan creation with work-planner
- Work plan review with document-reviewer
- Plan approval obtainment

**Responsibility Boundary**: This command completes with work plan approval.

Follow subagents-orchestration-guide skill strictly and create work plan with the following process:

## Execution Process

1. **Design Document Selection**
   - Resolve an explicit `$ARGUMENTS` path first, including moved or renamed paths
   - Otherwise discover Design Docs from repository documentation conventions and document content
   - Present options only when multiple plausible documents would produce different plans

2. **Test Skeleton Generation**
   Invoke acceptance-test-generator using Agent tool:
   - `subagent_type`: "acceptance-test-generator"
   - `description`: "Test skeleton generation"
   - `prompt`: "Generate test skeletons from Design Doc at [path]."
   - Pass the generated paths to work-planner according to subagents-orchestration-guide "acceptance-test-generator → work-planner" section

3. **Work Plan Creation**
   Invoke work-planner using Agent tool:
   - `subagent_type`: "work-planner"
   - `description`: "Work plan creation"
   - Pass `generatedFiles[]` as `testSkeletons`. An empty list means the plan needs no additional integration/E2E skeleton task

   - Follow subagents-orchestration-guide Prompt Construction Rule for additional prompt parameters

4. **Work Plan Review**
   Invoke document-reviewer to review the work plan:
   - `subagent_type`: "document-reviewer"
   - `description`: "Work plan review"
   - `prompt`: "doc_type: WorkPlan target: docs/plans/[plan-name].md. Review the Work Plan's own Implementation Scope, tasks, Completion Criteria, dependencies, execution order, exact source-anchor existence, and executable verification. Resolve governing sources from the target's Governing Documents."
   - The work plan is a derivation of the Design Doc, so plan-fidelity findings are resolved without user input. Branch on the reviewer's `verdict.decision`:
     - `needs_revision`: run Review Resolution through correction re-review and convergence, exiting to the parent workflow's requirement-change or authority gate when its conditions apply; use work-planner in update mode for rerouted corrections
     - `pass`, or Review Resolution reaching its convergence condition: proceed to Step 5
     - `rejected`: route through the Review Resolution Verdict Gate

5. **Present for Approval**
   - Present the reviewed work plan to the user for batch approval. If the user requests changes, re-invoke work-planner with revised parameters and re-run Step 4
   - Record unresolved technical evidence or external dependencies with their affected task and verification boundary. Return to the requirements gate only when confirmed outcome, desired-future requirements, and non-goals cannot all remain true without a user choice

Create a work plan from the selected design document, clarifying specific implementation steps and risks.

**Scope**: Up to work plan creation and obtaining approval for plan content.

## Response at Completion
**REQUIRED**: After plan content approval, output the following standard response
```
Planning phase completed.
- Work plan: docs/plans/[plan-name].md
- Status: Approved

Please provide separate instructions for implementation.
```
