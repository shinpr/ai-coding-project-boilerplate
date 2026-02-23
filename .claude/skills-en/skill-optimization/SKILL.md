---
name: skill-optimization
description: Evaluates and optimizes skill file quality against 8 content patterns and 9 editing principles. Use when creating skills, refining skill content, or auditing skill quality.
---

# Skill Content Optimization

## Core Philosophy

1. **Evidence-Based**: Grounded in prompt engineering research, applied to skill authoring
2. **Concrete**: Each pattern provides detection criteria and transform methods
3. **Structure-Focused**: Optimizes expression and organization; domain knowledge remains unchanged

## Content Optimization Patterns

### P1: Critical (Must Fix)

Issues that directly reduce LLM execution accuracy when consuming the skill.

#### BP-001: Negative Instructions → Positive Form

| Detection | Transform |
|-----------|-----------|
| "don't", "do not", "never", "avoid" in skill instructions | Reframe as positive directive with equivalent constraint |

**Skill example:**
- Before: "Don't use generic variable names"
- After: "Use descriptive variable names that reflect purpose (e.g., `userId` not `x`)"

**Why critical for skills**: LLM attention mechanisms focus on negated content. Skill instructions with "don't" increase probability of the forbidden behavior.

#### BP-002: Vague Instructions → Specific Criteria

| Detection | Transform |
|-----------|-----------|
| "appropriate", "good", "proper", "best", "should be clear" | Replace with measurable if-then criteria or concrete thresholds |
| Missing output format, scope, or success criteria | Add explicit constraints |

**Skill example:**
- Before: "Handle errors appropriately"
- After: "Error handling criteria: 1. try-catch for external API calls, file I/O, JSON.parse 2. Log: error.name, error.stack, timestamp 3. Re-throw with context if caller needs to handle"

**Why critical for skills**: Accounts for ~40% of execution variance. Every vague instruction forces LLM to guess.

#### BP-003: Missing Output Format → Structured Output

| Detection | Transform |
|-----------|-----------|
| Skill describes what to do but not the expected deliverable format | Add output section with structure, fields, and example |

**Skill example:**
- Before: "Analyze the code for issues"
- After: "Output format: `## Issues Found` with table: | Severity | Location | Description | Suggested Fix |"

**Why critical for skills**: Structured output constraints reduce hallucination and make skill results consistent.

### P2: High Impact (Should Fix)

Issues that reduce skill effectiveness when addressed.

#### BP-004: Unstructured Content → Organized Format

| Detection | Transform |
|-----------|-----------|
| Wall of text without headings | Apply standard section order (see below) |
| Multiple topics mixed in one section | Split into distinct headed sections |
| No tables for reference data | Convert lists of criteria/patterns to tables |

**Standard skill section order:**
1. Context/Prerequisites
2. Core concepts (definitions, patterns)
3. Process/Methodology (step-by-step)
4. Output format/Examples
5. Quality checklist
6. References

**Conditional**: Skip restructuring if skill is under 30 lines and covers a single topic.

#### BP-005: Missing Context → Explicit Prerequisites

| Detection | Transform |
|-----------|-----------|
| Skill assumes knowledge not stated | Add Prerequisites section listing required context |
| Domain terms used without definition | Add definitions inline or in a glossary table |
| No "when to use" guidance | Add trigger conditions with concrete scenarios |

**Skill example:**
- Before: "Apply the strangler pattern for migration"
- After: "**Prerequisite**: Existing monolith with identifiable module boundaries. **When to use**: Replacing legacy module while maintaining production traffic."

#### BP-006: Complex Content → Decomposed Steps

| Detection | Transform |
|-----------|-----------|
| 3+ objectives in one instruction | Break into numbered steps with checkpoints |
| Sequential dependencies not explicit | Add dependency markers between steps |
| No intermediate verification | Insert checkpoint after each step |

**Conditional**: Skip decomposition for simple reference tables or single-criteria rules.

**Key insight**: Goal is evaluable granularity with quality checkpoints, not decomposition for its own sake.

### P3: Enhancement (Could Fix)

Incremental improvements for specific contexts.

#### BP-007: Biased Examples → Diverse Coverage

| Detection | Transform |
|-----------|-----------|
| All examples share same pattern/structure | Add edge cases and exceptions |
| Only happy-path examples | Add error cases, boundary conditions |
| Examples all same complexity | Include simple, moderate, and complex |

#### BP-008: No Uncertainty Permission → Explicit Escalation

| Detection | Transform |
|-----------|-----------|
| Skill demands definitive answers always | Add escalation criteria for ambiguous cases |
| No "when to stop" guidance | Add explicit stopping conditions |

**Skill example:**
- Before: "Determine the root cause"
- After: "Determine the root cause. If root cause is uncertain after 3 investigation cycles, report top 3 hypotheses with confidence levels and evidence for each."

## 9 Skill Editing Principles

Measurable quality criteria for skill content. Each principle includes a pass/fail test.

| # | Principle | Pass Criteria | Fail Example |
|---|-----------|---------------|--------------|
| 1 | Context efficiency | Every sentence contributes to LLM decision-making. No filler. | "This is an important skill that helps with..." |
| 2 | Deduplication | No concept explained twice within the skill or across skills | Same error handling rules in both coding-standards and typescript-rules |
| 3 | Grouping | Related criteria in single section (minimize read operations) | Scattered error handling rules across 4 sections |
| 4 | Measurability | All criteria use if-then format or concrete thresholds | "Write clean code" without definition of clean |
| 5 | Positive form | Instructions state what to do (BP-001 applied) | "Don't use any" instead of "Use only X" |
| 6 | Consistent notation | Uniform heading levels, list styles, table formats | Mix of `-`, `*`, `1.` in same context |
| 7 | Explicit prerequisites | All assumed knowledge stated | Uses "DI" without defining Dependency Injection |
| 8 | Priority ordering | Most important items first, exceptions last | Edge cases before common patterns |
| 9 | Scope boundaries | Explicit coverage: what this skill addresses vs references to other skills | Overlapping guidance with no cross-reference |

## References

- **Creating skills**: See [references/creation-guide.md](references/creation-guide.md) for generation flow and description guidelines
- **Reviewing skills**: See [references/review-criteria.md](references/review-criteria.md) for evaluation flow and grading
