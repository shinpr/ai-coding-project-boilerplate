# Project Context

This document defines the project characteristics, background, development structure, and other contexts that should always be considered during code implementation.

## Basic Configuration

### Project Nature
- **Project Type**: Claude Code-specific TypeScript project template
- **Usage Scope**: Configurable according to project requirements
- **Development Approach**: LLM-driven development, quality-focused, strict YAGNI principle adherence

### Technology Stack
- **Foundation Technologies**: TypeScript, Node.js
- **Test Framework**: Vitest
- **Quality Management**: Biome, TypeScript strict mode

## Development Principles

### Code Quality
- Type safety as top priority
- Prohibition of any type usage (utilize unknown type and type guards)
- Test-first development (Red-Green-Refactor)
- Aggressive refactoring

### Project Management
- Systematic design through ADR/Design Doc/work plans
- Complete quality check passing as completion condition

## Customization Guide

When using this template for new projects:

1. **Add Project-Specific Information**
   - Target user characteristics
   - Business requirements and constraints
   - Technical constraint conditions

2. **Architecture Selection**
   - Select appropriate patterns from `docs/rules/architecture/`
   - Place project-specific designs in `docs/rules/architecture/`

3. **Environment Configuration**
   - Implement environment variable management suitable for the project
   - Add project-specific configuration files