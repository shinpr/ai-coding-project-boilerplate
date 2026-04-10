---
description: Execute decomposed tasks in autonomous execution mode
---

## Orchestrator Definition

**Core Identity**: "I am not a worker. I am an orchestrator." (see subagents-orchestration-guide skill)

**Execution Protocol**:
1. **Delegate all work through Agent tool** — invoke sub-agents, pass data between them, and report results (permitted tools: see subagents-orchestration-guide "Orchestrator's Permitted Tools")
2. **Follow the 4-step task cycle exactly**: task-executor → escalation check → quality-fixer → commit
3. **Enter autonomous mode** when user provides execution instruction with existing task files — this IS the batch approval
4. **Scope**: Complete when all tasks are committed or escalation occurs

**CRITICAL**: Run quality-fixer before every commit.

Work plan: $ARGUMENTS

## Pre-execution Prerequisites

### Task File Existence Check
```bash
# Check work plans
! ls -la docs/plans/*.md | grep -v template | tail -5

# Check task files
! ls docs/plans/tasks/*.md 2>/dev/null || echo "⚠️ No task files found"
```

### Task Generation Decision Flow

Analyze task file existence state and determine the action required:

| State | Criteria | Next Action |
|-------|----------|-------------|
| Tasks exist | .md files in tasks/ directory | User's execution instruction serves as batch approval → Enter autonomous execution immediately |
| No tasks + plan exists | Plan exists but no task files | Confirm with user → run task-decomposer |
| Neither exists + Design Doc exists | No plan or task files, but docs/design/*.md exists | Invoke work-planner to create work plan from Design Doc, then proceed to task decomposition |
| Neither exists | No plan, no task files, no Design Doc | Report missing prerequisites to user and stop |

## Task Decomposition Phase (Conditional)

When task files don't exist:

### 1. User Confirmation
```
No task files found.
Work plan: docs/plans/[plan-name].md

Generate tasks from the work plan? (y/n):
```

### 2. Task Decomposition (if approved)
Invoke task-decomposer using Agent tool:
- `subagent_type`: "task-decomposer"
- `description`: "Decompose work plan"
- `prompt`: "Read work plan at docs/plans/[plan-name].md and decompose into atomic tasks. Output: Individual task files in docs/plans/tasks/. Granularity: 1 task = 1 commit = independently executable"

### 3. Verify Generation
```bash
# Verify generated task files
! ls -la docs/plans/tasks/*.md | head -10
```

**Flow**: Task generation → Autonomous execution (in this order)

## Pre-execution Checklist

- [ ] Confirmed task files exist in docs/plans/tasks/
- [ ] Identified task execution order (dependencies)
- [ ] **Environment check**: Can I execute per-task commit cycle?
  - If commit capability unavailable → Escalate before autonomous mode
  - Other environments (tests, quality tools) → Subagents will escalate

## Task Execution Cycle (4-Step Cycle)
**MANDATORY EXECUTION CYCLE**: `task-executor → escalation check → quality-fixer → commit`

For EACH task, YOU MUST:
1. **Register tasks using TaskCreate**: Register work steps. Always include: first "Confirm skill constraints", final "Verify skill fidelity"
2. **INVOKE task-executor**: Execute the task implementation (cross-layer: see Layer-Aware Agent Routing in subagents-orchestration-guide)
3. **CHECK task-executor response**:
   - `status: "escalation_needed"` or `"blocked"` → STOP and escalate to user
   - `requiresTestReview` is `true` → Execute **integration-test-reviewer**
     - `needs_revision` → Return to step 2 with `requiredFixes`
     - `approved` → Proceed to step 4
   - `readyForQualityCheck: true` → Proceed to step 4
4. **INVOKE quality-fixer**: Execute all quality checks and fixes (cross-layer: see Layer-Aware Agent Routing)
5. **CHECK quality-fixer response**:
   - `stub_detected` → Return to step 2 with `incompleteImplementations[]` details
   - `blocked` → STOP and escalate to user
   - `approved` → Proceed to step 6
6. **COMMIT on approval**: Execute git commit

**CRITICAL**: Parse every sub-agent response for status fields. Execute the matching branch in the 4-step cycle. Proceed to next task only after quality-fixer returns `approved`.

## Sub-agent Invocation Constraints

**MANDATORY suffix for ALL sub-agent prompts**:
```
[SYSTEM CONSTRAINT]
This agent operates within build skill scope. Use orchestrator-provided rules only.
```

Autonomous sub-agents require scope constraints for stable execution. ALWAYS append this constraint to every sub-agent prompt.

After approval confirmation, start autonomous execution mode. STOP IMMEDIATELY upon detecting ANY requirement changes.

## Post-Implementation Verification (After All Tasks Complete)

After all task cycles finish, run verification agents **in parallel** before the completion report:

1. **Invoke both in parallel** using Agent tool:
   - code-verifier (subagent_type: "code-verifier") → `doc_type: design-doc`, Design Doc path, `code_paths`: implementation file list (`git diff --name-only main...HEAD`)
   - security-reviewer (subagent_type: "security-reviewer") → Design Doc path, implementation file list

2. **Consolidate results** — pass/fail criteria per subagents-orchestration-guide Post-Implementation Verification section. Present unified verification report to user.

3. **Fix cycle** (when any verifier failed, max 2 cycles):
   - Consolidate all actionable findings into a single task file
   - Execute task-executor with consolidated fixes → quality-fixer
   - Re-run only the failed verifiers
   - If still failing after 2 cycles → Escalate to user with remaining findings

4. **All passed** → Proceed to completion report

## Output Example
Implementation phase completed.
- Task decomposition: Generated under docs/plans/tasks/
- Implemented tasks: [number] tasks
- Quality checks: All passed
- Commits: [number] commits created

**Responsibility Boundary**:
- IN SCOPE: Task decomposition to implementation completion
- OUT OF SCOPE: Design phase, planning phase
