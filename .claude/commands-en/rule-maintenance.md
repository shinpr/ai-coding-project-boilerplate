---
description: Execute terminology unification and consistency maintenance for rule files
---

# Rule File Consistency Maintenance Command

Ensures terminology unification and consistency for all rule files in docs/rules/.

## Execution Content

Executes the following sequentially to discover and fix inconsistencies:

1. **Terminology Unification Check**: Confirm usage of standardized terms
2. **Threshold and Criteria Consistency Check**: Confirm numerical criteria match across files
3. **Automatic Fix for Inconsistencies**: Automatically fix discovered issues
4. **Fix Report Output**: Report on implemented fixes

## Check Criteria

### Standardized Terminology

| Concept | Standard Form | Prohibited Notations |
|---------|---------------|-------------------|
| Work plan | work plan | Work Plan, workplan, work-plan |
| Subagent | subagent | sub-agent, sub agent, sub_agent |
| Quality check | quality check | quality assurance, QA, quality verification |
| Edit/Write/MultiEdit | Edit/Write/MultiEdit | editing tools, modification tools |
| User approval | user approval | user confirmation, user consent |
| Implementation | implementation | coding, development |
| Research | research | analysis, exploration |

### Important Threshold Unification

**File Count Thresholds**
- Small scale: 1-2 files (direct implementation possible)
- Medium scale: 3-5 files (work plan recommended)
- Large scale: 6+ files (work plan required, ADR consideration)
- Boundary: Always require user approval for 5+ files

**Duplication Thresholds (Rule of Three)**
- 1st occurrence: Implement inline
- 2nd occurrence: Record comment with future consolidation in mind
- 3rd occurrence: Immediately implement commonalization (no exceptions)

**Test Coverage Thresholds**
- Minimum requirement: 70% (commits prohibited below this)
- Target coverage: 80% or higher
- Critical path: 90% or higher
- Coverage measurement: Accurately measure with `npm run test:coverage:fresh`

**Error Response Thresholds**
- 1st occurrence: Record error details and fix
- 2 consecutive: Execute root cause analysis (5 Whys)
- 3+ occurrences: Design review and user escalation

**Code Quality Thresholds**
- File line count: 300 lines (split immediately if exceeded)
- Field count: 20 fields (split by responsibility if exceeded)
- Optional rate: 30% (separate types by required/optional if exceeded)
- Nesting depth: 3 levels (flatten if exceeded)
- Type assertions: Design review if 3+ occurrences

### Required Unified Phrases

These phrases must match exactly across all rule files:

1. **"User approval is mandatory before using any Edit/Write/MultiEdit tools"**
2. **"Starting implementation without document review is absolutely prohibited"**
3. **"Work is not considered complete unless all quality checks pass without errors"**
4. **"any type is completely prohibited - use unknown type and type guards"**
5. **"Research OK, Implementation STOP"**

### Quality Check System Unification

**Phase 1-3: Basic Checks**
- `npm run check` - Biome comprehensive
- `npm run check:unused` - Unused exports
- `npm run build` - TypeScript

**Phase 4-6: Tests and Final Confirmation**
- `npm test` - Test execution
- `npm run test:coverage:fresh` - Coverage confirmation (70%+ required)
- `npm run check:all` - Integrated check

## Fix Policy

### Scope of Automatic Fixes
- Terminology notation unification (e.g., "type-guard" → "type guard")
- Numerical unification (e.g., unify coverage requirement to 70%)
- Exact phrase matching (5 required phrases above)

### Fixes Requiring User Confirmation
- Fixes involving rule content changes
- Inconsistencies with multiple possible interpretations
- Changes related to architecture design

## Execution Flow

1. **Load all rule files**
2. **Research terminology usage**
3. **Extract and compare thresholds/criteria**
4. **List inconsistencies**
5. **Fix automatically fixable items**
6. **Present items requiring user confirmation**
7. **Output fix completion report**

This command maintains consistency and quality of the rule file collection, preserving the foundation for rule-advisor to operate accurately.