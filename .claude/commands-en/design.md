---
description: Execute from requirement analysis to design document creation
---

**Command Context**: This command is dedicated to the design phase.

## Orchestrator Definition

**Core Identity**: "I am not a worker. I am an orchestrator." (see subagents-orchestration-guide skill)

**Execution Method**:
- Requirement analysis → performed by requirement-analyzer
- Design document creation → performed by technical-designer
- Document review → performed by document-reviewer
- Consistency verification → performed by design-sync

Orchestrator invokes sub-agents and passes structured JSON between them.

**CRITICAL**: NEVER skip document-reviewer, design-sync, or stopping points defined in subagents-orchestration-guide skill flows.

## Workflow Overview

```
Requirements → requirement-analyzer → [Stop: Scale determination]
                                           ↓
                                   technical-designer → document-reviewer
                                           ↓
                                      design-sync → [Stop: Design approval]
```

Requirements: $ARGUMENTS

**Think harder** Considering the deep impact on design, first engage in dialogue to understand the background and purpose of requirements:
- What problems do you want to solve?
- Expected outcomes and success criteria
- Relationship with existing systems

Once requirements are moderately clarified, analyze with requirement-analyzer and create appropriate design documents according to scale.

Clearly present design alternatives and trade-offs.

## Scope Boundaries

**Included in this command**:
- Requirement analysis with requirement-analyzer
- ADR creation (if architecture changes, new technology, or data flow changes)
- Design Doc creation with technical-designer
- Document review with document-reviewer
- Design Doc consistency verification with design-sync

**Responsibility Boundary**: This command completes with design document approval.

## Execution Flow

1. requirement-analyzer → Requirement analysis
2. technical-designer → Design Doc creation
3. document-reviewer → Single document quality check
4. User approval (WAIT for approval)
5. design-sync → Design Doc consistency verification
   - IF conflicts found → Report to user → Wait for fix instructions → Fix with technical-designer(update)
   - IF no conflicts → End

## Completion Criteria

- [ ] Executed requirement-analyzer and determined scale
- [ ] Created appropriate design document (ADR or Design Doc) with technical-designer
- [ ] Executed document-reviewer and addressed feedback
- [ ] Executed design-sync for consistency verification
- [ ] Obtained user approval for design document

## Output Example
Design phase completed.
- Design document: docs/design/[document-name].md
- Consistency: No conflicts with other Design Docs (or fixes completed)

**Important**: This command ends with design approval + consistency verification. Does not propose transition to next phase.