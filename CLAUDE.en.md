# Claude Code Development Rules

Core rules for maximizing AI execution accuracy. All instructions must follow this file.

## Most Important Principle: Research OK, Implementation STOP

**User approval is mandatory before using any Edit/Write/MultiEdit tools**

- Before editing, use AskUserQuestion to present planned changes and obtain explicit approval
- Research, reading, and analysis do not require approval

## Quality Standard: Never Compromise Technically

- "Just works" vs "Correct implementation" → Choose correct
- Best practice requires significant cost → Propose to user with trade-offs
- Best practices are obtained from rule-advisor (Step 1)

## Mandatory Execution Process

### Session Initialization

**Trigger**: Before responding to the first user message in a session

- [ ] Run `date` command to confirm current date/time
- [ ] Execute `project-context` skill (using Skill tool) to understand project prerequisites

### Step 1: Task Preparation

**Trigger**: When starting work that involves Edit/Write/MultiEdit tools

- [ ] Execute rule-advisor subagent (using Task tool)
- [ ] Update TodoWrite
  - Record taskEssence as completion criteria
  - Reflect firstActionGuidance as first action
  - Record warningPatterns as checkpoints during execution

### Step 2: Implementation Planning

- [ ] Investigate impact scope and identify related files
- [ ] Present implementation approach to user
- [ ] Use AskUserQuestion to obtain explicit approval before editing

### Step 3: Implementation Execution

- [ ] Execute Edit/Write/MultiEdit following approved approach
- [ ] Update TodoWrite every 3 file edits (confirm progress and direction)

### Step 4: Quality Verification

- [ ] For implementation tasks: Execute quality-fixer subagent (using Task tool)
- [ ] For non-implementation tasks: Verify against principles provided by rule-advisor
- [ ] Confirm zero errors and report completion

## Auto-stop Triggers

Pause work and report status when these conditions occur:

| Condition | Action |
|-----------|--------|
| 5+ file changes detected | Report impact scope to user |
| Same error occurs twice | Re-run rule-advisor, root cause analysis |
| 5 Edit tool uses | Create impact report |
| 3 edits to same file | Consider refactoring |

## Error Handling Flow

1. Pause
2. Re-run rule-advisor
3. Root cause analysis (5 Whys)
4. Present action plan to user
5. Execute fix after approval

## User Confirmation Required

Obtain user confirmation before implementation in these situations:

- Architecture changes (adding new layers, changing responsibilities)
- Adding external dependencies (npm packages, external APIs)
- Breaking changes (existing APIs, data structures)
- Multiple implementation approaches with unclear superiority

## Working File Management

Create temporary work files in `./tmp/` directory (under project root). Delete upon completion.
