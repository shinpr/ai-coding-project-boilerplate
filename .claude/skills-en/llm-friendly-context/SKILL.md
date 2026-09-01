---
name: llm-friendly-context
description: Clarifies inputs, outputs, success criteria, decisions, and unresolved conditions so downstream agents can execute without guessing. Use when writing or revising LLM-facing prompts, handoffs, planning artifacts, reviews, reports, or generated instructions.
---

# LLM-Friendly Context

The goal is stable downstream execution: the next agent should know what to read, what to do, what counts as success, and which unresolved decisions can change the result.

This skill governs the clarity of LLM-facing output — prompts, handoffs, and generated artifacts. The caller supplies the artifact type and any artifact-specific template or input contract; include only the information its consumer uses to decide, act, or verify. Use a declared contract's field names and value meanings when the consumer branches on them.

## Core Rules

1. **Use positive, executable instructions**
   - State what the next agent should do
   - Convert quality policies into positive criteria
   - Example: "Preserve existing public API behavior across the documented compatibility cases."
   - Keep a prohibition only when it protects an irreversible boundary or a shipped contract; then name the protected condition and the allowed action alongside it

2. **Make vague instructions concrete**
   - Replace subjective terms with observable conditions, paths, commands, schemas, examples, or decision rules
   - Terms that often need clarification when they leave a decision to the next agent: `appropriate`, `proper`, `related`, `existing behavior`, `optional`, `as needed`, `if needed`, `per convention`, unresolved alternatives, `TBD`, `placeholder`

3. **Specify output shape**
   - Define the sections, fields, table columns, JSON keys, or checklist items the consumer uses
   - For handoffs, include produced artifact paths and status fields only when they control the next transition

4. **Provide necessary context**
   - Include the purpose, source artifacts, hard constraints, accepted decisions, and unresolved conditions
   - Prefer concrete file paths and section hints over broad module names
   - Follow references while they can change an in-scope decision, action, or verification result; stop when the next link only confirms what is already decided

5. **Decompose complex work into verifiable steps**
   - Split work with 3+ objectives or sequential dependencies into ordered steps
   - Each step needs a checkpoint: what evidence proves it is complete

6. **Permit uncertainty explicitly**
   - Resolve missing operational detail from governing artifacts and representative repository evidence before treating it as unresolved
   - Record remaining uncertainty with its effect on the outcome or proof. Make reversible repository-local choices inside the confirmed boundary and preserve the evidence used
   - Route an unknown that blocks the next step as an exact evidence prerequisite. Ask the user only when confirmed outcome, desired-future requirements, and non-goals cannot all remain true without a user choice, or when an irreversible external action requires authorization. When only proof is unavailable, complete unaffected work and report exactly what could not be verified and why

7. **Keep constraints proportionate**
   - Add only constraints that reduce ambiguity or preserve a real requirement
   - Keep simple downstream tasks lightweight when the target action, context, and success criteria are already clear
   - Treat a stated size expectation — `minimal`, `a few lines`, an explicit line or file estimate — as one budget over the whole completed diff, not per file or per step. When the work cannot fit it, report the overrun and the reason instead of silently exceeding it

## Rewrite Patterns

Use these rewrites before treating a prompt, handoff, or artifact as complete.

| Ambiguous form | Rewrite as |
|---|---|
| `optional` used as an unresolved choice | Required, omitted, or required only under a named condition |
| Multiple alternatives that the next agent must choose between | The selected option, or a deterministic decision rule |
| `as needed` / `if needed` | The triggering condition and required action |
| `per convention` | The file, function, test, or documented convention to follow |
| `related files` | Specific paths, globs, or search hints |
| `existing behavior` | The observable behavior, source file, test, API response, or UI state to preserve |
| `placeholder` | Exact temporary value/behavior, allowed dependencies, and verification expectation |
| `TBD` used as a placeholder for required information | The decision it can change and the exact evidence prerequisite; omit it when the item has no downstream effect |
| `appropriate` / `proper` | A measurable criterion or checklist |

## Handoff Checklist

Before sending a prompt or artifact to another agent, verify:

- [ ] The target action is explicit
- [ ] Required input paths, source artifacts, and decision-relevant facts are named
- [ ] Accepted decisions and constraints are stated once, without alternate wording
- [ ] Output format or expected status fields are specified
- [ ] Success criteria are observable
- [ ] Ambiguous expressions have been rewritten or marked as unresolved
- [ ] Any stated size expectation is expressed as one budget over the completed diff, with the overrun-reporting condition named
- [ ] The next agent can complete its scope from the supplied purpose, sources, criteria, and evidence, or return one exact evidence prerequisite or authoritative workflow stop

## Generated Artifact Checklist

Before writing or finalizing a generated document:

- [ ] Each requirement, claim, task, test skeleton, or review finding has enough source context to trace why it exists
- [ ] Every executable instruction names the target, action, and expected result
- [ ] Verification steps say what to run or observe and what result proves success
- [ ] If an artifact is derived from another artifact, copied decisions stay consistent in wording and meaning
- [ ] Any stated size expectation is expressed as one budget over the completed artifact, with the overrun-reporting condition named
- [ ] Missing information records the decision or proof it affects; only a confirmed value-boundary choice or irreversible external action authorization is a blocking escalation
