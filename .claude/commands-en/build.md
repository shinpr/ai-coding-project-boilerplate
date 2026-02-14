---
description: Execute decomposed tasks in autonomous execution mode
---

Follow subagents-orchestration-guide skill strictly and act as the **orchestrator**.

Work plan: $ARGUMENTS

## 📋 Pre-execution Prerequisites

### Task File Existence Check
```bash
# Check work plans
! ls -la docs/plans/*.md | grep -v template | tail -5

# Check task files
! ls docs/plans/tasks/*.md 2>/dev/null || echo "⚠️ No task files found"
```

### Task Generation Decision Flow

Analyze task file existence state and determine the appropriate action:

| State | Criteria | Next Action |
|-------|----------|-------------|
| Tasks exist | .md files in tasks/ directory | Proceed to autonomous execution |
| No tasks + plan exists | Plan exists but no task files | Confirm with user → run task-decomposer |
| Neither exists | No plan or task files | Error: Prerequisites not met |

## 🔄 Task Decomposition Phase (Conditional)

When task files don't exist:

### 1. User Confirmation
```
No task files found.
Work plan: docs/plans/[plan-name].md

Generate tasks from the work plan? (y/n):
```

### 2. Task Decomposition (if approved)

Invoke task-decomposer using Task tool:
- `subagent_type`: "task-decomposer"
- `description`: "Decompose work plan into tasks"
- `prompt`: "Read work plan and decompose into atomic tasks. Input: docs/plans/[plan-name].md. Output: Individual task files in docs/plans/tasks/. Granularity: 1 task = 1 commit = independently executable"

### 3. Verify Generation
```bash
# Verify generated task files
! ls -la docs/plans/tasks/*.md | head -10
```

✅ **Recommended**: After task generation, automatically proceed to autonomous execution
❌ **Avoid**: Starting implementation without task generation

## 🧠 Task Execution Flow
Following "Autonomous Execution Task Management" in subagents-orchestration-guide skill, manage 4 steps with TodoWrite. Always include: first "Confirm skill constraints", final "Verify skill fidelity":
1. task-executor execution (cross-layer: route by filename pattern per Layer-Aware Agent Routing in subagents-orchestration-guide skill)
2. Escalation judgment and follow-up
3. quality-fixer execution (cross-layer: layer-appropriate quality-fixer)
4. git commit

After approval confirmation, start autonomous execution mode. Stop immediately when requirement changes detected.

## Output Example
Implementation phase completed.
- Task decomposition: Generated under docs/plans/tasks/ (if executed)
- Implemented tasks: [number] tasks
- Quality checks: All passed
- Commits: [number] commits created

**Responsibility Boundary**:
- IN SCOPE: Task decomposition to implementation completion
- OUT OF SCOPE: Design phase, planning phase