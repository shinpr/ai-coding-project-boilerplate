---
name: typescript-testing
description: Applies Vitest test design and quality standards. Provides coverage requirements and mock usage guides. Use when writing unit tests.
---

# TypeScript Testing Rules

## Prerequisite Detection

Inspect `package.json`, the lockfile, test configuration, and existing test imports before selecting a framework or command. Apply Vitest-specific rules only when Vitest is configured; otherwise use the repository's configured TypeScript test harness while preserving the behavior, isolation, and evidence rules below. If no runnable harness is identifiable, report the inspected paths and missing command or configuration.

## Test Framework

- **Vitest**: Use when selected by repository configuration or existing tests
- Test imports: `import { describe, it, expect, beforeEach, vi } from 'vitest'`
- Mock creation: Use `vi.mock()`

## Basic Testing Policy

### Quality Requirements
- **Coverage**: treat coverage as a diagnostic signal for finding untested areas, not a target (a target gets gamed into trivial tests — Goodhart's Law). Concentrate tests on critical paths, business logic, and behavior whose regression would matter. Raise coverage where a gap leaves a real regression unguarded, not to hit a percentage. Any numeric threshold is the project's CI config
- **Independence**: Each test can run independently without depending on other tests
- **Reproducibility**: Control time, randomness, environment values, and external I/O so identical inputs produce the same observable result
- **Readability**: Each test names one behavior, separates setup/action/assertion, and keeps fixtures limited to values used by that behavior

### Test Types and Scope
1. **Unit Tests**
   - Verify behavior of individual functions or classes
   - Mock all external dependencies
   - Most numerous, implemented with fine granularity

2. **Integration Tests**
   - Verify coordination between multiple components
   - Use real in-process components that are part of the behavior under test; for external I/O see Mock Scope Decision
   - Verify flows that implement a primary acceptance criterion or cross an in-process component boundary

3. **Cross-functional Verification in E2E Tests**
   - Mandatory verification of impact on existing features when adding new features
   - Classify each integration point: High when failure breaks a primary user journey or public contract, Medium when failure degrades a secondary observable behavior. Cover High and Medium
   - Verification pattern: Existing feature operation -> Enable new feature -> Verify continuity of existing features
   - Success criteria: Preserve the response fields and observable behavior named by the source acceptance criteria; apply a processing-time threshold only when a requirement or project configuration defines its value and measurement method
   - Designed for automatic execution in CI/CD pipelines

## Test Implementation Conventions

### Directory Structure and Naming
- Tests live in a `__tests__/` directory beside the module under test
- Test files: `{target-file-name}.test.ts`
- Integration test files: `{target-file-name}.int.test.ts`
- Test suites: Names describing target features or situations
- Test cases: Names describing expected behavior

### Test Code Quality Rules

Keep every committed test active. Repair a test that protects current behavior; remove a test only when its behavior is no longer required and the source requirement or implementation contract confirms the removal.

## Test Quality Criteria

### Boundary and Error Case Coverage
Include boundary values and error cases alongside happy paths.

### Literal Expected Values
Use expected values that are independent of the implementation calculation: state the contract's value directly as a literal, or take it from a separate authoritative fixture or specification. An expectation computed from the same constants or formula as the subject passes even when both are wrong. When a mock supplies the input, the expected value differs from the mock's return value wherever the implementation transforms it.

### Result-Based Verification
Verify results, not invocation order or count.

### Meaningful Assertions
Each test asserts the property its consumer depends on and the state the operation established, not merely that a value came back.

### Capability Probe Postconditions
A probe that checks whether something works passes only when it uses the consumer's boundary and asserts the exact property the consumer needs.

Command exit status, successful import, and object existence show the thing is reachable, so treat them as the probe's preconditions and put the consumer-facing property in the assertion.

| Probe intent | Setup evidence (insufficient alone) | Assert instead |
|---|---|---|
| The module is usable | `import` resolves, `expect(mod).toBeDefined()` | Call the exported function through the consumer's entry point and assert its returned value or effect |
| The command works | Exit code 0 | The output, file, or state change the caller consumes |
| The config is applied | The config file parses | The observable behavior the config is supposed to change |
| The migration ran | The command reported success | A query through the real engine returns the migrated shape |

### Mock Scope Decision
Use real implementations for every in-process component whose coordination is under test. Substitute a direct external I/O dependency when the test targets higher-layer behavior; use the real engine or a production-equivalent test instance when the external adapter, query, migration, or service contract itself is the target. When substituting, still assert the request the subject sends and the response shape it accepts, so the boundary contract stays verified.

### Property-based Testing (fast-check)
Use fast-check in `fc.assert(fc.property(...))` form when a Design Doc AC carries a Property annotation.

## Mock Type Safety Enforcement

Type a mock to the surface the subject under test actually consumes — `Pick<T, 'usedMethod'>` — rather than the full interface, so an unused method changing shape does not break the test and a consumed one does. Constrain mock object literals with `satisfies` against that picked type so an extra or misnamed property fails at compile time.

## Data Layer Testing

### What Mocks Cannot Verify

Mocks validate call patterns, so these data-layer properties pass through undetected under mock-only testing:
- Schema mismatches (table names, column names, data types)
- Query correctness (joins, filters, aggregations, grouping)
- Database constraints (NOT NULL, UNIQUE, foreign keys)
- Migration compatibility (schema changes that leave code out of sync)

**Routing rule**: when one of these properties is the target — including the repository or data-access implementation itself — verify against a real engine per the ladder below. When data access is a dependency rather than the subject, mocks are correct: business logic receiving data (mock the repository, test the service), error-handling paths (connection failures, timeouts), and unit tests where the data layer is not under test.

### Real Database Testing (Environment-Dependent)

Options for verifying data layer correctness against a real database engine:
- **Containerized databases** for CI environments
- **In-memory databases** for fast feedback (note: dialect differences may mask issues)
- **Dedicated test databases** with seed data

Select the first option that matches repository evidence:
1. Use the CI-configured database harness when present.
2. Otherwise use the same database engine in a container when container execution is available.
3. Use an in-memory database only when the verified behavior is dialect-independent; record the dialect behavior left unproven.
4. Use a dedicated test database when the repository already provisions and isolates one.

When none is available and data-layer correctness is the target, stop and report the missing environment prerequisite. A mock-only result is not evidence of query, schema, constraint, or migration correctness.

### AI-Generated Code and Schema Awareness

Generated data-access code can be syntactically correct while referencing schema elements that do not exist, and mock-based tests pass either way. Design Docs therefore carry explicit schema references, so review can cross-check documented schema against the data-access code.

