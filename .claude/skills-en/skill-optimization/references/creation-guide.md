# Skill Creation Guide

Guide for generating new skill content from raw user knowledge.

## Creation Flow

Preserve the supplied knowledge and requirements verbatim before changing structure, wording, context, constraints, or examples. Maintain one phase state through the three gates below.

### Step 1: Analysis

**Input**: Raw user knowledge (rules, patterns, examples, criteria)

**Process**:
1. Classify content: definitions, patterns, processes, criteria, examples
2. Detect issues using BP patterns (BP-001 through BP-009)
3. Estimate size: small (<80 lines), medium (80-250), large (250+)
4. Identify whether the skill owns orchestration/selection. For those roles, record required skill references; for a pure execution skill, identify the execution-critical context that must be materialized locally

**Output evidence**:
- Original requirements and intended outcome
- BP-001 through BP-009 coverage
- Issue list with unique finding ID, severity, location, and quoted evidence
- Preservation requirements and unresolved inputs

**Analysis gate**: Proceed only when all BP patterns are covered, every issue has evidence, preservation requirements are explicit, and no unresolved input prevents faithful generation.

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
4. Verify 10 principles pass

**Output evidence**:
- One applied/skipped resolution per finding
- Trace from every change to a finding or named project source
- Candidate `SKILL.md` content with every preservation requirement represented

**Optimization gate**: Proceed only when every finding is resolved exactly once and the candidate remains self-contained and intent-preserving.

### Step 3: Balance

Evaluate intent preservation, decision sufficiency, information density, constraint necessity, work proportionality, and traceability. Apply only adjustments that resolve a named finding or protect a preservation requirement.

**Output**: Final `SKILL.md` content and any same-directory reference/script content required by its execution flow.

**Balance gate**: Finalize only when every applicable balance check passes. When an unknown blocks a check, stop and name the exact evidence or user decision required.

## Description Guidelines

For skill frontmatter `description` field:

| Rule | Example |
|------|---------|
| Third-person, verb-first | "Evaluates code quality..." not "This skill evaluates..." |
| Include "Use when:" trigger | "Use when creating tests or reviewing test quality." |
| Target ~200 characters | Shorter descriptions reduce context pressure across all loaded skills |
| Specific over generic | "Applies 9 content patterns" not "Improves quality" |
| No implementation details | Describe what it does, not how |

**Core principle**: The description is the agent's **trigger mechanism**, not a summary for humans. Agents only consult skills for tasks requiring knowledge beyond their baseline capabilities. The description must convey why this skill adds value the agent lacks.

**Template**: `{Verb}s {what} using {project-specific criteria/patterns}. Use when {user phrases that trigger this skill}.`

**Description quality checklist**:
- [ ] Contains project-specific terms, class names, or patterns (differentiates from general LLM knowledge)
- [ ] Uses phrases users actually say (e.g., "add tests", "review error handling")
- [ ] Focuses on user intent (not skill internal mechanics)
- [ ] Skills consisting only of general knowledge may be unnecessary — verify project-specific content is present
- [ ] A pure skill remains executable when loaded alone; independently loaded sibling skills are not prerequisites

## Compression and Split

Before splitting:

1. Remove baseline knowledge, duplication, and corrective rules not tied to an observed recurring failure or required boundary.
2. Replace exhaustive branches with purpose, evidence, and selection criteria.
3. Remove examples without a non-obvious mapping or exception.
4. Move repeatable deterministic operations to scripts.
5. Retain conditional detail only when its load condition and decision effect are explicit.

If content still exceeds 400 lines, extract the remaining conditional detail to one-level-deep `references/`. A body above the 250-line target is valid only when removing a retained section would change a non-baseline decision, required boundary, consumer contract, or observed recurring failure. Keep every execution-critical rule in `SKILL.md`, or make loading its same-directory reference an explicit gated step; each pure skill remains executable without a sibling pure skill being loaded.
