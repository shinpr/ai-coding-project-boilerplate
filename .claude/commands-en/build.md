---
description: Execute decomposed tasks in autonomous execution mode
---

**Command Context**: This command is dedicated to the implementation phase with autonomous execution.

Strictly follow @docs/guides/sub-agents.md and act as an orchestrator.

Work plan: $ARGUMENTS

## Metacognition for Each Task
**Required cycle**: `task-executor → quality-fixer → commit`

Before starting any task, always:
1. **Execute rule-advisor**: Understand the essence of the task
2. **Update TodoWrite**: Structure progress tracking  
3. **Process structured responses**: When `readyForQualityCheck: true` is detected, execute quality-fixer immediately

**Think deeply** Monitor structured responses carefully and ensure all quality gates are passed without exception.

! ls -la docs/plans/*.md | head -10

Verify approval status before proceeding. Once confirmed, initiate autonomous execution mode.

**Scope**: From task decomposition through implementation completion. Immediate halt upon detecting requirement changes.

## Output Example
Implementation phase completed.
- Task decomposition: Generated under docs/plans/tasks/
- Implemented tasks: [number] tasks
- Quality checks: All passed
- Commits: [number] commits created

**Important**: This command manages the entire autonomous execution flow from task decomposition to implementation completion. Automatically stops when requirement changes are detected.