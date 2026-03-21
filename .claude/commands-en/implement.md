---
description: Orchestrate the complete implementation lifecycle from requirements to deployment
---

**Command Context**: Full-cycle implementation management (Requirements Analysis → Design → Planning → Implementation → Quality Assurance)

Strictly adhere to subagents-orchestration-guide skill and operate as an orchestrator — delegate all work through Agent tool, pass data between sub-agents, and report results (permitted tools: see subagents-orchestration-guide "Orchestrator's Permitted Tools").

## Execution Decision Flow

### 1. Current Situation Assessment
Instruction Content: $ARGUMENTS

**Think deeply** Assess the current situation:

| Situation Pattern | Decision Criteria | Next Action |
|------------------|------------------|-------------|
| New Requirements | No existing work, new feature/fix request | Start with requirement-analyzer |
| Flow Continuation | Existing docs/tasks present, continuation directive | Identify next step in subagents-orchestration-guide skill flow |
| Quality Errors | Error detection, test failures, build errors | Execute quality-fixer |
| Ambiguous | Intent unclear, multiple interpretations possible | Confirm with user |

### 2. Progress Verification for Continuation
When continuing existing flow, verify:
- Latest artifacts (PRD/ADR/Design Doc/Work Plan/Tasks)
- Current phase position (Requirements/Design/Planning/Implementation/QA)
- Identify next step in subagents-orchestration-guide skill corresponding flow

### 3. Design Phase

When requirement-analyzer's `crossLayerScope` indicates cross-layer scope (backend + frontend), follow the Cross-Layer Orchestration section in subagents-orchestration-guide skill for Design Doc creation per layer.

### 4. After requirement-analyzer [Stop]

When user responds to questions:
- If response matches any `scopeDependencies.question` → Check `impact` for scale change
- If scale changes → Re-execute requirement-analyzer with updated context
- If `confidence: "confirmed"` or no scale change → Proceed to next step

### 5. After Scale Determination: Register All Flow Steps with TaskCreate (Required)

After scale determination, **register all steps of the applicable subagents-orchestration-guide skill flow with TaskCreate**. Always include: first "Confirm skill constraints", final "Verify skill fidelity". After registration, proceed through the flow referencing TaskList.

### 6. Execute Next Action

**Check next pending task with TaskList**.

## 📋 subagents-orchestration-guide skill Compliance Execution

**Pre-execution Checklist (Required)**:
- [ ] Confirmed relevant subagents-orchestration-guide skill flow
- [ ] Identified current progress position
- [ ] Clarified next step
- [ ] Recognized stopping points → **Use AskUserQuestion for confirmation at all Stop points**
- [ ] Understood the 4-step cycle after task execution (task-executor → escalation judgment/follow-up → quality-fixer → commit)

**Flow Adherence**: Follow "Autonomous Execution Task Management" in subagents-orchestration-guide skill, managing 4 steps with TaskCreate/TaskUpdate

## 🚨 Sub-agent Invocation Constraints

Include the following at the end of prompts when invoking sub-agents, as rule-advisor invocation from sub-agents causes system crash:
```
[Constraint] rule-advisor can only be used by Main AI
```

## 🎯 Mandatory Orchestrator Responsibilities

### Task Execution Quality Cycle
Following "Autonomous Execution Task Management" in subagents-orchestration-guide skill, manage these steps with TaskCreate/TaskUpdate:
1. **INVOKE task-executor**: Execute implementation (cross-layer: see Layer-Aware Agent Routing)
2. **CHECK task-executor response**:
   - `status: "escalation_needed"` or `"blocked"` → STOP and escalate to user
   - `requiresTestReview` is `true` → Execute **integration-test-reviewer**
     - `needs_revision` → Return to step 1 with `requiredFixes`
     - `approved` → Proceed to step 3
   - Otherwise → Proceed to step 3
3. **INVOKE quality-fixer**: Execute all quality checks and fixes (cross-layer: see Layer-Aware Agent Routing)
4. **COMMIT on approval**: After `approved: true` → Execute git commit

### Security Review (After All Tasks Complete)

After all task cycles finish, invoke security-reviewer before the completion report:
1. **Agent tool** (subagent_type: "security-reviewer") → Pass Design Doc path and implementation file list
2. Check response:
   - `approved` or `approved_with_notes` → Proceed to completion report (include notes if present)
   - `needs_revision` → Execute task-executor with `requiredFixes`, then quality-fixer, then re-invoke security-reviewer
   - `blocked` → Escalate to user

### Test Information Communication
After acceptance-test-generator execution, when calling work-planner, communicate:
- Generated integration test file path
- Generated E2E test file path
- Explicit note that integration tests run with implementation, E2E tests run after all implementations

## Execution Method

All work is executed through sub-agents.
Sub-agent selection follows subagents-orchestration-guide skill.