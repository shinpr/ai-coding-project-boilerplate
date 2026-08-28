# Skills Editing Guide

A skill should change a decision that a capable model cannot safely make from baseline knowledge and the repository alone. Keep strict boundaries and evidence requirements; let the model choose reversible paths inside them.

## Decide whether a skill is needed

Keep a rule in a skill when all of the following are true:

- the decision recurs for the same responsibility;
- project, product, or organization evidence changes the correct choice;
- the information is not already owned by code, configuration, or a governing artifact;
- removing the rule would change a decision, downstream result, irreversible boundary, or observable verification.

General programming knowledge, one-change design decisions, explanatory background, and rules added only to prevent a past model habit do not justify a skill by themselves.

## Put information in its owner

| Information | Owner |
|---|---|
| Rules that truly apply to every task and session startup | `CLAUDE.md` |
| Repository purpose, domain constraints, quality standards, directory conventions, and external evidence access | `project-context` via `/project-inject` |
| Reusable decision criteria for one technical or workflow responsibility | A skill |
| Product outcome, accepted requirements, and exclusions for one change | PRD or confirmed requirement record |
| Durable technical choice between credible alternatives | ADR |
| Feature-specific responsibilities, contracts, flows, and verification boundaries | Design Doc or UI Spec |
| Implementation order and executable task boundaries | Work Plan |
| Package scripts, schemas, routes, and runtime configuration | Their repository source files |

State how to locate an existing source instead of copying it into a skill. Add only the interpretation rule the source itself cannot express.

## Give decisions, not a predicted route

For each responsibility, provide four things:

| Input | Question it answers |
|---|---|
| Purpose | What result does this skill own? |
| Evidence | Which requirements, repository facts, or checks can change the decision? |
| Selection criteria | How does the agent choose the next action from that evidence? |
| Minimum result | What is the smallest result the next consumer needs? |

“Run every test lane” predicts work. “Use the narrowest test that exposes the required boundary” supplies a selection criterion. A capable model can choose the lane from repository evidence without a branch for every framework or project shape.

### Boundary constraints

Boundary constraints describe what must remain true:

- implement the confirmed outcome and preserve recorded exclusions;
- preserve public contracts unless an authorized requirement changes them;
- require authority for irreversible external actions;
- claim completion only when the required behavior is observable.

These constraints continue to matter as models improve.

### Work-generating constraints

Work-generating constraints request artifacts or actions regardless of current need: fixed alternative counts, mandatory test lanes, universal mitigation records, fixed retry loops, and exact labels in human-readable documents.

Retain one only when current evidence shows that the generated work protects a requirement, consumer, or observable failure. Otherwise replace it with the decision criterion that selects the work when needed.

Use exact schemas where software parses the result. For human-readable artifacts, accept semantically equivalent evidence unless a downstream consumer requires a specific representation.

Let the model resolve repository-local, reversible ambiguity. Ask the user when progress requires a changed product outcome, public contract, major approved design, user-held authority, or irreversible action. Enforce dangerous operational boundaries with permissions, sandboxes, isolated credentials, and other mechanical controls where possible; prompt wording is not containment.

## Use progressive disclosure

```text
.claude/skills/api-contracts/
├── SKILL.md
├── references/        # detailed criteria loaded when needed
└── scripts/           # deterministic operations owned by the skill
```

### Metadata

The description is selection evidence, not a table of contents. Name the responsibility, its project-specific value, and caller phrases that should trigger it.

```yaml
---
name: api-contracts
description: Applies this project's shared API compatibility and error semantics. Use when creating or changing HTTP endpoints or shared API types.
---
```

A skill that describes only baseline knowledge needs project-specific content or does not need to exist.

### SKILL.md body

Use only the sections needed by the responsibility. A useful order is:

1. purpose and scope;
2. sources and required inputs;
3. decision criteria;
4. dependent process steps, when order matters;
5. consumer-required output shape, when one exists;
6. verification and unresolved-input handling;
7. references.

Include only sections with operative content. Put the common decision path before exceptions. A dependent process step names its completion evidence and the condition that permits the next step.

### References and scripts

- Link supporting files directly from `SKILL.md`; avoid reference chains.
- Compress first, then put remaining conditional source material in `references/` and load only what controls the current decision.
- Use `scripts/` when the same deterministic operation would otherwise be regenerated each time.
- Reuse an existing template or script when it already produces the required artifact.
- Record access methods for external schemas, APIs, or infrastructure in `project-context`; a URL alone does not guarantee access in every execution environment.

## Review with BP-001 through BP-009

Use the same nine checks as [rashomon](https://github.com/shinpr/rashomon):

| Pattern | Skill check |
|---|---|
| BP-001 Negative instructions | Lead with the required behavior. Keep an explicit prohibition only for a narrow irreversible boundary, paired with the safe alternative and authorization condition. |
| BP-002 Vague instructions | Clarify only an ambiguity that materially changes correctness, scope, downstream use, or verification. Use the least-restrictive sufficient criterion. |
| BP-003 Missing output format | Define only the fields, ordering, or serialization required by the actual output consumer. |
| BP-004 Unstructured content | Add the smallest structure that exposes priority, roles, and dependencies. A simple rule can remain prose. |
| BP-005 Missing or excess context | Keep context only when it changes a decision, action, or verification result. Name project-specific sources. |
| BP-006 Missing or excess procedural control | Keep gates for true dependencies, authority, irreversible actions, machine-consumed contracts, and completion proof. For reversible choices, provide purpose, evidence, and selection criteria without prescribing the route. |
| BP-007 Unnecessary examples | Prefer a rule or consumer-required shape. Add the smallest example set only for a non-obvious project mapping, exception, or boundary. |
| BP-008 Missing uncertainty handling | Distinguish observed, inferred, and unknown evidence. Stop only when an unknown blocks the next transition, and name the exact evidence or user decision required. |
| BP-009 Unbounded work generation | Treat discoveries as candidates. Retain only work required by the outcome, a boundary, a real consumer, or necessary proof; allow no-change, reuse, and evidence-backed decline. |

An example affects the model beyond the fact it demonstrates: it also anchors format, local naming, and likely solutions. Remove examples whose ambiguity can be resolved by a concise rule.

## Create or revise a skill

Use the repository commands when possible:

```text
/create-skill Define the API compatibility rules used by this project
/refine-skill Remove file-count thresholds from api-contracts and use consumer evidence instead
/sync-skills
```

For a manual or reviewed change, use three gates:

1. **Analysis** — preserve the intended outcome and requirements; inspect the complete skill and required references; scan BP-001 through BP-009; identify the decision or output that is wrong.
2. **Optimization** — resolve each supported finding at the owning rule; add a constraint only when it removes an outcome-relevant ambiguity or protects a named requirement.
3. **Balance** — verify intent preservation, decision sufficiency, information density, constraint necessity, work proportionality, and traceability; remove additions that change no decision or valid output.

After editing, run `/sync-skills` and the repository's skill-index check.

## Audit each rule

Before retaining or adding a rule, ask:

1. What decision, boundary, consumer, or observable failure changes if the rule is removed?
2. Does the rule limit scope, or does it manufacture work regardless of need?
3. Can the model choose correctly from current evidence instead of following an exhaustive route?
4. Does the revised skill work in a fresh session without relying on the conversation that produced it?

Do not add the opposite of one observed model failure as a universal rule. First determine whether the failure still reproduces, whether it belongs to the prompt, and whether the same rule would create passivity or extra work on another valid task.

## Validate behavior

Text review proves consistency, not effectiveness. Run representative tasks from a fresh session and compare actual results:

- a small change remains small;
- ordinary repository ambiguity does not return to the user;
- optional findings and speculative risks do not expand scope;
- required approvals, contracts, tests, and quality checks still hold;
- the skill is selected for intended requests and not unrelated ones;
- removing an added instruction reintroduces the observed failure or ambiguity.

[rashomon](https://github.com/shinpr/rashomon) can run tasks with and without a skill change in isolated environments. Treat output differences as improvement only when they preserve intent and produce an attributable execution benefit beyond normal variance.

## References

- [rashomon prompt optimization](https://github.com/shinpr/rashomon) — BP-001 through BP-009 analysis, gated optimization, and comparative evaluation
- [Claude Code skills documentation](https://code.claude.com/docs/en/skills) — platform format and loading behavior
