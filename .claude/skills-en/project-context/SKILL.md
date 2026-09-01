---
name: project-context
description: Marks project context as unconfigured until domain constraints, repository quality standards, phase, conventions, and external-resource access are recorded. Use when project-specific context has not yet been configured.
---

# Project Context

**Status**: Unconfigured.

Report that project context is unconfigured and direct the user to run `/project-inject` once to collect it. A configured body contains at least the `## Project Overview` section. When the command is unavailable or cannot complete its hearing, report that project context is unknown and name the missing project decision instead of assuming one.
