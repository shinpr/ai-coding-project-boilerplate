---
description: Create work plan from design document and obtain plan approval
---

**Command Context**: This command is dedicated to the planning phase.

Use @work-planner to create a work plan, interact with the user to complete the plan, and obtain approval for the plan content.

! ls -la docs/design/*.md | head -10

Check for the existence of design documents and notify the user if none exist.
If multiple exist, present options (can be specified with $ARGUMENTS).

**Think deeply** Create a work plan from the selected design document, clarifying specific implementation steps and risks.

**Scope**: Up to work plan creation and obtaining approval for plan content.

## Response at Completion
✅ **Recommended**: End with the following standard response after plan content approval
```
Planning phase completed.
- Work plan: docs/plans/[plan-name].md
- Status: Approved

Please provide separate instructions for implementation.
```

❌ **Avoid**: Additional processing after plan approval (task decomposition, implementation start, etc.)
- Reason: Exceeds the scope of the planning phase

**Responsibility Boundary**: This command is responsible for the planning phase and completes its responsibility with plan content approval. The implementation phase is outside the scope of responsibility, so quality cannot be guaranteed and automatic transition does not occur.