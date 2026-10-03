# AI Coding Project Boilerplate: A Starter Kit for Claude Code

*Read this in other languages: [日本語](README.ja.md) | [简体中文](README.zh-CN.md)*

[![TypeScript](https://img.shields.io/badge/TypeScript-7.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24.15%2B-green?logo=node.js)](https://nodejs.org/)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Optimized-purple)](https://claude.ai/code)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Set up a TypeScript repository for development with Claude Code. `create-ai-project` adds a project-level `CLAUDE.md`, ready-to-use commands, specialized agents, and skills so Claude can follow your repository's rules while working on changes.

Use this starter kit to create a new project and keep its Claude Code setup up to date. You get a working development environment without assembling prompts and agent definitions yourself. Your team can version, share, and adapt that environment alongside the code.

## What you can start with

- Develop with TypeScript, Biome formatting and linting, and Vitest already configured
- Record project context and quality standards for later sessions and other contributors
- Turn team knowledge into skills Claude can use when the work calls for them

## Quick start

Requires Node.js 24.15+, pnpm, and Claude Code.

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

`/project-inject` sets up the initial project context.

`/implement` clarifies the request and inspects the existing code. Straightforward changes can proceed without design documents. When design decisions are needed, it prepares a design and plan for your approval before implementation. It then runs the applicable checks and reviews larger changes.

See the [Quick Start Guide](docs/guides/en/quickstart.md) for the full setup and first-run walkthrough.

## Choose a workflow

| What you want to do | Start with |
|---|---|
| Take a feature from a request through implementation and verification | `/implement` |
| Make a focused change with a clear scope | `/task` |
| Design a change before coding | `/design`, `/front-design` |
| Turn an approved design into an executable plan | `/plan`, `/front-plan` |
| Implement an approved plan | `/build`, `/front-build` |
| Review completed implementation against the agreed outcome and repository standards | `/review`, `/front-review` |
| Investigate a problem before choosing a fix, without changing code | `/diagnose` |

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

Normal Mode is the default. Choose Lite Mode when you want fewer independent checks and agent calls. It skips checks of design documents against the code and against each other, along with the separate security review. For planned work, Normal Mode runs repository checks such as lint and tests after each task. Lite Mode runs them together after implementation, before code review.

Claude still checks its changes, reviews required tests, and asks for your approval at the same points. Code review remains in place. Small changes and fixes made after review still get the usual quality checks.

To save Lite Mode as the project's default, run this from the project root:

```bash
node scripts/set-workflow-mode.js lite
```

The setting is saved in `CLAUDE.md`, so future sessions use it without a mode request. Run `node scripts/set-workflow-mode.js normal` to restore Normal Mode. A mode you explicitly request in conversation overrides the project default for the rest of that session, unless you change it again.

## Adapt the environment to your project

Use `/project-inject` to record the project's purpose, constraints, quality standards, conventions, and external sources. Run it again when those facts change.

For guidance that applies only to particular tasks, use `/create-skill` or `/refine-skill`. These commands help you decide where the guidance belongs and review it before use. See the [Skills Editing Guide](docs/guides/en/skills-editing-guide.md) for examples.

## Keep the Claude Code setup up to date

From the root of a project created with this starter kit, preview the update, then apply it:

```bash
npx create-ai-project update --dry-run
npx create-ai-project update
claude
```

The updater replaces the managed Claude Code rules, commands, agents, and skills. Local edits to files being updated are overwritten. It preserves your source code, existing package settings, and saved workflow mode.

Before updating, commit your project-specific rules and skills, including changes made with `/project-inject`, `/create-skill`, or `/refine-skill`. After the update, review what changed and manually reapply the customizations you want to keep. See the [Quick Start Guide](docs/guides/en/quickstart.md) for update details.

## Guides

- [Quick Start Guide](docs/guides/en/quickstart.md)
- [Use Cases & Commands](docs/guides/en/use-cases.md)
- [Skills Editing Guide](docs/guides/en/skills-editing-guide.md)

## License

[MIT](LICENSE)
