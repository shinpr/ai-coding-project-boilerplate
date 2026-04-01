---
description: Execute from requirement analysis to design document creation
---

**Command Context**: This command is dedicated to the design phase.

## Orchestrator Definition

**Core Identity**: "I am not a worker. I am an orchestrator." (see subagents-orchestration-guide skill)

**Execution Protocol**:
1. **Delegate all work through Agent tool** — invoke sub-agents, pass data between them, and report results (permitted tools: see subagents-orchestration-guide "Orchestrator's Permitted Tools")
2. **Follow subagents-orchestration-guide skill design flow exactly**:
   - Execute: requirement-analyzer → codebase-analyzer → technical-designer → code-verifier → document-reviewer → design-sync
   - **ADR-only**: Skip codebase-analyzer and code-verifier (these apply to Design Doc only)
   - **Stop at every `[Stop: ...]` marker** → Wait for user approval before proceeding
3. **Scope**: Complete when design documents receive approval

**CRITICAL**: NEVER skip document-reviewer, design-sync, or stopping points defined in subagents-orchestration-guide skill flows.

## Workflow Overview

```
Requirements → requirement-analyzer → [Stop: Scale determination]
                                           ↓
                                   codebase-analyzer → technical-designer
                                           ↓
                                   code-verifier → document-reviewer
                                           ↓
                                      design-sync → [Stop: Design approval]
```

Requirements: $ARGUMENTS

Considering the deep impact on design, first engage in dialogue to understand the background and purpose of requirements:
- What problems do you want to solve?
- Expected outcomes and success criteria
- Relationship with existing systems

Once requirements are moderately clarified, analyze with requirement-analyzer and create appropriate design documents according to scale.

Clearly present design alternatives and trade-offs.

Execute the process below within design scope. Follow subagents-orchestration-guide Call Examples for codebase-analyzer and code-verifier invocations.

## Scope Boundaries

**Included in this command**:
- Requirement analysis with requirement-analyzer
- Codebase analysis with codebase-analyzer (before technical design)
- ADR creation (if architecture changes, new technology, or data flow changes)
- Design Doc creation with technical-designer
- Design Doc verification with code-verifier (before document review)
- Document review with document-reviewer
- Design Doc consistency verification with design-sync

**Responsibility Boundary**: This command completes with design document approval.

## Execution Flow

1. requirement-analyzer → Requirement analysis
2. codebase-analyzer → Codebase analysis (pass requirement-analyzer output)
3. technical-designer → Design Doc creation (pass codebase-analyzer output)
4. code-verifier → Verify Design Doc against existing code
5. document-reviewer → Single document quality check (pass code-verifier results)
6. User approval (WAIT for approval)
7. design-sync → Design Doc consistency verification
   - IF conflicts found → Report to user → Wait for fix instructions → Fix with technical-designer(update)
   - IF no conflicts → End

## Completion Criteria

- [ ] Executed requirement-analyzer and determined scale
- [ ] Executed codebase-analyzer and passed results to technical-designer
- [ ] Created appropriate design document (ADR or Design Doc) with technical-designer
- [ ] Executed code-verifier on Design Doc and passed results to document-reviewer (skip for ADR-only)
- [ ] Executed document-reviewer and addressed feedback
- [ ] Executed design-sync for consistency verification
- [ ] Obtained user approval for design document

## Output Example
Design phase completed.
- Design document: docs/design/[document-name].md
- Consistency: No conflicts with other Design Docs (or fixes completed)

**Responsibility Boundary**: This command ends with design approval + consistency verification. Work planning and beyond are outside scope.