---
name: skill-optimization
description: Evaluates and optimizes skill file quality using 8 content patterns and 9 editing principles. Use when creating skills, refining skill content, or auditing skill quality.
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
| "don't", "do not", "never", "avoid" in skill instructions | Reframe as positive directive with equivalent constraint. **Exception**: Negative form is permitted only when ALL 4 conditions are met: (1) violation destroys state in a single step, (2) caller or subsequent steps cannot normally recover, (3) the constraint is operational/procedural, not a quality policy or role boundary, (4) positive rewording would expand or blur the target scope. If any condition is not met, rewrite in positive form. |

**Exception boundary examples**:
- Permitted: "Do not modify the command", "Do not add flags", "Do not execute destructive operations"
- Rewrite in positive form: "Do not invent issues" → "Base every issue on BP patterns or 9 principles", "Do not skip P1 issues" → "Evaluate all P1 issues in every review mode", "Do not give grade A when P1 exists" → "Assign grade A only when P1 count is zero"

Quality policies, role boundaries, scoring criteria, and general work rules always use positive form. Outputs that the caller validates, overwrites, or discards are never irreversible.

**Skill example:**
- Before: "Don't use generic variable names"
- After: "Use descriptive variable names that reflect purpose (e.g., `userId` not `x`)"

**Why critical for skills**: LLM attention mechanisms focus on negated content. Skill instructions with "don't" increase probability of the forbidden behavior.

#### BP-002: Vague Instructions → Specific Criteria

| Detection | Transform |
|-----------|-----------|
| Vague term ("appropriate", "good", "proper", "best", "should be clear") that leaves a decision the intended outcome requires, where plausible interpretations would materially change execution or verification | Resolve it with the **least-restrictive sufficient criterion**, following the resolution steps below |
| Unspecified format, length, scope, tone, or success criteria whose plausible interpretations satisfy the intended outcome equally well | Treat as acceptable flexibility; add a constraint only when one interpretation is required (for a format a downstream consumer requires, see BP-003) |

**Resolution steps** (first-row findings):
1. Choose the least-restrictive sufficient criterion — the measurable if-then rule or threshold that supplies the required precision while excluding the fewest valid behaviors.
2. Record its **precision contribution**: the observable output difference it improves for the intended outcome.
3. Record its **constraint cost**: the valid solutions allowed by the original intent that it excludes.
4. Apply it only when the precision contribution is identifiable and the constraint cost preserves the original intent.
5. When input or project context cannot determine the decision, record the required source instead of guessing.

**Skill exception**: Expressions that the LLM can resolve unambiguously from input context (e.g., "where the user left gaps" when the user's prompt is available for comparison) are not vague — they describe a deterministic operation, not a subjective judgment.

**Skill example:**
- Before: "Handle errors appropriately"
- After (criteria derived from a named source): "Follow the project error-handling policy (docs/error-handling.md): wrap external API calls, file I/O, and JSON.parse in try-catch; log error.name, error.stack, and timestamp; re-throw with context when the caller must handle it."
- After (no source available): "Record 'error-handling policy' as the required source instead of inventing try-catch targets, log fields, or thresholds."

**Why critical for skills**: Accounts for ~40% of execution variance. Every vague instruction forces LLM to guess.

#### BP-003: Missing Output Format → Structured Output

| Detection | Transform |
|-----------|-----------|
| Skill describes what to do but not the expected deliverable format | Add an output section defining the structure, fields, and ordering required by the output consumer (parsing, routing, comparison, verification), rather than selecting a format by convention |

**Skill example:**
- Before: "Analyze the code for issues"
- After (format required by the review-report consumer): "Emit `## Issues Found` as a table the report renderer parses: | Severity | Location | Description | Suggested Fix |"

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

#### BP-005: Missing or Excess Context → Necessary and Sufficient Context

| Detection | Transform |
|-----------|-----------|
| Skill assumes knowledge not stated | Add Prerequisites section listing required context |
| Domain terms used without definition | Add definitions inline or in a glossary table. **Skill exception**: Terms within the LLM's baseline knowledge (widely-used technical terminology, standard domain vocabulary) require no definition. Only project-specific terms, internal naming conventions, or domain jargon outside common LLM training data need explicit definition. |
| No "when to use" guidance | Add trigger conditions with concrete scenarios |
| Duplicated, distracting, or unactionable context with no downstream effect | Condense repeated facts into one operative statement; keep raw background behind a path or reference when only an extracted fact is needed; name the source for project-specific facts |

**Skill example:**
- Before: "Apply the strangler pattern for migration"
- After: "**Prerequisite**: Existing monolith with identifiable module boundaries. **When to use**: Replacing legacy module while maintaining production traffic."

#### BP-006: Complex Content → Decomposed Steps

| Detection | Transform |
|-----------|-----------|
| 3+ objectives in one instruction | Break into numbered steps; each step names its output evidence and the transition condition that permits the next step |
| Sequential dependencies not explicit | Make each step's transition condition depend on the prior step's output evidence |
| Multiple dependent actions presented as one step | Split so each produces observable completion evidence before the next begins |

**Conditional**: Skip decomposition for simple reference tables or single-criteria rules.

**Key insight**: Goal is externally visible state progression — each step produces evidence that controls whether the next step is valid, not decomposition for its own sake.

### P3: Enhancement (Could Fix)

Incremental improvements for specific contexts.

#### BP-007: Unnecessary or Biased Examples → Minimal Necessary Examples

| Detection | Transform |
|-----------|-----------|
| Examples restate behavior already known to the LLM | Replace with a concise rule or consumer-required output shape, and remove the examples |
| Examples encode a domain-, product-, or organization-specific mapping, non-obvious exception, or boundary a rule cannot express | Keep the smallest set that covers those mappings; map each example to the ambiguity it removes |
| Multiple examples remove the same ambiguity, or all share the same surface pattern | Reduce to the smallest covering set; add a different case only when it removes a distinct ambiguity |

#### BP-008: No Uncertainty Permission → Explicit Escalation

| Detection | Transform |
|-----------|-----------|
| Skill demands definitive answers always | Classify claims as observed, inferred, or unknown; add escalation criteria for ambiguous cases |
| No "when to stop" guidance | When an unknown blocks the next step, stop at that gate and name the exact evidence or user decision required to continue |

**Skill example:**
- Before: "Determine the root cause"
- After: "Determine the root cause. If root cause is uncertain after 3 investigation cycles, report top 3 hypotheses with confidence levels and evidence for each."

## 9 Skill Editing Principles

Measurable quality criteria for skill content. Each principle includes a pass/fail test.

| # | Principle | Pass Criteria | Fail Example |
|---|-----------|---------------|--------------|
| 1 | Context efficiency | Every sentence contributes to LLM decision-making. No filler. | "This is an important skill that helps with..." |
| 2 | Deduplication | No concept explained twice at the same abstraction level within the skill or across skills. Mentions at different structural roles (e.g., classification framework vs execution detail) are not duplicates, provided the re-mention adds new constraints or criteria | Same error handling rules restated at the same abstraction level in multiple related skills |
| 3 | Grouping | Related criteria in single section (minimize read operations) | Scattered error handling rules across 4 sections |
| 4 | Measurability | Criteria name observable evidence, deterministic decision rules, or justified thresholds | "Write clean code" without an observable condition |
| 5 | Positive form | Instructions state what to do (BP-001 applied) | "Don't use any" instead of "Use only X" |
| 6 | Consistent notation | Uniform heading levels, list styles, table formats | Mix of `-`, `*`, `1.` in same context |
| 7 | Explicit prerequisites | Project-specific and non-baseline prerequisites are stated or linked; baseline technical knowledge is left concise | Uses "DI" without defining Dependency Injection |
| 8 | Priority ordering | Most important items first, exceptions last | Edge cases before common patterns |
| 9 | Scope boundaries | Explicit coverage: what this skill addresses vs references to other skills | Overlapping guidance with no cross-reference |

## References

- **Creating skills**: See [references/creation-guide.md](references/creation-guide.md) for generation flow and description guidelines
- **Reviewing skills**: See [references/review-criteria.md](references/review-criteria.md) for evaluation flow and grading
