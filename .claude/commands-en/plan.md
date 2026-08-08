---
description: Create work plan from design document and obtain plan approval
---

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

**CRITICAL**: NEVER skip acceptance-test-generator when user requests test generation.

## Scope Boundaries

**Included in this command**:
- Design document selection
- E2E test skeleton generation (optional, with user confirmation)
- Work plan creation with work-planner
- Work plan review with document-reviewer
- Plan approval obtainment

**Responsibility Boundary**: This command completes with work plan approval.

Follow subagents-orchestration-guide skill strictly and create work plan with the following process:

## Execution Process

1. **Design Document Selection**
   ! ls -la docs/design/*.md | head -10
   - Check for existence of design documents, notify user if none exist
   - Present options if multiple exist (can be specified with $ARGUMENTS)

2. **Test Skeleton Generation Confirmation**
   - Confirm with user whether to generate test skeletons (integration + E2E lanes) first
   - If user wants generation: invoke acceptance-test-generator
   - Pass generation results to next process according to subagents-orchestration-guide skill coordination specification

3. **Work Plan Creation**
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

4. **Work Plan Review**
   Invoke document-reviewer to review the work plan:
   - `subagent_type`: "document-reviewer"
   - `description`: "Work plan review"
   - `prompt`: "doc_type: WorkPlan target: docs/plans/[plan-name].md. Review the Work Plan's own Implementation Scope, tasks, Completion Criteria, dependencies, execution order, exact source-anchor existence, and executable verification. Resolve governing sources from the target's Governing Documents."
   - The work plan is a derivation of the Design Doc, so plan-fidelity findings are resolved without user input. Branch on the reviewer's `verdict.decision`:
     - `needs_revision`: run Review Resolution through its correction re-review, escalation, and convergence transitions, using work-planner in update mode for rerouted corrections
     - `approved`, or Review Resolution reaching its convergence condition: proceed to Step 5
     - `rejected`: escalate to the user

5. **Present for Approval**
   - Present the reviewed work plan to the user for batch approval. If the user requests changes, re-invoke work-planner with revised parameters and re-run Step 4.
   - Highlight steps with unclear scope or external dependencies and ask the user to confirm

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
