---
name: requirement-convergence
description: Separates the outcome a change must produce from the requirements proposed to reach it, records what the user excluded, and bands cost from structure. Use when a requirement enters a workflow, before design begins, or when "how far do we go/what's out of scope/is this worth it" is mentioned.
---

# Requirement Convergence

## Purpose

Requirements arrive bloated, ambiguous, or aimed at the wrong outcome. A capable model reconciles all three into a coherent plan and builds it faithfully — delivering exactly what was asked for when what was asked for was wrong.

This skill converges **what to build**. How to build it, and which documents the change requires, are settled after the what is.

## Convergence Fields

| Field | Pass condition |
|-------|----------------|
| `outcome` | One observable result. A requirement that does not serve it is excess. |
| `requirements[]` | Every build-relevant item labeled `current-state` or `desired-future`. |
| `nonGoals[]` | Authored by the user, or the user stated there are none. |
| `cost` | A band with the structural evidence that places it, plus the unknowns that remain. |

`cost` is a rough band, not the effort estimate a work plan schedules against; requirements cannot support person-days. Its unknowns carry more decision weight than its size.

Classify from the user's own retained wording rather than an analyzer's restatement of it. Wording that asks for an evaluation, describes a speculative idea, or suggests a mechanism stays in active convergence context as a judgment-only candidate. `requirements[]` and durable documents receive a candidate only after explicit user confirmation.

Each field carries its own readiness label: `ready`, `weak`, or `weak-but-explicit` (weak, and the user agreed to leave it unresolved). Only the user sets `weak-but-explicit`. Requirements are converged when every applicable field is `ready` or `weak-but-explicit`.

Judgment rules per field: [references/criteria.md](references/criteria.md).

## Hearing Protocol

Use the available scope and cost evidence for both elicitation and judgment, then ask only for product choices that the repository cannot answer. Repeat scope and cost analysis only when an answer changes the analysis target or required scope evidence.

Register these steps before starting and record each step's evidence as it completes:

| Step | Action | Completion evidence |
|------|--------|---------------------|
| 1 | Render the Scope Confirmation below, asking only about the fields below `ready` | Each fact cites the analysis output it came from, and **User decisions** holds one question per field below `ready` |
| 2 | Record each answer as that field's value | The value is the option the user explicitly selected or the wording the user supplied |
| 3 | Re-ask once when a recorded value still fails its pass condition, then mark the field `weak-but-explicit` when the user agrees to leave the second answer as it stands | Two recorded answers, or the user's agreement to stop |
| 4 | Judge each field against its pass condition and finalize the completed record | A convergence record with every field labeled |

## Scope Confirmation

Render this shape at every requirements confirmation stop, whether or not the hearing runs, including only what can change the user's requirement decision.

| Section | Contents |
|---------|----------|
| **Confirmed scope** | The requirements and exclusions the user has already stated or explicitly selected, in the user's wording or the selected option |
| **Decision evidence** | Each material item marked as observed, inferred, or proposed, with its source and what it can change about scope, outcome, or cost, including the cost band and its remaining unknowns |
| **User decisions** | Each unresolved product, UX, or operational question, with the scope, outcome, or cost effect of its materially different answers |

Keeping these sections apart lets the user tell their own settled boundary from a repository observation and from a question still open. Only an explicit user answer or selection moves an item into **Confirmed scope**. A calling workflow places its own route items, such as Structural Scale, outside these sections and only at stops that present them.

## Storage Protocol

| Carrier | Holds |
|---------|-------|
| The active convergence record | Every field with its readiness label |
| PRD `Success Criteria` and `Out of Scope` | `outcome`; user-authored `nonGoals` |
| Design Doc `Requirement Convergence` | The same when no PRD exists, and the fields left `weak-but-explicit` in every case |

When neither document exists, retain the record in the active context.

## Reference Protocol

1. Read the convergence record from the prompt.
2. Treat `nonGoals` as excluded from the current change and `desired-future` requirements as buildable scope. Evaluation requests, speculative ideas, prescribed mechanisms, and agent-proposed capabilities that were not promoted create no implementation obligation; an accepted ADR may retain evaluated options as decision history.
3. Treat a `weak-but-explicit` field as a recorded open question rather than a settled decision, and escalate when the work depends on resolving it.

## Quality Checklist

- [ ] The Scope Confirmation kept confirmed scope, decision evidence, and user decisions separate before any question was asked
- [ ] `nonGoals` came from the user, or the user stated there are none
- [ ] Every applicable field is `ready`, or `weak-but-explicit` by the user's agreement

## References

- [references/criteria.md](references/criteria.md) — judgment rules per field, cost inputs, challenge intensity, solution-in-disguise test
