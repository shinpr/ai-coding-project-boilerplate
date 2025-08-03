# Technical Design Rules

This rule file defines rules and guidelines for the project's technical architecture design, data flow design, and environment configuration.

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
Select appropriate architecture patterns according to project requirements and scale:
- **Vertical Slice Architecture**: LLM-optimized, one-feature-one-file principle
- **Hybrid Progressive Architecture**: Progressive evolution from small to large scale
- **Architecture Consistency**: Strictly follow the selected pattern

## Dependency Injection (DI) Pattern

### Overview
Utilizing Dependency Injection patterns enables:
- Improved testability
- Loose coupling between modules
- Easy implementation replacement

### Implementation Method
Select appropriate DI patterns or DI libraries according to project scale and requirements.

## Design Documents and Processes

### PRD/ADR/Design Doc/work plan Creation Process

#### Cases Requiring Creation
1. **New Feature Addition**: PRD → ADR (if architectural changes) → Design Doc → work plan → Implementation
2. **Large-scale Changes (6+ files)**: ADR → Design Doc → work plan (mandatory) → Implementation
3. **Medium-scale Changes (3-5 files)**: Consider Design Doc creation → work plan (recommended) → Implementation
4. **Small-scale Modifications (1-2 files)**: Direct implementation

#### About work plans
- **Storage Location**: `docs/plans/` (excluded by .gitignore)
- **Naming Convention**: `YYYYMMDD-{feature|fix|refactor}-{brief-description}.md`
- **Template**: `docs/plans/template-en.md`
- **Operational Flow**: 
  1. Create when starting medium-scale or larger changes
  2. Update progress when each phase completes (checkboxes)
  3. Delete after all tasks complete with user approval

#### ADR (Architecture Decision Record)
Record important technical decisions to enable future implementers to understand the background of decision-making.

### Data Flow Unification Principles

#### Basic Principles
1. **Single Data Source**: Store same information in only one place
2. **Structured Data Priority**: Use parsed objects instead of JSON strings
3. **Clear Responsibility Separation**: Clearly define responsibilities of each layer

#### Data Flow Best Practices
- **Input Point Validation**: Validate data at input layer and pass internally in type-safe form
- **Centralized Transformation**: Consolidate data transformation logic in dedicated utilities
- **Structured Logging**: Output structured logs at each stage of data flow

## Build and Testing

Define build commands and test execution methods for each project.

## Referenced Methodologies and Principles
- **ADR (Architecture Decision Record)**: Michael Nygard "Documenting Architecture Decisions"
- **Single Data Source Principle**: Single Source of Truth (data management best practice)
- **Dependency Injection (DI)**: Martin Fowler "Inversion of Control Containers and the Dependency Injection pattern"
Quality checks are mandatory upon implementation completion.