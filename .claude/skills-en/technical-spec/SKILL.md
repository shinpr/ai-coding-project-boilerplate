---
name: technical-spec
description: Defines environment variables, architecture design, and build/test commands. Use when configuring environment or designing architecture.
---

# Technical Design Rules

## Prerequisite Detection

Inspect manifests, lockfiles, build/test configuration, CI definitions, and representative source files before applying a technology- or command-specific rule. Treat a tool, script, path alias, or runtime as observed only when repository evidence names it. Label conclusions from surrounding patterns as inferred. When a missing decision changes architecture, compatibility, security, or verification, stop and name the exact configuration or user decision required.

## Basic Technology Stack Policy
These rules apply to a TypeScript application when repository configuration confirms that stack. Select architecture by mapping current requirements and accepted constraints to explicit module responsibilities, dependency direction, data flow, and verification boundaries.

## Environment Variable Management and Security

### Environment Variable Management
- Centrally manage environment variables and the build-time validation mechanism that enforces their type safety
- Read environment variables through one typed configuration boundary; application code consumes validated configuration values
- Give a variable a default only when requirements define valid behavior for absence; otherwise fail configuration validation with the variable name and expected format

### Security
- Keep local `.env` files outside version control and provide non-secret example files for required variable names
- Load API keys and secrets from the configured secret store or runtime environment boundary
- Log and return only fields approved for the current trust boundary; redact credentials, tokens, personal data, and internal diagnostics before returning data across an untrusted boundary

## Architecture Design

### Architecture Design Principles
Select architecture using these observable decisions:

- **Responsibilities**: Each module/layer names the behavior it owns and the behavior it delegates
- **Dependency direction**: Imports and runtime calls follow the project boundary rules observed in configuration or representative implementations
- **State/data ownership**: Each persisted or mutable value has one authoritative owner
- **Verification boundary**: Each public contract has a unit, integration, or E2E check that can observe it

## Unified Data Flow Principles

#### Basic Principles
1. **Single Data Source**: Store the same information in only one place
2. **Structured Data Priority**: Use parsed objects rather than JSON strings
3. **Responsibility Separation**: Each layer names the data or behavior it owns and the boundary through which other layers use it

#### Data Flow Best Practices
- **Validation at Input**: Validate data at input layer and pass internally in type-safe form
- **Centralized Transformation**: Consolidate data transformation logic in dedicated utilities
- **Structured Logging**: Output structured logs at each stage of data flow

## Build and Testing
Select the package manager from the `packageManager` field, lockfile, or established CI command in that order. Execute only scripts present in the selected manifest.

### Build Commands
- `build` - TypeScript build
- `type-check` - Type check (no emit)

### Testing Commands
- `test` - Run tests

### Quality Assurance Mechanism Awareness

Before executing quality checks, identify what quality mechanisms exist for the change area:
- Primary detection: inspect the change area's file types, project manifest, and configuration to identify applicable quality tools
  - Check CI pipeline definitions for checks that cover the affected paths
  - Check for domain-specific linter or validator configurations (e.g., schema validators, API spec validators, configuration file linters)
  - Check for domain-specific constraints in project configuration (naming rules, length limits, format requirements)
- When a task file supplies Operation Verification Methods, run them as task-specific checks
- Include discovered domain-specific checks alongside standard quality phases below

### Quality Check Requirements

Quality checks are mandatory upon implementation completion:

**Phase 1-3: Code Quality Checks**
- Auto-detect and execute the following from package.json scripts:
  - lint + format check
  - Detect unused exports
  - Detect circular dependencies
  - TypeScript build

**Transition evidence**: every applicable static/domain check exits successfully. A missing required script is reported with the manifest/configuration path and blocks the next phase until an equivalent established command is identified.

**Phase 4: Tests**
- `test` - Test execution

**Transition evidence**: all applicable configured test suites pass, or an environment-dependent suite is recorded as blocked with its exact prerequisite.

**Phase 5: Code Quality Re-verification**
- `check:code` - Re-verify code quality (clean up side effects from test fixes in Phase 4)

**Completion evidence**: static/domain checks still pass after test-related fixes, the build succeeds, and every required test has passed or is explicitly blocked.

### Auxiliary Commands
- `check:all` - Overall integrated check (check:code + test) *for manual batch verification
- `format` - Format fixes
- `lint:fix` - Lint fixes

### Troubleshooting
- **Dependency errors**: First record the failing resolver output, selected package manager, manifest, and lockfile state. Use the repository's established clean-install command only when it preserves the lockfile and generated artifacts; request approval before an operation that removes or regenerates dependency state
