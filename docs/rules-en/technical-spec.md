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

### Build Commands
```bash
# TypeScript build
npm run build

# Type check (no emit)
npm run type-check
```

### Testing Commands
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests with coverage (fresh cache)
npm run test:coverage:fresh

# Safe test execution (with auto cleanup)
npm run test:safe

# Cleanup Vitest processes
npm run cleanup:processes
```

### Quality Check Requirements

Quality checks are mandatory upon implementation completion:

**Phase 1-3: Basic Checks**
```bash
npm run check        # Biome (lint + format)
npm run check:unused # Detect unused exports
npm run build        # TypeScript build
```

**Phase 4-6: Tests and Final Confirmation**
```bash
npm test                    # Test execution
npm run test:coverage:fresh # Coverage measurement
npm run check:all           # Overall integrated check
```

### Auxiliary Commands
```bash
# Check coverage report
open coverage/index.html

# Auto fixes
npm run format        # Format fixes
npm run lint:fix      # Lint fixes
```

### Troubleshooting
- **Port in use error**: `npm run cleanup:processes`
- **Cache issues**: `npm run test:coverage:fresh`
- **Dependency errors**: Reinstall with `npm ci`

### Coverage Requirements
- **Mandatory**: Unit test coverage must be 70% or higher
- **Metrics**: Statements, Branches, Functions, Lines