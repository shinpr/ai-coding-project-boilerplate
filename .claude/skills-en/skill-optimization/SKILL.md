---
name: skill-optimization
description: Evaluates and optimizes skill file quality using 9 content patterns and 10 editing principles. Use when creating skills, refining skill content, or auditing skill quality.
---

# Skill Content Optimization

## Core Philosophy

1. **Finding-Based**: Every change resolves a recorded issue or follows a named project-specific source
2. **Concrete**: Each pattern provides detection criteria and transform methods
3. **Structure-Focused**: Optimizes expression and organization; domain knowledge remains unchanged
4. **Intent-Preserving**: Records the original requirements before changing structure, wording, constraints, context, or examples
5. **Traceable**: Connects every applied change to a finding or named project source
6. **Self-Contained**: Keeps every pure skill executable when loaded alone; duplication across independently loaded pure skills is valid when each copy is required for standalone execution

## Content Optimization Patterns

### P1: Critical (Must Fix)

Issues that directly reduce LLM execution accuracy when consuming the skill.

#### BP-001: Negative Instructions → Positive Form

| Detection | Transform |
|-----------|-----------|
| "don't", "do not", "never", "avoid" in skill instructions | State the desired action or allowed state first. Preserve an explicit prohibition only when the violation is an irreversible operational action, the caller cannot normally recover it, and a positive-only rewrite would blur the boundary. Pair the prohibition with the safe alternative and the condition that authorizes crossing the boundary. Rewrite reviewable quality policies in positive form. |

**Exception boundary examples**:
- Permitted: "Move obsolete records to the recoverable archive. Do not permanently delete them unless the user explicitly authorizes permanent deletion."
- Rewrite in positive form: "Do not invent issues" → "Base every issue on BP patterns or 10 principles", "Do not skip P1 issues" → "Evaluate all P1 issues in every review mode", "Do not give grade A when P1 exists" → "Assign grade A only when P1 count is zero"

Quality policies, role boundaries, scoring criteria, and general work rules always use positive form. Outputs that the caller validates, overwrites, or discards are never irreversible.

**Skill example:**
- Before: "Don't use generic variable names"
- After: "Use descriptive variable names that reflect purpose (e.g., `userId` not `x`)"

**Why critical for skills**: A prohibition alone leaves the executable target state unspecified.

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

**Why critical for skills**: A vague instruction forces the model to choose an outcome-relevant behavior without a supplied criterion.

#### BP-003: Missing Output Format → Structured Output

| Detection | Transform |
|-----------|-----------|
| Skill describes what to do but not the expected deliverable format | Add an output section defining the structure, fields, and ordering required by the output consumer (parsing, routing, comparison, verification), rather than selecting a format by convention |

For a skill review, the output contract contains BP-001 through BP-009 coverage, stable finding IDs, severity, location, quoted evidence, accepted declines, preservation requirements, unresolved inputs, and the final grade. For skill creation, the output is the complete `SKILL.md` content plus any required same-directory references or scripts.

**Skill example:**
- Before: "Analyze the code for issues"
- After (format required by the review-report consumer): "Emit `## Issues Found` as a table the report renderer parses: | Severity | Location | Description | Suggested Fix |"

**Why critical for skills**: Structured output constraints reduce hallucination and make skill results consistent.

#### BP-009: Unbounded Work Generation → Proportionate Work

| Detection | Transform |
|-----------|-----------|
| A finding, possibility, or technically valid improvement becomes mandatory without changing the outcome, a required boundary, a real consumer, or necessary proof | Treat it as a candidate; retain required work and allow no-change, reuse, and evidence-backed decline |
| Research breadth determines implementation or artifact scope | Stop when the required outcome is observable; discovery alone does not expand the work |

**Why critical for skills**: Capable models execute implied obligations, so unsupported possibilities can manufacture work without improving the result.

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

#### BP-006: Missing or Excess Procedural Control → Evidence-Guided Gates

| Detection | Transform |
|-----------|-----------|
| A later action would be invalid without prerequisite evidence | Add a gate naming the required evidence and transition condition |
| Authority, irreversible action, machine-consumed contract, or completion proof is implicit | Make that boundary explicit |
| A reversible choice is prescribed as a mandatory route | State the purpose, evidence, and selection criteria; let the model choose the route |
| A gate requires a specific label or artifact despite semantically equivalent evidence | Accept the equivalent evidence unless a machine consumer requires the exact form |

**Key insight**: Control the boundary and required evidence, not a predicted path between them.

For skill creation, use three gates in order:
1. **Analysis gate**: Original requirements are recorded, BP-001 through BP-009 are covered, every issue has evidence, and no unresolved input blocks faithful work.
2. **Optimization gate**: Every finding has one applied/skipped resolution, each change is traceable, and all preservation requirements remain represented.
3. **Balance gate**: Intent preservation, decision sufficiency, information density, constraint necessity, work proportionality, and traceability pass before the result is final.

For review-driven repair, use the current review as analysis evidence and apply the optimization and balance gates to the accepted repair scope.

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
- After: "Classify the root cause as observed, inferred, or unknown. When missing evidence blocks the next step, stop at the current gate and name the exact evidence or user decision required to continue."

## 10 Skill Editing Principles

Measurable quality criteria for skill content. Each principle includes a pass/fail test.

| # | Principle | Pass Criteria | Fail Example |
|---|-----------|---------------|--------------|
| 1 | Context efficiency | Every sentence supplies non-baseline knowledge, a decision rule, a required boundary, or execution evidence. | Restates baseline behavior without a supplied failure, review finding, or project requirement showing an execution effect |
| 2 | Deduplication | No concept is explained twice at the same abstraction level within one skill. Duplication across independently loaded pure skills is valid when each copy is required for standalone execution; evaluate those copies for semantic consistency rather than replacing them with sibling-skill references | The same rule appears twice in one skill without adding a distinct execution role |
| 3 | Grouping | Related criteria in single section (minimize read operations) | Scattered error handling rules across 4 sections |
| 4 | Measurability | Criteria name observable evidence, deterministic decision rules, or justified thresholds | "Write clean code" without an observable condition |
| 5 | Positive form | Instructions state what to do (BP-001 applied) | "Don't use any" instead of "Use only X" |
| 6 | Consistent notation | Uniform heading levels, list styles, table formats | Mix of `-`, `*`, `1.` in same context |
| 7 | Explicit prerequisites | Project-specific and non-baseline prerequisites are stated or linked; baseline technical knowledge is left concise | Uses "DI" without defining Dependency Injection |
| 8 | Priority ordering | Most important items first, exceptions last | Edge cases before common patterns |
| 9 | Scope boundaries | Explicitly state what the skill covers and the conditions that activate conditional content. A pure skill contains the context required for standalone execution. Cross-skill references are reserved for skills whose role is orchestration or skill selection | A pure skill omits an operative rule because another independently loaded skill also contains it |
| 10 | Work proportionality | Every required artifact, test, gate, or decision changes the outcome, a boundary, a consumer result, or necessary proof | Requires all findings or technically valid improvements to be implemented |

## References

- **Creating skills**: See [references/creation-guide.md](references/creation-guide.md) for generation flow and description guidelines
- **Reviewing skills**: See [references/review-criteria.md](references/review-criteria.md) for evaluation flow and grading
