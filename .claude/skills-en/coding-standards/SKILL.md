---
name: coding-standards
description: Detects code smells, anti-patterns, and readability issues. Use when implementing features, reviewing code, or refactoring.
---

# Universal Coding Standards

## Technical Anti-patterns (Red Flag Patterns)

When any pattern below is detected, pause implementation and record: the triggered pattern, affected current requirement, smallest compliant alternative, and verification needed to resume. Resume when the alternative removes the pattern or a documented requirement justifies retaining it.

### Code Quality Anti-patterns
1. **Writing similar code 3 or more times** - Violates Rule of Three
2. **Multiple responsibilities mixed in a single file** - Violates Single Responsibility Principle (SRP)
3. **Defining same content in multiple files** - Violates DRY principle
4. **Making changes without checking dependencies** - Potential for unexpected impacts
5. **Disabling code with comments** - Should use version control
6. **Error suppression** - Hiding problems creates technical debt
7. **Excessive use of type assertions (as)** - Abandoning type safety

### Design Anti-patterns
- **"Make it work for now" thinking** - Accumulation of technical debt
- **Patchwork implementation** - Unplanned additions to existing code
- **Optimistic implementation of uncertain technology** - Designing unknown elements assuming "it'll probably work"
- **Symptomatic fixes** - Surface-level fixes that don't solve root causes
- **Unplanned large-scale changes** - Lack of incremental approach

## Basic Principles

Explore broadly, then converge on the lowest-lifecycle-cost solution that delivers the required user, operator, or maintainer value while keeping the system correct and maintainable.

- **Evidence-Bounded Refactoring** - Refactor code that blocks the current outcome, is changed by the current task, or fails an applicable quality check; use small behavior-preserving steps. Report other findings with evidence for a scope decision
- **Current-Requirement Code Only** - Introduce code paths, capabilities, infrastructure, abstractions, or speculative edge-case handling when a current requirement, verified constraint, or evidence-backed material risk requires them (YAGNI)
- **Design Convergence** - Deliver the current required outcome with the least new design surface. Apply the implementation-approach skill's Phase 2 when selecting persistent state, public or cross-boundary contracts, behavioral modes, reusable abstractions, or component splits

## Comment Writing Rules

- **Code first**: Names, types, and structure are the primary medium; add a comment only when it carries what the code cannot express. When in doubt, improve the name instead of commenting
- **Comment the "why", not the "what"**: Explain reasoning, trade-offs, constraints/edge cases, or public API contracts
- **Timeless Content**: Comments contain current reasoning, constraints, edge cases, or API contracts; version control retains development history
- **Timeless**: Write only content that remains valid whenever read
- **Conciseness**: Keep explanations to necessary minimum

## Error Handling Fundamentals

### Fail-Fast Principle
Fail quickly on errors to prevent processing continuation in invalid states. Propagate the failure or return an explicit typed error with the original diagnostic context.

For detailed implementation methods (Result type, custom error classes, layered error handling, etc.), refer to language and framework-specific rules.

## Rule of Three - Criteria for Code Duplication

How to handle duplicate code based on Martin Fowler's "Refactoring":

| Duplication Count | Action | Reason |
|-------------------|--------|--------|
| 1st time | Inline implementation | Cannot predict future changes |
| 2nd time | Consider future consolidation | Pattern beginning to emerge |
| 3rd time | Implement commonalization | Pattern established |

### Criteria for Commonalization

**Cases for Commonalization**
- Business logic duplication
- Complex processing algorithms
- Areas likely requiring bulk changes
- Validation rules

**Cases to Keep Separate**
- Accidental matches (coincidentally same code)
- Possibility of evolving in different directions
- Significant readability decrease from commonalization
- Simple helpers in test code

## Reference Representativeness

**Failure mode**: Adopting patterns or dependency versions from the nearest 2-3 files without verifying repository-wide usage leads to outdated patterns, version mismatches, and architecture inconsistency.

### Verifying References Before Adoption
When adopting patterns, APIs, or dependencies from existing code:
- **IF** referencing only 2-3 nearby files → **THEN** Grep the pattern across the repository; adopt only when ≥3 files across different directories use the same pattern
- **IF** Grep returns 1-2 files outside the reference → **THEN** investigate whether those files are the canonical implementation or legacy outliers before adopting
- **IF** Grep returns 0 files outside the reference → **THEN** treat the pattern as local convention; adopt only with explicit justification (e.g., consistency with surrounding code, avoiding breaking changes)
- **IF** multiple approaches coexist in the repository → **THEN** identify the majority pattern (highest file count) and adopt it; state the reason when choosing a minority pattern
- **IF** adopting an external dependency (library, plugin, SDK) → **THEN** verify repository-wide usage distribution for the same dependency; if its compatible version cannot be resolved from manifests, lockfiles, and existing consumers, escalate
- **IF** following an existing pattern → **THEN** state the reason for following it when an alternative exists (e.g., consistency with surrounding code, avoiding breaking changes, pending coordinated update)

### Principle
Nearby code is a starting point for investigation. Verify repository-wide usage (≥3 files across different directories) before adopting a pattern as representative.

## Common Failure Patterns and Avoidance Methods

### Pattern 1: Error Fix Chain
**Symptom**: Fixing one error causes new errors
**Cause**: Surface-level fixes without understanding root cause
**Avoidance**: Identify root cause with 5 Whys before fixing

### Pattern 2: Abandoning Type Safety
**Symptom**: Excessive use of any type or as
**Cause**: Impulse to avoid type errors
**Avoidance**: Handle safely with unknown type and type guards

### Pattern 3: Implementation Without Sufficient Testing
**Symptom**: Many bugs after implementation
**Cause**: Ignoring Red-Green-Refactor process
**Prevention**: Start behavior changes with a failing test that demonstrates the required outcome

### Pattern 4: Ignoring Technical Uncertainty
**Symptom**: Frequent unexpected errors when introducing new technology
**Cause**: Assuming "it should work according to official documentation" without prior investigation
**Avoidance**:
- Record certainty evaluation at the beginning of task files
- Treat certainty as low when repository evidence, a version-matched primary source, or a runnable local check cannot confirm an outcome-relevant behavior; create the smallest verification that resolves that behavior before implementation

### Pattern 5: Insufficient Existing Code Investigation
**Symptom**: Duplicate implementations, architecture inconsistency, integration failures, adopting outdated patterns
**Cause**: Insufficient understanding of existing code before implementation; referencing only nearby files without verifying representativeness
**Avoidance Methods**:
- Before implementation, search for similar functionality using domain, responsibility, and configuration-pattern keywords
- Similar functionality found -> Use or extend that implementation when it satisfies the current contract
- Similar functionality is technical debt -> Repair it when it blocks the current outcome, was caused by the current change, or lies in confirmed scope; otherwise report it separately. Create an ADR when the repair requires an architectural decision
- No similar functionality exists -> Implement new functionality following existing design philosophy
- Record all decisions and rationale in "Existing Codebase Analysis" section of Design Doc
- **Reference representativeness check**: See "Reference Representativeness" section above for IF-THEN thresholds

## Debugging Techniques

### 1. Error Analysis Procedure
1. Read error message (first line) accurately
2. Focus on first and last of stack trace
3. Identify first line where your code appears

### 2. 5 Whys - Root Cause Analysis
Trace each answer to observed evidence until reaching a cause whose correction prevents the original failure. Record each question, evidence, and the final causal link; stop when the next answer would be speculation and name the evidence needed.

### 3. Minimal Reproduction Code
To isolate problems, attempt reproduction with minimal code:
- Remove unrelated parts
- Replace external dependencies with mocks
- Create minimal configuration that reproduces problem

## Type Safety Fundamentals

**Type Safety Principle**: Use `unknown` type with type guards. `any` type disables type checking and causes runtime errors.

**any Type Alternatives (Priority Order)**
1. **unknown Type + Type Guards**: Use for validating external input
2. **Generics**: When type flexibility is needed
3. **Union Types/Intersection Types**: Combinations of multiple types
4. **Type Assertions (Last Resort)**: Only when type is certain

**Type Guard Implementation Pattern**
```typescript
function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'id' in value && 'name' in value
}
```

**Type Complexity Management**
- Field Count: Up to 20 (split by responsibility if exceeded, external API types are exceptions)
- Optional Ratio: Up to 30% (separate required/optional if exceeded)
- Nesting Depth: Up to 3 levels (flatten if exceeded)
- Type Assertions: Review design if used 3+ times
- **External API Types**: Relax constraints and define according to reality (convert appropriately internally)

## Refactoring Techniques

**Basic Policy**
- Small Steps: Keep the nearest applicable tests and static checks passing after each behavior-preserving refactor
- Safe Changes: Change one refactoring responsibility at a time and verify its observable behavior before the next responsibility
- Behavior Guarantee: Ensure existing behavior remains unchanged while proceeding

**Implementation Procedure**: Understand Current State -> Gradual Changes -> Behavior Verification -> Final Validation

**Priority**: Duplicate Code Removal > Large Function Division > Complex Conditional Branch Simplification > Type Safety Improvement

## Implementation Completeness Assurance

### Required Procedure for Impact Analysis

**Completion Criteria**: Complete all 3 stages

#### 1. Discovery
```bash
Grep -n "TargetClass\|TargetMethod" -o content
Grep -n "DependencyClass" -o content
Grep -n "targetData\|SetData\|UpdateData" -o content
```

#### 2. Understanding
**Mandatory**: Read all discovered files and include necessary parts in context:
- Caller's purpose and context
- Dependency direction
- Data flow: generation -> modification -> reference

#### 3. Identification
Structured impact report (mandatory):
```
## Impact Analysis
### Direct Impact: ClassA, ClassB (with reasons)
### Indirect Impact: SystemX, ComponentY (with integration paths)
### Processing Flow: Input -> Process1 -> Process2 -> Output
```

**Completion gate**: Discovery, Understanding, and Identification must all contain the required evidence before implementation begins.

### Unused Code Deletion Rule

When unused code is detected, ask whether a current requirement and reachable call path use it before task completion.
- Yes -> connect it to that call path and verify the requirement
- No -> remove it; version control retains the prior implementation

Target: Code, documentation, configuration files

## Red-Green-Refactor Process (Test-First Development)

**Recommended Principle**: Start behavior changes with a test that fails for the required reason

**Development Steps**:
1. **Red**: Write test for expected behavior (it fails)
2. **Green**: Pass test with minimal implementation
3. **Refactor**: Improve code while maintaining passing tests

**Direct-verification cases**:
- Pure configuration file changes (.env, config, etc.)
- Documentation-only updates (README, comments, etc.)
- Emergency production incident response (post-incident tests mandatory)

## Test Design Principles

### Test Case Structure
- Tests consist of three stages: "Arrange," "Act," "Assert"
- Test names state the trigger and observable result
- One test case verifies only one behavior

### Test Data Management
- Manage test data in dedicated directories
- Define test-specific environment variable values
- Use synthetic, non-sensitive values for credentials, tokens, personal data, and payment data in tests
- Keep test data minimal, using only data directly related to test case verification purposes

### Mock and Stub Usage Policy

**Recommended: Mock external dependencies in unit tests**
- Merit: Ensures test independence and reproducibility
- Practice: Mock DB, API, file system, and other external dependencies

**Unit-test boundary**: Use deterministic substitutes for external connections; exercise real external boundaries in integration or E2E tests selected for that contract

### Test Failure Response Decision Criteria

**Fix tests**: Wrong expected values, references to non-existent features, dependence on implementation details, implementation only for tests
**Fix implementation**: Valid specifications, business logic, important edge cases
**When in doubt**: Confirm with user

## Test Granularity Principles

### Core Principle: Observable Behavior Only
**Test through observable boundaries**: Public APIs, return values, exceptions, external calls, and persisted state. Reach private methods, internal state, and algorithm details only through those observable boundaries.

## Security Principles

### Secure Defaults
- Store credentials and secrets through environment variables or dedicated secret managers
- Use parameterized queries (prepared statements) for all database access
- Use established cryptographic libraries provided by the language or framework
- Generate security-critical values (tokens, IDs, nonces) with cryptographically secure random generators
- Encrypt sensitive data at rest and in transit using standard protocols

### Input and Output Boundaries
- Validate all external input at system entry points for expected format, type, and length
- Encode output appropriately for its rendering context (HTML, SQL, shell, URL)
- Return only information necessary for the caller in error responses; log detailed diagnostics server-side

### Access Control
- Apply authentication to all entry points that handle user data or trigger state changes
- Verify authorization for each resource access, not only at the entry point
- Grant only the permissions required for the operation (files, database connections, API scopes)

### Knowledge Cutoff Supplement (2026-03)
- OWASP Top 10:2025 shifted from symptoms to root causes; added "Software Supply Chain Failures" (A03) and "Mishandling of Exceptional Conditions" (A10)
- Recent research indicates AI-generated code shows elevated rates of access control gaps — treat authentication and authorization as high-priority review targets
- OpenSSF published "Security-Focused Guide for AI Code Assistant Instructions" — recommends language-specific, actionable constraints over generic advice
- For detailed detection patterns, see `references/security-checks.md`
