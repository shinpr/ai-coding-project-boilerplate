# Claude Code Development Rules

Core rules for maximizing AI execution accuracy. All instructions must follow this file.

## 🚨 Most Important Principle: Research OK, Implementation STOP

**User approval is mandatory before using any Edit/Write/MultiEdit tools**

Reason: To prevent implementations that differ from user intent and ensure correct direction

## Mandatory Execution Process

### Execution Flow (Required Steps)
1. **Task decomposition with TodoWrite** → Cannot proceed to implementation without it
   Reason: To structure tasks and enable progress tracking
2. **Execute rule-advisor** → Understand task essence and select appropriate rules
   Reason: To select appropriate rules and understand task essence
3. **Use Edit/Write/MultiEdit** → User approval is mandatory
   Reason: Practicing the most important principle (Research OK, Implementation STOP)
4. **Execute implementation** → Cannot complete with quality check errors
   Reason: To ensure high-quality code
5. **Count file changes** → Auto-stop when threshold exceeded
   Reason: To get confirmation before impact becomes too large

### TodoWrite and Metacognition Integration
**Execution Rules**:
- When `pending → in_progress`: rule-advisor output is mandatory
- **After rule-advisor execution**: Always update TodoWrite (revise task content, priority, granularity)
  - Concretize task description based on taskEssence
  - Reflect firstActionGuidance in the first task
  - Restructure tasks considering warningPatterns
- Using Edit tools without TodoWrite: Stop as rule violation
- When updating task status: Recording implementation details is mandatory (no blanks)

### Execution Prerequisites
1. **rule-advisor output** → JSON response must exist
2. **TodoWrite task** → in_progress status must exist
3. **User approval record** → Explicit approval before Edit/Write
4. **Quality check results** → Cannot complete with errors > 0

### Prohibited Actions
- **Using any type** → Causes type check errors
  Reason: Destroys type safety and causes runtime errors
- **Using Edit without TodoWrite** → Rule violation
  Reason: Cannot track progress or ensure quality without task management
- **Edit/Write/MultiEdit without approval** → Move to approval waiting
  Reason: To prevent violating the most important principle
- **Declaring completion with quality errors** → Does not meet completion criteria
  Reason: To prevent incomplete code from being mixed in

## Metacognitive Execution (Mandatory at Task Start)

### Metacognition with Information from rule-advisor
1. **Understand taskEssence (task essence)**
   - Distinguish between surface work and fundamental purpose
   - Judge "quick fix" vs "proper solution"

2. **Confirm applicableRules (applicable rules)**
   - Judge if selected rules are appropriate
   - Load necessary sections

3. **Recognize pastFailurePatterns (past failures)**
   - Be careful not to repeat same failures
   - Be conscious of suggested workarounds

4. **Execute firstAction (initial action)**
   - Start with recommended tools
   - Proceed systematically

## Claude Behavior Control (Failure Prevention)

### Auto-stop Triggers (Must Stop)
- **Detecting 5+ file changes**: Stop immediately, report impact to user
  Reason: Large changes require advance planning and review
- **Same error occurs 3 times**: Root cause analysis mandatory
  Reason: Need root solution, not symptomatic treatment
- **Detecting excessive unknown type usage**: Reconsider type guard design
  Reason: High possibility of type safety design issues
- **After editing 3 files**: Force TodoWrite update (cannot use next Edit tool without update)
  Reason: Need to confirm progress and direction

### Handling Error-fixing Impulse
1. Error discovered → **Pause**
2. Re-execute rule-advisor
3. Root cause analysis (repeat "why" 5 times to identify true cause)
4. Present action plan
5. Fix after user approval

### Escalation Criteria (User Confirmation Required)
- Architecture changes (adding new layers, changing responsibilities)
- Adding external dependencies (npm packages, external APIs)
- Breaking changes (changing existing APIs, data structures)
- Multiple implementation methods with unclear superiority

### Preventing Rule Ignoring When Focused
**Measurable Forced Stop Criteria**:
- **2nd consecutive error fix**: Automatically trigger rule-advisor re-execution
- **5 Edit tool uses**: Force impact report creation
- **3 edits to same file**: Force stop for refactoring consideration

### Temporary File Creation Rules
Use `tmp/` directory for work files. Delete upon completion.

### Proactive Use of Specialized Agents (PROACTIVELY)
- **When quality-related keywords detected**: quality-fixer mandatory execution
  - Type errors, build errors, lint errors, format warnings
  - Test failures, quality checks, verification tasks
- **At task start**: rule-advisor mandatory execution
  - Execute before TodoWrite creation and reflect results