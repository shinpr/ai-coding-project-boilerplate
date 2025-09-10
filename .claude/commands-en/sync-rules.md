---
description: Synchronize rule metadata and optimize rule-advisor precision after rule edits
---

**Command Context**: Post-editing maintenance workflow for rule files

**Think deeply** Maximize rule-advisor execution precision through systematic synchronization:

## Execution Flow

### 1. Scan Rule Files
```bash
# Runtime rules directory
RULES_DIR="docs/rules"
INDEX_FILE="${RULES_DIR}/rules-index.yaml"

# Analyze all rule files
find "${RULES_DIR}" -name "*.md" -type f | sort
```

### 2. Synchronize and Optimize Metadata

#### Automatic Section Synchronization
- Extract `## ` sections from each file
- Update sections in rules-index.yaml automatically

#### Tag Optimization
- Analyze file content for relevant keywords
- Propose addition of missing tags
- Suggest removal of obsolete tags

#### Typical-Use Enhancement
- Infer usage scenarios from file changes
- Propose more specific and actionable descriptions

#### Key-References Completion
- Detect newly introduced concepts or methodologies
- Suggest relevant reference additions

### 3. Rule-Advisor Precision Optimization

Enhance metadata quality to enable accurate rule selection by rule-advisor:

```
=== Rule Metadata Synchronization ===
Target: docs/rules

Updates executed:
✅ Sections synchronized
  - typescript-testing.md: 2 sections added
  - ai-development-guide.md: 1 section updated

✅ Tags optimized
  - typescript.md: Suggest adding [functional-programming]
  - technical-spec.md: Suggest removing [deprecated]

✅ Typical-use improved
  - 3 files updated with more specific descriptions

Final result: Rule-advisor precision optimization complete
```

## 🧠 Metacognitive Points

**Essential Purpose**:
- Not mere consistency maintenance, but rule-advisor selection accuracy enhancement
- Metadata optimization as the final step of rule editing workflow

**Quality Criteria**:
- Sections must achieve 100% synchronization
- Tags must accurately reflect content
- Typical-use must specify concrete usage scenarios
- Key-references must cover current methodologies

## Change Necessity Evaluation

**EVALUATION SEQUENCE**:
- IF sections achieve 100% synchronization → OUTPUT "Synchronization verified. No updates required." THEN TERMINATE
- IF content-to-tag mapping shows zero mismatches → DETERMINE no_changes_needed = true THEN TERMINATE  
- IF AND ONLY IF measurable improvements exist → GENERATE specific modification proposals WITH exact before/after values

**NOTE**: You MUST NOT force changes. When no improvements are detected, you SHALL report "No modifications necessary" and STOP execution.

## Execution Timing

- After rule file edits (mandatory)
- When adding new rule files
- After major rule revisions
- When rule-advisor selection accuracy appears degraded

## Example Output

```
=== Rule Metadata Synchronization Started ===
Target: docs/rules (9 files)

[1/9] typescript.md
  ✅ sections: 7 synchronized
  💡 tags proposed: +[functional-programming, dependency-injection]
  💡 typical-use: "General TypeScript implementation" → "Type-safe implementation with modern TypeScript features"

[2/9] typescript-testing.md
  ✅ sections: 2 added (Test Granularity Principles, Mock Type Safety Enforcement)
  ✅ tags: No changes needed
  ✅ typical-use: Maintained

...

=== Synchronization Complete ===
Updated: 3 files
Proposals: 5 items (approval required)

Rule-advisor precision improvement: Estimated 15% enhancement
```

**Scope**: Post-edit rule metadata synchronization and rule-advisor precision optimization.