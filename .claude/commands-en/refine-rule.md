---
description: Optimize rule changes for maximum AI execution accuracy
---

Change request: $ARGUMENTS

**THINK DEEPLY AND SYSTEMATICALLY** Extract the TRUE INTENT behind user's change request and implement with MAXIMUM PRECISION to eliminate ALL ambiguity:

## 9 Optimization Perspectives
1. Context efficiency vs execution accuracy - Maximum accuracy with minimal description
2. Deduplication - Consistency within and across rule files
3. Proper responsibility aggregation - Group related content (minimize read operations)
4. Clear decision criteria - Measurable standards
5. Transform negatives to recommendations - Recommended format (background: including NG examples)
6. Consistent notation - Unified expressions
7. Explicit prerequisites - Make implicit assumptions visible
8. Optimized description order - Most important first, exceptions last
9. Clear scope boundaries - What's covered vs what's not

## Execution Flow

### 1. Understand the Request

Question template when unspecified:
```
1. Which rule file to modify?
   e.g.: typescript.md / ai-development-guide.md / documentation-criteria.md

2. Select change type:
   a) Add new rule (add new criteria)
   b) Modify existing rule (clarify ambiguous descriptions)  
   c) Delete rule (remove obsolete criteria)

3. Specific changes:
   e.g.: "Add rule prohibiting 'any' type usage"
   e.g.: "Clarify error handling criteria"
   [User input]
```

### 2. Create Design Proposal

Target file identification and current state check:

```
# Tool selection criteria (measurable decisions)
if file path is explicitly provided:
  Read: Direct file read (background: Skip Glob to save context)
else if partial filename known:
  Glob: docs/rules/*{keyword}*.md search
  Read: Check identified file's current state
else:
  Glob: docs/rules/*.md for full scan (background: comprehensive search when unclear)
  Confirm target file selection with user
```

Design template:
```
【Current】
"Handle errors appropriately" (ambiguous: "appropriately" undefined)

【Understanding User Request】
"Want stricter error handling" → Set measurable criteria

【Proposal】
"Error handling implementation criteria:
1. try-catch required for:
   - External API calls (fetch, axios, etc.)
   - File I/O operations (fs.readFile, etc.)
   - Parsing operations (JSON.parse, parseInt, etc.)
2. Required error log items:
   - error.name (error type)
   - error.stack (location)
   - Timestamp (ISO 8601 format)
3. User notification criteria:
   - No technical details (NG: stack trace display)
   - Clear action items (recommended: "Please try again")"

Proceed with this design? (y/n)
```

### 3. Three-Pass Review Process

#### Pass 1: Add for Maximum Accuracy【Addition-Only Mode】
**MANDATORY DECLARATION**: "Pass 1: Addition mode execution. Deletions are STRICTLY PROHIBITED."
**REQUIRED ACTIONS**:
- CONVERT all ambiguous expressions → measurable criteria
  Example: "large" → "100+ lines" "5+ files"
- MAKE all implicit prerequisites explicit
  Example: "In TypeScript environment" "Within async functions"
- DEFINE all exceptions and edge cases
  Example: "When null/undefined" "For empty arrays"
**MANDATORY REPORT**: Count added items (MINIMUM 5 items required)

#### Pass 2: Critical Modification to Reduce Redundancy【Actual Modification Mode】
**MANDATORY DECLARATION**: "Pass 2: Critical modification mode execution. ACTUALLY DELETE and CONSOLIDATE redundant parts."

**REQUIRED MODIFICATION WORK**:
1. CRITICALLY REVIEW all Pass 1 additions
2. APPLY modifications using these EXACT criteria:
   - Duplicate concepts → MUST consolidate
   - Overly detailed explanations → MUST simplify
   - Overlap with other rules → MUST replace with references
3. RECORD complete before/after diff (deletion reasons REQUIRED)

Report format:
```
Modified locations: X items
Deleted/consolidated content:
- [Before]: "Detailed description"
  [After]: "Concise description"
  [Reason]: Redundancy elimination
```

#### Pass 3: Accuracy Assurance via Diff Evaluation【Restoration Decision Mode】
**MANDATORY DECLARATION**: "Pass 3: Diff evaluation mode execution. REVIEW all Pass 2 modifications and RESTORE if accuracy compromised."

**REQUIRED VERIFICATION WORK**:
1. EVALUATE EACH Pass 2 modification against these criteria:
   - Does deletion create implementation ambiguity? YES = RESTORE
   - Are ALL edge cases still covered? NO = RESTORE
2. Action mapping:
   - Deletions with accuracy risks → MUST restore
   - Valid deletions → KEEP

**MANDATORY FINAL CONFIRMATION** (MUST answer explicitly):
"Are necessary and sufficient conditions present for accurate implementation of user requirements? YES/NO with justification"

**MANDATORY REPORT**: Number of restored items AND final reduction percentage

### 4. Get Approval

Present before/after comparison for user approval.

### 5. Implementation

1. Apply changes with appropriate tool (after user approval)
2. Final verification with git diff
3. Suggest `/sync-rules` execution

## Decision Criteria Checklist
- [ ] Expressible in "if-then" format ("if X then Y")
- [ ] Measurable by numbers/counts/states (eliminate subjective judgment)
- [ ] Related content aggregated in single file (minimize read operations)
- [ ] Relationships with other rules specified (dependencies/references/delegation)
- [ ] NG examples included as background information
- [ ] All prerequisites explicitly stated

## Reduction Pattern Examples
| Pattern | Before | After |
|---------|--------|-------|
| Emotional expressions | "must always" | "execute when (background: build error if skipped)" |
| Time expressions | "immediately" | "execute first after error detection" |
| Implicit prerequisites | "implement error handling" | "TypeScript async function error handling" |
| Unclear order | "consider: A, B, C" | "Priority: 1.A (required), 2.B (recommended), 3.C (optional)" |
| Redundant explanation | "ensure type safety by defining types, checking types, and preventing type errors" | "type safety (define・check・prevent errors)" |
| Ambiguous scope | "write tests" | "write unit tests (see test-guide for E2E tests)" |

## Output Example

```
=== Change Implementation Complete ===

【User Request】
"Strengthen TypeScript error handling rules"

【Changes】
Target: docs/rules/typescript.md
Section: ## Error Handling

Before: 
"Handle errors appropriately"

After (3-pass review complete):
"Error handling implementation criteria:
1. try-catch block required for:
   - External API calls (fetch, axios, etc.)
   - File I/O operations (fs.readFile, fs.writeFile, etc.)
   - Exception-prone operations (JSON.parse, parseInt, etc.)
2. Required error log items:
   - error.name (error type)
   - error.stack (location)
   - new Date().toISOString() (timestamp)
3. User-facing messages:
   - No technical details (NG: stack trace display)
   - Clear action items (recommended: "Please try again")"

【Improvement Metrics】
- Decision clarity: 0% → 100% (all measurable)
- Ambiguous expressions: 1 → 0
- NG examples included as background

Run /sync-rules for metadata synchronization.
```

## Execution Order
1. Understand user request
2. Analyze current state
3. Design changes with 9 perspectives
4. 3-pass review process
5. User approval
6. Apply changes
7. Suggest sync-rules

**Scope**: Understanding user change requests and implementing with maximum accuracy

## Error Handling
- **File not found**: Display available rule list
- **Large change detected**: Suggest phased implementation for 50%+ changes