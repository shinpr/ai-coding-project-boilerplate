---
name: project-context
description: Marks project context as unconfigured until project-inject materializes domain constraints, repository quality standards, phase, conventions, and external-resource access in this file. Use when checking project context before the initial project-inject run.
---

# Project Context

**Status**: Unconfigured.

Run `/project-inject` once to collect the project-specific context and replace this unconfigured body. A configured body contains at least the `## Project Overview` section. When the command is unavailable or cannot complete its hearing, report that project context is unknown and name the missing project decision instead of assuming one.
