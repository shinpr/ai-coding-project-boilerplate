---
description: Execute from requirement analysis to design document creation
---

**Command Context**: This command is dedicated to the design phase.

Following the design flow described in @docs/guides/sub-agents.md, execute **from requirement-analyzer to design document creation and approval**.

Requirements: $ARGUMENTS

**Think harder** Considering the deep impact on design, first engage in dialogue to understand the background and purpose of requirements:
- What problems do you want to solve?
- Expected outcomes and success criteria
- Relationship with existing systems

Once requirements are moderately clarified, analyze with requirement-analyzer and create appropriate design documents according to scale.

Clearly present design alternatives and trade-offs.

**Scope**: Up to design document (ADR/Design Doc) approval + Design Doc consistency verification. Work planning and beyond are outside the scope of this command.

## Execution Flow

1. requirement-analyzer → Requirement analysis
2. technical-designer → Design Doc creation
3. document-reviewer → Single document quality check
4. User approval
5. design-sync → Design Doc consistency verification
   - No other Design Docs → Immediate termination with NO_CONFLICTS
   - Conflicts found → Report to user → Wait for fix instructions → Fix with technical-designer(update)
   - No conflicts → End

## Output Example
Design phase completed.
- Design document: docs/design/[document-name].md
- Consistency: No conflicts with other Design Docs (or fixes completed)

**Important**: This command ends with design approval + consistency verification. Does not propose transition to next phase.