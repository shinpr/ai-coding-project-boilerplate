# Quick Start Guide

Set up and build your first feature in 5 minutes. See how sub-agents handle everything from design to implementation.

## Prerequisites

- Node.js 20+
- Claude Code installed
- Basic terminal knowledge

## Setup (30 seconds)

```bash
# Create project
npx github:shinpr/ai-coding-project-boilerplate my-project

# Install dependencies
cd my-project && npm install

# Launch Claude Code
claude
```

## Initial Configuration (1 minute)

Set up your project context:

```
/project-inject
```

Answer a few questions about your project. This customizes rules for your specific needs.

## Your First Feature (3 minutes)

Let's implement a real feature - a user management API with authentication:

```
/implement Create a user management API with the following features:
- User registration (email, password, name)
- Login with JWT token generation
- Get user profile endpoint
- Update user profile endpoint
- Password reset functionality
```

When you run `/implement`, here's what happens behind the scenes:
1. **requirement-analyzer** determines this is a medium-scale task (4-5 files)
2. **technical-designer** creates a Design Doc
3. **work-planner** breaks it down into tasks
4. **task-executor** implements each task
5. **quality-fixer** ensures everything passes checks

## Next Steps

After implementation completes, try these:

```bash
# Run tests
npm test

# Check code quality
npm run check:all

# Review implementation against design
/review
```

## Frequently Used Commands

- `/implement` - Build features from requirements
- `/task` - Execute single tasks with high precision
- `/design` - Create design docs only
- `/review` - Verify code against design docs
- `/build` - Resume or continue implementation

See the [Use Cases Quick Reference](./use-cases.md) for daily workflow patterns.

## How Sub-agents Work

Instead of one AI trying to handle everything, specialized sub-agents handle specific phases:

1. **Design Phase**: Create design docs that you review
2. **Planning Phase**: Break work into manageable tasks
3. **Execution Phase**: Each task runs with focused context

This approach prevents context overflow and maintains quality even for large projects.

For technical details, see [this article](https://qiita.com/shinpr/items/98771c2b8d2e15cafcd5).

## Troubleshooting

**If implementation stops midway:**
Tell Claude Code where implementation stopped: "You've completed the Design Doc. Please continue from planning phase through implementation."