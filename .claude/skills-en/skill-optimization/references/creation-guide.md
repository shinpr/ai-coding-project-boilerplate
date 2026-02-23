# Skill Creation Guide

Guide for generating new skill content from raw user knowledge.

## Creation Flow

### Step 1: Analysis

**Input**: Raw user knowledge (rules, patterns, examples, criteria)

**Process**:
1. Classify content: definitions, patterns, processes, criteria, examples
2. Detect issues using BP patterns (BP-001 through BP-008)
3. Estimate size: small (<80 lines), medium (80-250), large (250+)
4. Identify cross-references to existing skills

**Output**: Content classification + issue list.

### Step 2: Generate Optimized Content

**Input**: Classified content + issue list

**Process**:
1. Apply transforms in priority order: P1 → P2 → P3
2. Structure content following standard section order:
   - Context/Prerequisites
   - Core concepts (definitions, patterns)
   - Process/Methodology (step-by-step)
   - Output format/Examples
   - Quality checklist
   - References
3. **Balance checks**:
   - Over-optimization: Content exceeds scope of user's input → trim
   - Clarity trade-off: Structure obscures main point → simplify
4. Verify 9 principles pass

**Output**: Optimized SKILL.md content.

## Description Guidelines

For skill frontmatter `description` field:

| Rule | Example |
|------|---------|
| Third-person, verb-first | "Evaluates code quality..." not "This skill evaluates..." |
| Include "Use when:" trigger | "Use when creating tests or reviewing test quality." |
| Target ~200 characters | Shorter descriptions reduce context pressure across all loaded skills |
| Specific over generic | "Applies 8 content patterns" not "Improves quality" |
| No implementation details | Describe what it does, not how |

**Template**: `{Verb}s {what} against {criteria}. Use when {trigger scenarios}.`

## Split Decision

If generated content exceeds 400 lines:
- Extract reference data (large tables, example collections) to `references/`
- Keep SKILL.md under 250 lines with references to extracted files
- All reference files one level deep from SKILL.md
