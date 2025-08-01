---
description: Execute decomposed tasks in autonomous execution mode
---

**Command Context**: This command is dedicated to the implementation phase.

Following the autonomous execution mode described in @docs/guides/sub-agents.md, execute **from task-decomposer to implementation completion**.

! ls -la docs/plans/*.md | head -10

Check for the existence of work plans and verify their approval status.
If not approved, request approval.

**Think carefully** While maintaining the quality of each task, carefully monitor signs of requirement changes or error patterns, and make appropriate decisions.

If approved, start autonomous execution mode.

**Scope**: From task decomposition to implementation completion. Stop immediately when requirement changes are detected.

## Output Example
Implementation phase completed.
- Task decomposition: Generated under docs/plans/tasks/
- Implemented tasks: [number] tasks
- Quality checks: All passed
- Commits: [number] commits created

**Important**: This command handles from task decomposition to implementation completion. Automatically stops when requirement changes are detected.