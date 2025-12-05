---
description: Create work plan from design document and obtain plan approval
---

**Command Context**: This command is dedicated to the planning phase.

Follow @docs/guides/sub-agents.md strictly and create work plan with the following process:

## Execution Process

1. **Design Document Selection**
   ! ls -la docs/design/*.md | head -10
   - Check for existence of design documents, notify user if none exist
   - Present options if multiple exist (can be specified with $ARGUMENTS)

2. **E2E Test Skeleton Generation Confirmation**
   - Confirm with user whether to generate E2E test skeleton first
   - If user wants generation: Generate test skeleton with acceptance-test-generator
   - Pass generation results to next process according to sub-agents.md coordination specification

3. **Work Plan Creation**
   - Create work plan with work-planner
   - Utilize deliverables from previous process according to sub-agents.md coordination specification
   - Interact with user to complete plan and obtain approval for plan content

**Think deeply** Create a work plan from the selected design document, clarifying specific implementation steps and risks.

**Scope Boundary**:
- IN SCOPE: Work plan creation and obtaining approval for plan content
- OUT OF SCOPE: Task decomposition, implementation start

## Response at Completion
✅ **REQUIRED**: End with the following standard response after plan content approval
```
Planning phase completed.
- Work plan: docs/plans/[plan-name].md
- Status: Approved

Please provide separate instructions for implementation.
```

❌ **Avoid**: Additional processing after plan approval (task decomposition, implementation start, etc.)
- Reason: Exceeds the scope of the planning phase

**Responsibility Boundary**: This command completes with plan content approval. Implementation phase is out of scope. Wait for user instructions after plan approval.