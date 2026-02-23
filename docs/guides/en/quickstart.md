# Quick Start Guide for AI Development

This guide walks you through setting up the AI Coding Project Boilerplate and implementing your first feature. Let's skip the complex stuff for now and just get it running.

## Setup (5 minutes to complete)

### For New Projects

Open your terminal and run these commands. Feel free to change the project name to whatever you like.

```bash
npx create-ai-project my-awesome-project
cd my-awesome-project
npm install
```

That's it! You now have a `my-awesome-project` folder with all the necessary files ready to use.

### For Existing Projects

If you already have a TypeScript project, run the setup from your project's root directory:

```bash
npx create-ai-project update
```

This will add agent definitions, commands, skills, and AI rules to your project. Your source code and `package.json` are never touched.

## Launch Claude Code and Initial Setup

Launch Claude Code in your project directory.

```bash
claude
```

Once launched, set up your project's prerequisites. This is crucial for AI execution accuracy — the information you provide here is read at the start of every AI session.

Run the following custom slash command inside Claude Code.

```bash
/project-inject
```

You'll be guided through an interactive dialog to clarify your project information. The command collects:
- What your project does and its domain
- Domain-specific constraints that affect AI decisions
- Development phase and directory conventions

Once complete, the project context is saved to `.claude/skills/project-context/SKILL.md`. You can re-run `/project-inject` anytime to update it.

## Let's Implement Your First Feature

Now let's create your first feature. Specify it using the following command in Claude Code.

```bash
/implement Create a simple API that returns "Hello"
```

The `/implement` command guides you through the entire workflow from design to implementation.

First, it analyzes your requirements to determine the feature scale. It might say something like "This is a medium-scale feature requiring about 3 files." Based on the scale, it creates necessary design documents.

For small features, it creates just a simple work plan. For large features, it creates a complete flow from PRD (Product Requirements Document) to Design Doc (Technical Design Document). After each design document is created, an automatic review is performed.

Once the design is complete, the AI will ask "Here's the design I've created. Could you review it?" Read through it and request changes if needed, or approve it if it looks good.
Depending on the Claude Code model you're using, it may automatically proceed to the next design document if your review is positive. At some point it will ask for your approval, so you can provide batch feedback then.

After design approval, integration test skeletons and a work plan are created. Once you review the implementation steps (requesting changes if needed) and approve, the actual implementation begins.

The AI breaks down the work plan into single-commit task units and autonomously implements each task using a TDD approach. After each task, it performs a defined 6-step quality check, fixes any errors, and creates a commit if everything passes. You can simply watch the progress.

When all tasks are complete, it will report "Implementation complete." Check `git log` to see a clean series of commits.

## Development Philosophy of This Boilerplate

Let me explain the thinking behind this boilerplate.

To maximize throughput with AI assistance, it's crucial to minimize human intervention. However, achieving high execution accuracy with AI requires careful context management—providing the right information at the right time. Without proper systems, humans need to guide the implementation process, which prevents throughput maximization.

This boilerplate solves this through systematic approaches: selecting appropriate context (skills, requirements, specifications) for each phase and limiting unnecessary information during task execution.

The workflow is: create design documents, review them with users to align understanding, use those documents as context for planning and task creation. Tasks are executed by sub-agents with dedicated contexts, which removes unnecessary information and stabilizes implementation. This system helps maintain quality even for projects too large to fit within a single coding agent's context window (Claude Opus 4.1 supports 200K tokens, Sonnet 4 beta supports up to 1M tokens, but the basic limit is 200K tokens).

For detailed mechanics, see [this article](https://dev.to/shinpr/zero-context-exhaustion-building-production-ready-ai-coding-teams-with-claude-code-sub-agents-31b).

## What's Next?

Now that you're set up, here are common things you'll want to do and how to do them.

| "I want to..." | How |
|---|---|
| Have AI reference my library docs (llms.txt, API refs, etc.) | Add to an existing skill or [create a new one](./skills-editing-guide.md) — [see below](#example-where-to-put-library-documentation) |
| Enforce my team's coding conventions | Use `/create-skill` or [create a custom skill manually](./skills-editing-guide.md) |
| Set project-specific constraints and context | Run `/project-inject` |
| Learn the full set of available commands | [Use Cases & Commands](./use-cases.md) |
| Customize how agents behave | Edit skill files under `.claude/skills/` |

Skills are the primary way to give AI project-specific knowledge. See the [Skills Editing Guide](./skills-editing-guide.md) for how to create your own.

### Example: Where to Put Library Documentation

Where to place library docs depends on your project — there's no single right answer. Think about **when AI needs the information** and **what it relates to**: add to an existing skill, a phase-specific doc, or create a dedicated skill. See the [Use Cases guide](./use-cases.md#want-ai-to-reference-specific-library-docs) for concrete examples and the [Skills Editing Guide](./skills-editing-guide.md#determining-where-to-document) for details.

## Troubleshooting

If things aren't working, check the following.

**If implementation stops midway**
Describe the current state to Claude Code and ask it to resume, for example: "You've completed up to the Design Doc creation, so please continue from there and complete the implementation."
