# Canonical Phrases for Documentation Consistency

This document defines standardized terminology and phrases to ensure consistency across all project documentation. These standards maximize AI execution accuracy by eliminating ambiguity.

## Standardized Terminology

### Core Terms

| Concept | Canonical Form | NOT These Variants |
|---------|---------------|-------------------|
| Work plan | work plan | Work Plan, work plans, workplan |
| Subagent | subagent | sub-agent, sub agent |
| Quality check | quality check | quality assurance, QA |
| Edit/Write/MultiEdit | Edit/Write/MultiEdit | edit/write tools, modification tools |
| User approval | user approval | user confirmation, user consent |
| Implementation | implementation | coding, development |
| Investigation | investigation | analysis, exploration |

### Tool Names (Always Capitalized)
- Read, Grep, LS, Glob, Task, Bash
- Edit, Write, MultiEdit
- TodoWrite, WebSearch, WebFetch

## Replacing Ambiguous Terms

### Conditional Triggers - ALWAYS Use Specific Criteria

| ❌ Ambiguous | ✅ Specific |
|-------------|------------|
| "as needed" | "when [specific condition]" |
| "appropriately" | "according to [specific rule/criterion]" |
| "when necessary" | "when [measurable threshold] is met" |
| "fix appropriately" | "fix using the solution identified in the error message" |
| "handle accordingly" | "handle by [specific action]" |
| "update as required" | "update when [specific condition occurs]" |
| "verify properly" | "verify that [specific criteria] are met" |

### Specific Threshold Definitions

**File Count Thresholds:**
- Small-scale: 1-2 files
- Medium-scale: 3-5 files  
- Large-scale: 6+ files

**Duplication Thresholds:**
- First occurrence: Implement inline
- Second occurrence: Consider future consolidation
- Third occurrence: Consolidate according to Rule of Three

**Test Coverage Thresholds:**
- Minimum required: 70%
- Target coverage: 80%+
- Critical paths: 90%+

## Pronoun Reference Clarifications

### Always Specify Antecedents

| ❌ Ambiguous | ✅ Clear |
|------------|----------|
| "This is executed" | "The document-reviewer agent is executed" |
| "These are required" | "The seven rule files are required" |
| "It should be completed" | "The quality check should be completed" |
| "This agent handles that" | "The task-executor agent handles the implementation" |

## Conditional Statement Triggers

### User Approval Requirements

**Explicit Approval Required:**
- Before using Edit/Write/MultiEdit tools
- Before implementing changes affecting 5+ files
- Before adding external dependencies
- Before making breaking changes

**Approval NOT Required:**
- Investigation using Read/Grep/LS/Glob/Task tools
- Creating work plans or documentation
- Running quality checks
- Reading error messages

### Exception Conditions

**Immediate Implementation Allowed When:**
- User explicitly states: "fix it right away"
- User explicitly states: "implement directly"
- User explicitly states: "no approval needed"
- Emergency production fixes (with post-implementation documentation)

## Status Values

### Task Status (Standardized)
- `pending` - Not started
- `in_progress` - Currently working
- `completed` - Finished successfully
- `blocked` - Cannot proceed

### Document Status (Standardized)
- `draft` - Under creation
- `review` - Awaiting review
- `approved` - Ready for use
- `deprecated` - No longer current

### Quality Check Status
- `not_started` - Check not begun
- `running` - Check in progress
- `passed` - Check successful
- `failed` - Check found issues

## Action Phrases

### Investigation Actions
- "Investigate using Read/Grep/LS/Glob tools"
- "Analyze the current implementation"
- "Review existing code structure"

### Implementation Actions
- "Implement after receiving user approval"
- "Apply changes using Edit/Write/MultiEdit"
- "Execute quality checks before marking complete"

### Escalation Actions
- "Request user approval when impacting 5+ files"
- "Escalate to user when trade-offs are unclear"
- "Confirm with user before adding dependencies"

## Repeated Critical Rules (Maintain Exact Phrasing)

These phrases MUST appear identically wherever used:

1. **"Always obtain user approval before using Edit/Write/MultiEdit tools"**
2. **"Implementation without document review is absolutely prohibited"**
3. **"Work is not considered complete unless all quality checks pass without errors"**
4. **"The any type is completely prohibited - use unknown type with type guards"**
5. **"Investigation OK, Implementation STOP"**

## Conditional Logic Standardization

### Clear Decision Trees

**File Scale Decision Tree:**
```
IF file_count = 1-2 THEN "small-scale"
ELSE IF file_count = 3-5 THEN "medium-scale"
ELSE IF file_count >= 6 THEN "large-scale"
```

**Document Requirement Decision Tree:**
```
IF new_feature THEN
  PRD → (IF architecture_change THEN ADR) → Design Doc → work plan
ELSE IF large_scale_change (6+ files) THEN
  ADR → Design Doc → work plan (mandatory)
ELSE IF medium_scale_change (3-5 files) THEN
  (CONSIDER Design Doc) → work plan (recommended)
ELSE IF small_scale_change (1-2 files) THEN
  Direct implementation
```

**Quality Check Decision Tree:**
```
IF all_checks_pass THEN mark_complete
ELSE IF errors_found THEN
  fix_errors → rerun_checks
```

**Consolidation Decision Tree:**
```
IF duplication_count = 1 THEN keep_inline
ELSE IF duplication_count = 2 THEN note_for_future
ELSE IF duplication_count >= 3 THEN consolidate_now
```

## Usage Guidelines

1. **Find/Replace Application**: Use these canonical phrases exactly as written
2. **Context Preservation**: Maintain surrounding context when replacing terms
3. **Redundancy Preservation**: Keep all strategic repetitions of critical rules
4. **Consistency Over Brevity**: Prefer consistent longer phrases over varied shorter ones

This document ensures maximum AI execution accuracy through linguistic precision and consistency.