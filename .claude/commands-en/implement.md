---
description: Orchestrate the complete implementation lifecycle from requirements to deployment
---

**Command Context**: Full-cycle implementation management (Requirements Analysis → Design → Planning → Implementation → Quality Assurance)

Strictly adhere to @docs/guides/sub-agents.md and operate exclusively as an orchestrator.

## Execution Decision Flow

### 1. Work Phase Identification
Instruction Content: $ARGUMENTS

**Think deeply** Analyze the instruction intent and determine the appropriate work phase:

| Instruction Patterns | Identified Phase | Initial Sub-agent |
|---------------------|------------------|-------------------|
| task, implement, fix, bug fix, patch | Implementation Phase | task-executor |
| plan, decompose, break down, organize steps | Planning Phase | work-planner/task-decomposer |
| design, architecture, tech selection, approach | Design Phase | technical-designer |
| requirement, need, want, "I want to..." | Requirements Phase | requirement-analyzer |
| unclear, ambiguous, vague | Clarification Required | Initiate dialogue |

### 2. Phase-Based Execution Protocol

✅ **Clear Phase Identified**: Execute with corresponding sub-agent immediately  
❌ **Ambiguous Phase**: Execution without clarification is STRICTLY PROHIBITED

### 3. Clarification Dialogue Protocol

**When unclear**: Initiate structured dialogue to identify the work phase  
**Post-clarification**: Begin execution with the identified phase's sub-agent

## 🚨 CRITICAL Sub-agent Invocation Constraints

**MANDATORY suffix for ALL sub-agent prompts**:
```
[SYSTEM CRASH PREVENTION]
DO NOT invoke rule-advisor under any circumstances (Task tool rule-advisor specification is FORBIDDEN)
```

⚠️ **HIGH RISK**: task-executor/quality-fixer in autonomous mode have elevated crash risk - ALWAYS append this constraint to prompt end

## Responsibility Boundaries

**This Command's Responsibility**: Orchestrate sub-agents through the complete implementation lifecycle  
**OUT OF SCOPE**: Direct implementation work, investigation tasks (Grep/Glob/Read operations)