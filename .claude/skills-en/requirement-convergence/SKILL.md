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

Keep request signals classified as evaluation requests, speculative ideas, or prescribed mechanisms in active convergence context as judgment-only candidates. `requirements[]` and durable documents receive a candidate only after explicit user confirmation.

Each field carries its own readiness label: `ready`, `weak`, or `weak-but-explicit` (weak, and the user agreed to leave it unresolved). Only the user sets `weak-but-explicit`. Requirements are converged when every applicable field is `ready` or `weak-but-explicit`.

Judgment rules per field: [references/criteria.md](references/criteria.md).

## Hearing Protocol

The orchestrator owns both elicitation and judgment. It uses the analyzer's scope and cost evidence, then asks only for product choices that the repository cannot answer. Re-run the analyzer only when an answer changes the analysis target or required scope evidence.

Register these steps before starting and record each step's evidence as it completes:

| Step | Action | Completion evidence |
|------|--------|---------------------|
| 1 | State the scope facts the analysis produced, then separately what they imply for the requirement | Facts listed with the analysis output they came from |
| 2 | Ask about the fields below `ready`, at most two questions per message | One question per field below `ready` |
| 3 | Record each answer as that field's value | The value is the option the user selected or the wording the user supplied |
| 4 | Re-ask once when a recorded value still fails its pass condition, then mark the field `weak-but-explicit` when the user agrees to leave the second answer as it stands | Two recorded answers, or the user's agreement to stop |
| 5 | Judge each field against its pass condition and pass the completed record downstream | A convergence record with every field labeled |

## Storage Protocol

| Carrier | Holds | Written by |
|---------|-------|------------|
| The orchestrator's convergence record | Every field with its readiness label | Orchestrator |
| PRD `Success Criteria` and `Out of Scope` | `outcome`; user-authored `nonGoals` | The agent that owns the PRD |
| Design Doc `Requirement Convergence` | The same when no PRD exists, and the fields left `weak-but-explicit` in every case | The agent that owns the Design Doc |

A flow that produces neither document carries the record in its own context to the next step.

## Reference Protocol (For Downstream Consumers)

1. Read the convergence record from the prompt.
2. Treat `nonGoals` as excluded from the current change and `desired-future` requirements as buildable scope. Evaluation requests, speculative ideas, and prescribed mechanisms that were not promoted create no downstream obligation; an accepted ADR may retain evaluated options as decision history.
3. Treat a `weak-but-explicit` field as a recorded open question rather than a settled decision, and escalate when the work depends on resolving it.

## Quality Checklist

- [ ] Scope facts were presented before questions were asked
- [ ] `nonGoals` came from the user, or the user stated there are none
- [ ] Every applicable field is `ready`, or `weak-but-explicit` by the user's agreement

## References

- [references/criteria.md](references/criteria.md) — judgment rules per field, cost inputs, challenge intensity, solution-in-disguise test
