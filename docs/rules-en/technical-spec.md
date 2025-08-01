# Technical Design Rules

This rule file defines rules and guidelines for technical architecture design, data flow design, and environment configuration of the project.

## Basic Technology Stack Policy
TypeScript-based application development. Architecture patterns should be selected according to project requirements and scale.

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

### Architecture Definition and Adherence
Architecture is defined in `docs/rules/architecture/`.
- Always check `docs/rules/architecture/` and strictly follow defined rules and patterns
- Prioritize architectural consistency
- Independent interpretation or changes are prohibited

### Architecture Pattern Examples
- **Vertical Slice Architecture**: LLM-optimized, one-feature-one-file principle
- **Hybrid Progressive Architecture**: Progressive evolution from small to large scale

See `docs/rules/architecture/` for details.

<!-- Reference examples:
@docs/rules/architecture/vertical-slice/rules.md - LLM-optimized, one-feature-one-file principle
@docs/rules/architecture/hybrid-progressive/rules.md - Progressive evolution from small to large scale
-->

## Dependency Injection (DI) Pattern

### Overview
Utilizing Dependency Injection patterns enables:
- Improved testability
- Loose coupling between modules
- Easy implementation replacement

### Implementation Method
Select appropriate DI patterns or DI libraries according to project scale and requirements.

## Design Documents and Processes

### PRD/ADR/Design Doc/Work Plan Creation Process

#### Cases Requiring Creation
1. **New Feature Addition**: PRD → ADR (if architectural changes) → Design Doc → Work Plan → Implementation
2. **Large-scale Changes (6+ files)**: ADR → Design Doc → Work Plan (mandatory) → Implementation
3. **Medium-scale Changes (3-5 files)**: Consider Design Doc creation → Work Plan (recommended) → Implementation
4. **Small-scale Modifications (1-2 files)**: Direct implementation

#### About Work Plans
- **Storage Location**: `docs/plans/` (excluded by .gitignore)
- **Naming Convention**: `YYYYMMDD-{feature|fix|refactor}-{brief-description}.md`
- **Template**: `docs/plans/template.md`
- **Operational Flow**: 
  1. Create when starting medium-scale or larger changes
  2. Update progress when each phase completes (checkboxes)
  3. Delete after all tasks complete with user approval

#### ADR (Architecture Decision Record)
See @docs/rules/architecture-decision-process.md for ADR creation process and operational methods.

### Data Flow Unification Principles

#### Basic Principles
1. **Single Data Source**: Store same information in only one place
2. **Structured Data Priority**: Use parsed objects instead of JSON strings
3. **Clear Responsibility Separation**: Clearly define responsibilities of each layer
4. **Type Safety Assurance**: Limit `unknown` type usage to initial reception of external input only, always convert to specific types after type guard validation

#### Data Flow Best Practices
- **Input Point Validation**: Validate data at input layer and pass to internal in type-safe form
- **Centralized Transformation**: Consolidate data transformation logic in dedicated utilities
- **Consistent Error Handling**: Handle errors generated in each layer within that layer, return abstracted errors to upper layers
- **Structured Logging**: Output structured logs at each stage of data flow

## Build and Testing

See @docs/rules/typescript-testing.md for build commands and test execution.
See @docs/rules/ai-development-guide.md "Quality Checks (Mandatory on Implementation Completion)" for quality check details.