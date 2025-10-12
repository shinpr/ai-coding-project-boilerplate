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

Define build commands and test execution methods for each project.

Quality checks are mandatory upon implementation completion.