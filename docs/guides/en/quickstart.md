# Quick Start

This guide takes a new or existing TypeScript project through initial setup and its first `/implement` run.

## Create or update a project

For a new project:

```bash
npx create-ai-project my-project
cd my-project
npm install
```

For an existing project, run the updater from its root:

```bash
npx create-ai-project update --dry-run
npx create-ai-project update
```

The updater refreshes managed Claude commands, agents, skills, and rules. It does not replace source code or package configuration.

## Record project prerequisites

Start Claude Code in the project:

```bash
claude
```

Then run:

```text
/project-inject
```

Use the hearing to record only repository-specific information that changes agent decisions, such as:

- the project outcome and domain constraints;
- repository-specific standards that determine whether an implementation is accepted;
- directory conventions that differ from repository defaults;
- the current development phase;
- how to access external evidence such as schemas, API contracts, or infrastructure configuration.

The result is stored in `.claude/skills/project-context/SKILL.md` and loaded in later sessions. Re-run `/project-inject` when those prerequisites change.

## Implement a change

```text
/implement Add rate limiting to the API
```

The workflow:

1. confirms the outcome, requirements, exclusions, and decision burden;
2. inspects the repository before choosing an implementation;
3. implements directly when one coherent small outcome has one evident path;
4. creates and obtains approval for the required Design Doc and Work Plan for Medium/Large work, adding a PRD, UI Spec, or ADR only when its decision is needed;
5. implements each approved task boundary, runs applicable repository checks, and commits approved changes;
6. verifies completed Medium/Large implementation against its Design Doc and reports any check that could not run.

The workflow asks for user input when it needs a product decision, approval of a durable artifact, user-held authority, or an irreversible action. Repository-local implementation details remain with the agents.

## Resume planned work

Use `/implement` to continue the end-to-end flow, or `/build` when an approved Work Plan or materialized task files already exist:

```text
/implement Continue the current implementation
/build docs/plans/20260809-feature-example.md
```

`/build` resolves the selected plan's task files, completes them one at a time, and preserves the Work Plan after removing consumed task files.

## Next references

- [Use Cases & Commands](./use-cases.md) — choose a command and inspect its boundary
- [Skills Editing Guide](./skills-editing-guide.md) — add project knowledge or reusable decision criteria
- [README](../../../README.md) — workflow overview and update instructions
