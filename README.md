# AI Coding Project Boilerplate: A Starter Kit for Claude Code

*Read this in other languages: [日本語](README.ja.md) | [简体中文](README.zh-CN.md)*

[![TypeScript](https://img.shields.io/badge/TypeScript-7.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24.15%2B-green?logo=node.js)](https://nodejs.org/)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Optimized-purple)](https://claude.ai/code)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Set up a TypeScript repository for development with Claude Code. `create-ai-project` adds a project-level `CLAUDE.md`, ready-to-use commands, specialized agents, and skills so Claude can work through requirements, design, implementation, and verification using your repository's rules.

Use this starter kit to create a new project and keep its Claude Code setup up to date. You get a working development environment without assembling prompts and agent definitions yourself. Your team can version, share, and adapt that environment alongside the code.

## What you can start with

- Develop with TypeScript, formatting, linting, and testing tools already configured
- Use the same project rules for requirements, design, implementation, and review
- Record project context and quality standards for later sessions and other contributors
- Turn team knowledge into skills Claude can use when the work calls for them

## Quick start

### Start a new project

```bash
npx create-ai-project my-project
cd my-project
pnpm install
claude
```

Add `--lang=ja` or `--lang=zh-CN` to the first command to use Japanese or Simplified Chinese workflow instructions.

### Run your first change

Once Claude Code is running:

```text
/project-inject
/implement Add rate limiting to the API
```

`/project-inject` records the project's constraints, quality standards, and conventions so you do not have to repeat them in every request.

`/implement` clarifies the request, inspects the existing code, and runs the design, planning, implementation, and checks the change needs. It pauses for required approvals. Larger changes also get a review of the completed implementation.

See the [Quick Start Guide](docs/guides/en/quickstart.md) for the full setup and first-run walkthrough.

## Adapt and share the environment

Use `/project-inject` to record the project's purpose, constraints, quality standards, conventions, and external sources. Run it again when those facts change. Later sessions can use the recorded context instead of relying on earlier conversations.

For guidance that applies only to particular tasks, use `/create-skill` or `/refine-skill`. These commands help you decide where the guidance belongs and review it before use. See the [Skills Editing Guide](docs/guides/en/skills-editing-guide.md) for examples.

Version the project rules and skills alongside your code so the team can use and improve the same setup.

## Keep the Claude Code setup up to date

From the root of a project created with this starter kit, preview the update, then apply it:

```bash
npx create-ai-project update --dry-run
npx create-ai-project update
claude
```

The updater refreshes the managed Claude Code rules, commands, agents, and skills without replacing your source code or existing package settings. It keeps your saved workflow mode. See the [Quick Start Guide](docs/guides/en/quickstart.md) for update details.

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

## Guides

- [Quick Start Guide](docs/guides/en/quickstart.md)
- [Use Cases & Commands](docs/guides/en/use-cases.md)
- [Skills Editing Guide](docs/guides/en/skills-editing-guide.md)

## License

[MIT](LICENSE)
