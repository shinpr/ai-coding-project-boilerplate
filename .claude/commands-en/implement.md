---
description: Orchestrate the complete implementation lifecycle from requirements to deployment
---

**Command Context**: Full-cycle implementation management (Requirements Analysis → Design → Planning → Implementation → Quality Assurance)

Strictly adhere to subagents-orchestration-guide skill and operate as an orchestrator.

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

### 3. After Scale Determination: Register All Flow Steps to TodoWrite (Required)

After scale determination, **register all steps of the applicable subagents-orchestration-guide skill flow to TodoWrite**. Always include: first "Confirm skill constraints", final "Verify skill fidelity". After registration, proceed through the flow referencing TodoWrite.

### 4. Execute Next Action

**Execute the next pending task in TodoWrite**.

## 📋 subagents-orchestration-guide skill Compliance Execution

**Pre-execution Checklist (Required)**:
- [ ] Confirmed relevant subagents-orchestration-guide skill flow
- [ ] Identified current progress position
- [ ] Clarified next step
- [ ] Recognized stopping points
- [ ] Understood the 4-step cycle after task execution (task-executor → escalation judgment/follow-up → quality-fixer → commit)

**Flow Adherence**: Follow "Autonomous Execution Task Management" in subagents-orchestration-guide skill, managing 4 steps with TodoWrite

## 🚨 Sub-agent Invocation Constraints

Include the following at the end of prompts when invoking sub-agents, as rule-advisor invocation from sub-agents causes system crash:
```
[Constraint] rule-advisor can only be used by Main AI
```

## 🎯 Mandatory Orchestrator Responsibilities

### Task Execution Flow
Following "Autonomous Execution Task Management" in subagents-orchestration-guide skill, manage these 4 steps with TodoWrite:
1. task-executor execution
2. Escalation judgment and follow-up
3. quality-fixer execution
4. git commit

### Test Information Communication
After acceptance-test-generator execution, when calling work-planner, communicate:
- Generated integration test file path
- Generated E2E test file path
- Explicit note that integration tests run with implementation, E2E tests run after all implementations

## Execution Method

All work is executed through sub-agents.
Sub-agent selection follows subagents-orchestration-guide skill.