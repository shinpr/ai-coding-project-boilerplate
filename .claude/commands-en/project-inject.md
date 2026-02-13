---
description: Inject project-specific context into project-context skill
---

**Command Context**: Collect project-specific prerequisites that improve AI execution accuracy and update project-context SKILL.md.

## Why This Matters

CLAUDE.md's Session Initialization reads `project-context` skill at the start of every session. The information collected here directly affects AI decision-making accuracy across all tasks.

**Collect only what improves AI execution accuracy.**

## Execution Process

Register the following steps in TodoWrite and proceed systematically.

### Step 1: Understand Current State

Read the current project-context skill and package.json:
- `.claude/skills/project-context/SKILL.md`
- `package.json` (name, description)

If project-context is already configured (no "Not configured" marker), confirm with user whether to overwrite or update.

### Step 2: Collect Project Context

Use AskUserQuestion to collect information in stages.

**Round 1: Project essence**
- What does this project do? (1-2 sentences)
- What domain does it belong to? (e.g., fintech, healthcare, developer tools, e-commerce)

**Round 2: Domain constraints** (based on Round 1 answers)
- Are there domain-specific rules that AI must follow? Adapt examples to the domain from Round 1 (e.g., for fintech: "all mutations require audit logs"; for healthcare: "log output uses anonymized patient IDs").
- Maximum 3 constraints. Only include what would cause bugs or compliance issues if AI ignores them.

**Round 3: Development context**
- Development phase: Prototype / Production / In operation
- Are there directory conventions or file placement rules AI should follow? (skip if none)

### Step 3: Generate and Write

From collected information, generate project-context SKILL.md following these principles:

**Writing principles:**
1. AI-decidable: Use only measurable and verifiable criteria ("fast" → "within 5 seconds")
2. Eliminate ambiguity: Include specific numbers, conditions, examples
3. Positive form: "do this" rather than "don't do that"
4. Minimal: Only what affects AI execution accuracy

**Output targets** (update both):
1. `.claude/skills/project-context/SKILL.md` (active, read by Claude)
2. Corresponding `skills-{lang}/project-context/SKILL.md` (check `.claudelang` for current language)

**Structure:**
```markdown
---
name: project-context
description: Provides project-specific prerequisites for AI execution accuracy. Use when checking project structure.
---

# Project Context

## Project Overview
- **What this project does**: [concise description]
- **Domain**: [domain]

## Domain Constraints
1. [Measurable constraint that affects AI decisions]
2. [Verifiable requirement]

## Development Phase
- **Phase**: [current phase]

## Directory Conventions
[File placement rules, or "No specific conventions" if none]
```

### Step 4: Verification

- [ ] Generated file contains no boilerplate placeholder text ("to be configured", etc.)
- [ ] All domain constraints are measurable/verifiable (no vague statements)
- [ ] No technology stack information included (that belongs in technical-spec skill)
- [ ] No implementation principles included (that belongs in coding-standards skill)
- [ ] Both output targets updated
- [ ] Present result to user for confirmation
