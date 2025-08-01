# Claude Code Development Rules

This project is optimized specifically for Claude Code. This file contains development rules for Claude Code to generate the highest quality TypeScript code. Please prioritize this project's rules over general conventions.

## 🚨 Most Critical Rule: Investigation OK, Implementation STOP

> **This is an absolute directive that takes precedence over all other rules**

### ✅ Permitted Investigation Activities (No User Approval Required)
- Information gathering with Read/Grep/LS/Glob/Task tools
- Current situation analysis and document review
- Problem identification and impact scope investigation
- Error message confirmation and root cause analysis
- Understanding existing code structure

### ✅ Recommended: Get User Approval Before Starting Implementation Activities
- **Benefits**: Ensures implementation perfectly aligns with user intent and prevents unexpected changes
- **Practice**: Always obtain user approval before using Edit/Write/MultiEdit tools
- **Reason**: While Claude Code can operate autonomously, deferring final decisions to users ensures reliable project direction control

### ✅ Activities Permitted After Approval
Once the user approves implementation, the following activities can be performed freely until the next new instruction:
- Using Edit/Write/MultiEdit within the approved work scope
- Modifying related files
- **Creating commits** (should be done proactively)
- Executing quality checks
- Running and fixing tests

### 📋 Mandatory Pre-Implementation Flow
1. **Report Investigation Results**: "XX is the cause, and there is a problem with YY"
2. **Present Implementation Plan**: "I will now fix XX. Specifically..."
3. **Wait for Explicit User Approval**: Approval such as "OK", "proceed", "go ahead"
4. **Start Implementation After Approval**: Use Edit/Write and other tools

### ⚠️ Exception
Only when the user explicitly instructs immediate implementation such as "fix it right away" or "implement directly", the approval step can be skipped.

## Development Workflow and Procedures

### Basic Workflow
1. **Load Rule Files**: Always read all 7 rule files
2. **Document Review**: Check related ADR/Design Doc/work plans
3. **Plan Development**: Present implementation plan and obtain user approval
4. **Execute Implementation**: Implement with progressive quality assurance
5. **Quality Check**: Commit after all checks pass

### Tool Utilization
- **Main Development**: Claude Code

## Basic Principles When in Doubt

### Error Response Flow
1. **Read Error Messages Accurately** - Focus on the beginning and end of stack traces
2. **Analyze Root Causes** - Repeat "Why?" 5 times (5 Whys)
3. **Check Impact Scope** - Investigate effects on other files and features
4. **Consider Multiple Solutions** - Think of at least 2 or more solution approaches
5. **Confirm with User When Uncertain** - Always confirm rather than proceeding with assumptions

### Decision Priority Order
Priority order when multiple principles conflict during implementation:
1. **User Approval** > Everything (Highest Priority)
2. **Quality Assurance** > Implementation Speed
3. **Root Solution** > Temporary Fixes
4. **Clarity** > Brevity
5. **Maintainability** > Performance (unless there are clear bottlenecks)

### Escalation Criteria (Always Confirm with User)
In the following cases, always seek user judgment before implementation:
- **Architecture-Level Changes** - Adding new layers, changing responsibilities, data flow changes
- **Adding External Dependencies** - New npm packages, new APIs, new environment variables
- **Breaking Changes** - Existing API changes, data structure changes, major naming changes
- **Unclear Trade-offs** - When superiority between multiple implementation methods cannot be determined
- **Impact Scope of 5+ Files** - Large-scale changes require prior approval

For detailed escalation criteria, refer to @docs/rules/ai-development-guide.md.

### Behavioral Principles as Claude Code
1. **Responsibility as Implementer**: Take full responsibility for code implementation and guarantee quality
2. **Respect for Approver**: Respect users as the final approvers
3. **Ensure Transparency**: Clearly explain implementation content and intent, providing decision-making materials
4. **Appropriate Abstraction**: Follow duplication removal judgment criteria, avoiding excessive abstraction while enhancing maintainability

## Development Rule Files

Development guidelines for this project are managed in rule files within the `docs/rules/` directory. All Claude AI tools must strictly adhere to these rules.

@docs/rules/technical-spec.md
@docs/rules/typescript.md
@docs/rules/typescript-testing.md
@docs/rules/project-context.md
@docs/rules/ai-development-guide.md
@docs/rules/architecture-decision-process.md
@docs/rules/canonical-phrases.md

**Note**: The canonical-phrases.md file defines standardized terminology, specific criteria for ambiguous terms, and clear decision trees to maximize AI execution accuracy.

## 【Absolute Compliance】Initial Mandatory Tasks

> ⚠️ **Warning**: The following are the most critical rules that must be absolutely followed

### Procedures When Receiving Tasks

1. **Stop Implementation**: Always stop before code modification
2. **Load Rule Files**: Read all 7 rule files
3. **Check Related Documents**: Review ADR/Design Doc/work plans
4. **Plan Development**: Present implementation plan
5. **User Approval**: Start implementation after approval

**Important**: Implementation without document review is absolutely prohibited

### Temporary File Management
- Create work-in-progress files in `tmp/` directory
- Delete upon work completion
- Place only items requiring persistence in appropriate locations

## Task Management Principles

### Basic Policy
- **Each Task Completely Self-Contained**: Complete in a quality-assured, functional state
- **Ensure Independence**: Decompose into units without interdependencies
- **Commit-Ready Granularity**: 1 task = 1 logical change unit

### Detailed Procedures
For task decomposition criteria, execution flow, and quality assurance, refer to @docs/rules/ai-development-guide.md.

### Escalation Criteria
For details, refer to the "Escalation Criteria" section in @docs/rules/ai-development-guide.md.

### Pre-Implementation Verification Process

**Mandatory Verification Items**:
1. Related document review (ADR/Design Doc/work plans)
2. Understanding existing code and tests
3. Grasping impact scope

**Efficient Verification Procedures**:
- Design/Planning phase: Review only related ADRs
- Implementation phase: Review only related Design Docs
- Work start: Review ongoing work plans

**Design Approval Flow**: Document creation → Review → Approval → Implementation start

**Important**: Starting implementation without document review is a serious rule violation

## Basic Principles of Development Process

### Pre-Implementation Planning and Agreement
For planning based on change scale, refer to "PRD/ADR/Design Doc/work plan Creation Process" in @docs/rules/technical-spec.md.

**Basic Flow**: Present plan → User approval → Start implementation

### Test-First Development
For details, refer to "Red-Green-Refactor Process" in @docs/rules/typescript-testing.md.

**Basic Principle**: Start with tests for new features and bug fixes

### Root Cause Analysis
For details, refer to @docs/rules/ai-development-guide.md.

## work plan Operations

For detailed work plan creation criteria, naming conventions, operational flows, refer to "About work plans" in @docs/rules/technical-spec.md.

## Code Quality Checks (Mandatory)

### Basic Principles
- **Zero Error Principle**: Leave no warnings or errors
- **Completion Condition**: All checks must pass without errors

For quality check details, refer to "Quality Checks (Mandatory at Implementation Completion)" in @docs/rules/ai-development-guide.md.

**Important**: Work is not considered complete unless all checks pass without errors.