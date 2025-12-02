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

### Architecture Patterns
Strictly adhere to selected project patterns. Project-specific details reference `docs/rules/architecture/`.

## Unified Data Flow Principles

### Data Flow Consistency
Maintain consistent data flow throughout the application:
- **Single Source of Truth**: Each piece of data has one authoritative source
- **Unidirectional Flow**: Data flows in a predictable direction
- **Immutable Updates**: Prefer immutable data transformations

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

### Quality Check Requirements

Quality checks are mandatory upon implementation completion:

**Phase 1-3: Basic Checks**
- `check` - Biome (lint + format)
- `check:unused` - Detect unused exports
- `build` - TypeScript build

**Phase 4-6: Tests and Final Confirmation**
- `test` - Test execution
- `test:coverage:fresh` - Coverage measurement
- `check:all` - Overall integrated check

### Auxiliary Commands
- `open coverage/index.html` - Check coverage report
- `format` - Format fixes
- `lint:fix` - Lint fixes

### Troubleshooting
- **Port in use error**: Run the `cleanup:processes` script
- **Cache issues**: Run the `test:coverage:fresh` script
- **Dependency errors**: Clean reinstall dependencies

### Coverage Requirements
- **Mandatory**: Unit test coverage must be 70% or higher
- **Metrics**: Statements, Branches, Functions, Lines