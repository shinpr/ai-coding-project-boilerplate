---
name: technical-spec
description: Defines environment variables, architecture design, and build/test commands. Use when configuring environment or designing architecture.
---

# Technical Design Rules

## Basic Technology Stack Policy
TypeScript-based application implementation. Architecture patterns should be selected according to project requirements and scale.

## Environment Variable Management and Security

### Environment Variable Management
- Centrally manage environment variables and build mechanisms to ensure type safety
- Avoid direct references to `process.env`, obtain through configuration management layer
- Properly implement default value settings and mandatory checks

### Security
- Do not include `.env` files in Git
- Always manage API keys and secrets as environment variables
- Prohibit logging of sensitive information
- Do not include sensitive information in error messages

## Architecture Design

### Architecture Design Principles
Select appropriate architecture for each project and define clearly:

- **Separation of Responsibilities**: Clearly define responsibilities for each layer and module, and maintain boundaries

## Unified Data Flow Principles

#### Basic Principles
1. **Single Data Source**: Store the same information in only one place
2. **Structured Data Priority**: Use parsed objects rather than JSON strings
3. **Clear Responsibility Separation**: Clearly define responsibilities for each layer

#### Data Flow Best Practices
- **Validation at Input**: Validate data at input layer and pass internally in type-safe form
- **Centralized Transformation**: Consolidate data transformation logic in dedicated utilities
- **Structured Logging**: Output structured logs at each stage of data flow

## Build and Testing
Use the appropriate run command based on the `packageManager` field in package.json.

### Build Commands
- `build` - TypeScript build
- `type-check` - Type check (no emit)

### Testing Commands
- `test` - Run tests
- `test:coverage` - Run tests with coverage
- `test:coverage:fresh` - Run tests with coverage (fresh cache)
- `test:safe` - Safe test execution (with auto cleanup)
- `cleanup:processes` - Cleanup Vitest processes

### Quality Assurance Mechanism Awareness

Before executing quality checks, identify what quality mechanisms exist for the change area:
- Primary detection: inspect the change area's file types, project manifest, and configuration to identify applicable quality tools
  - Check CI pipeline definitions for checks that cover the affected paths
  - Check for domain-specific linter or validator configurations (e.g., schema validators, API spec validators, configuration file linters)
  - Check for domain-specific constraints in project configuration (naming rules, length limits, format requirements)
- Supplementary hint: IF task file specifies Quality Assurance Mechanisms → use them as additional hints for which domain-specific checks to look for
- Include discovered domain-specific checks alongside standard quality phases below

### Quality Check Requirements

Quality checks are mandatory upon implementation completion:

**Phase 1-3: Code Quality Checks**
- Auto-detect and execute the following from package.json scripts:
  - lint + format check
  - Detect unused exports
  - Detect circular dependencies
  - TypeScript build

**Phase 4: Tests**
- `test` - Test execution

**Phase 5: Code Quality Re-verification**
- `check:code` - Re-verify code quality (clean up side effects from test fixes in Phase 4)

### Auxiliary Commands
- `check:all` - Overall integrated check (check:code + test) *for manual batch verification
- `open coverage/index.html` - Check coverage report
- `format` - Format fixes
- `lint:fix` - Lint fixes

### Troubleshooting
- **Port in use error**: Run the `cleanup:processes` script
- **Cache issues**: Run the `test:coverage:fresh` script
- **Dependency errors**: Clean reinstall dependencies

### Coverage Requirements
- **MANDATORY**: Unit test coverage MUST be 70% or higher
- **Metrics**: Statements, Branches, Functions, Lines
