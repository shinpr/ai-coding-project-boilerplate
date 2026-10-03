# AI Coding Project Boilerplate: A Starter Kit for Claude Code

*Read this in other languages: [日本語](README.ja.md) | [简体中文](README.zh-CN.md)*

[![TypeScript](https://img.shields.io/badge/TypeScript-7.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24.15%2B-green?logo=node.js)](https://nodejs.org/)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Optimized-purple)](https://claude.ai/code)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`create-ai-project` sets up a TypeScript project where Claude Code can take a request through requirements, design, implementation, and checks. The workflows keep the work tied to the outcome you agree on, including when Claude finds other problems along the way.

The development rules live alongside your code. Your team can share and adapt them, then use the same setup in future Claude Code sessions.

## When to use the workflows

Use them when a feature needs scope agreement, design decisions you need to reuse later, or a handoff to another session or contributor. After you approve the implementation scope, Claude handles technical choices and carries the work through checks, commits, and review. It asks you when the agreed outcome or exclusions must change, or an irreversible external action needs approval.

Design and review take time. For a small fix with a clear scope, start with `/task`. For a throwaway experiment, you can work with Claude directly.

## Quick start

### Start a new project

```bash
npx create-ai-project my-project
cd my-project
pnpm install
claude
```

Add `--lang=ja` or `--lang=zh-CN` to the first command to use Japanese or Simplified Chinese workflow instructions.

### Update a project created with this starter kit

Run these commands from the project root:

```bash
npx create-ai-project update --dry-run
npx create-ai-project update
claude
```

The updater refreshes the Claude Code setup without replacing your source code or existing package settings. It keeps your saved workflow mode.

### Run your first change

Once Claude Code is running:

```text
/project-inject
/implement Add rate limiting to the API
```

`/project-inject` records the project's constraints, quality standards, and conventions so you do not have to repeat them in every request.

`/implement` confirms the outcome, inspects the existing code, and creates the design and planning documents the change needs. Review checks the agreed behavior and looks for unnecessary changes or serious defects. Each finding is assessed before it becomes correction work. The completion report names checks that were skipped or could not run.

See the [Quick Start Guide](docs/guides/en/quickstart.md) for the full setup and first-run walkthrough.

## Choose a workflow

| What you want to do | Start with |
|---|---|
| Take a feature from a request through implementation and verification | `/implement` |
| Make a focused change with a clear scope | `/task` |
| Design a change before coding | `/design`, `/front-design` |
| Turn an approved design into an executable plan | `/plan`, `/front-plan` |
| Continue implementation from an approved plan | `/build`, `/front-build` |
| Review completed implementation against the agreed outcome and repository standards | `/review`, `/front-review` |
| Investigate a problem before choosing a fix | `/diagnose` |

### Design now, implement later

```text
/design Add rate limiting to the API
/plan
/build
```

The design command stops for approval. You can continue planning and implementation later, in a new session or with another contributor, using the approved documents. The plan records what each task must deliver and how to check it, so the handoff does not depend on reconstructing the earlier conversation.

For frontend work, use the corresponding commands:

```text
/front-design Add a user profile dashboard
/front-plan
/front-build
```

See [Use Cases & Commands](docs/guides/en/use-cases.md) for examples and the complete command reference.

## Workflow modes

Normal Mode is the default and runs the full verification flow. Lite Mode skips independent checks of design documents against the code and against each other, along with the separate security review. For planned implementation, it combines repository quality checks at the end of the work, before code review.

Code review, focused implementation checks, required test reviews, and approval stops remain in place. Straightforward changes and review corrections also keep their quality checks.

To save Lite Mode as the project's default, run this from the project root:

```bash
node scripts/set-workflow-mode.js lite
```

The setting is saved in `CLAUDE.md`, so future sessions use it without a mode request. Run `node scripts/set-workflow-mode.js normal` to restore Normal Mode. A mode you explicitly request in conversation overrides the project default and stays in effect until you change it.

## Adapt it to your project

Use `/project-inject` for the facts, constraints, and quality standards that apply across the repository. Claude can then refer to the project's purpose, conventions, and external sources in later work.

For guidance that applies only to particular tasks, use `/create-skill` or `/refine-skill`. These commands help you decide where the guidance belongs and review it before use. See the [Skills Editing Guide](docs/guides/en/skills-editing-guide.md) for examples.

## Guides

- [Quick Start Guide](docs/guides/en/quickstart.md)
- [Use Cases & Commands](docs/guides/en/use-cases.md)
- [Skills Editing Guide](docs/guides/en/skills-editing-guide.md)

## License

[MIT](LICENSE)
