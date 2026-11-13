---
name: coding-standards
description: Detects code smells, anti-patterns, and readability issues. Use when implementing features, reviewing code, or refactoring.
---

# Universal Coding Standards

## Technical Anti-patterns (Red Flag Patterns)

When any pattern below is detected, pause implementation and record: the triggered pattern, affected current requirement, smallest compliant alternative, and verification needed to resume. Resume when the alternative removes the pattern or a documented requirement justifies retaining it.

### Code Quality Anti-patterns
1. **Duplicating one responsibility across independently maintained locations** - Review whether the duplicated logic has one change reason and should have one owner
2. **Multiple responsibilities mixed in a single file** - Violates Single Responsibility Principle (SRP)
3. **Defining same content in multiple files** - Violates DRY principle
4. **Making changes without checking dependencies** - Potential for unexpected impacts
5. **Disabling code with comments** - Should use version control
6. **Error suppression** - Hiding problems creates technical debt
7. **Type assertions standing in for a guarantee** - Declaring a type that neither a runtime check nor an existing contract establishes

### Design Anti-patterns
- **"Make it work for now" thinking** - Accumulation of technical debt
- **Patchwork implementation** - Unplanned additions to existing code
- **Symptomatic fixes** - Surface-level fixes that don't solve root causes
- **Unplanned large-scale changes** - Lack of incremental approach

## Basic Principles

Inspect until the evidence identifies the lowest-total-complexity solution that delivers the required user, operator, or maintainer value while keeping the system correct and maintainable.

- **Evidence-Bounded Refactoring** - Refactor code that blocks the current outcome, is changed by the current task, or fails an applicable quality check; use small behavior-preserving steps. Report other findings with their owning boundary and evidence without expanding the active change
- **Current-Requirement Code Only** - Introduce code paths, capabilities, infrastructure, abstractions, or speculative edge-case handling when a current requirement, verified constraint, or evidence-backed material risk requires them (YAGNI)
- **Design Convergence** - Deliver the current required outcome with the least new design surface. Before introducing persistent state, a public or cross-boundary contract, a behavioral mode, a reusable abstraction, or a component split, record what the existing capabilities already deliver, what they fail to deliver for the current outcome, and why the addition is the smallest thing that closes that gap

Judge total complexity across every activated surface: user decisions, settings, modes, concepts, outputs, persistent state, and implementation paths, together with their UX, runtime, implementation, testing, documentation, and maintenance cost. Compare only dimensions that differ between viable approaches. Prefer reuse or no new mechanism when it delivers the same required value and proof at lower total complexity.

## Comment Writing Rules

- **Code first**: Names, types, and structure are the primary medium; add a comment only when it carries what the code cannot express. When in doubt, improve the name instead of commenting
- **Comment the "why", not the "what"**: Explain reasoning, trade-offs, constraints/edge cases, or public API contracts
- **Timeless Content**: Comments contain current reasoning, constraints, edge cases, or API contracts, stated in the comment itself rather than by reference to a document or its section, which drifts as that document changes; version control retains development history
- **Timeless**: Write only content that remains valid whenever read
- **Conciseness**: Keep explanations to necessary minimum

## Error Handling Fundamentals

### Fail-Fast Principle
Fail quickly on errors to prevent processing continuation in invalid states. Propagate the failure or return an explicit typed error with the original diagnostic context.

For detailed implementation methods (Result type, custom error classes, layered error handling, etc.), refer to language and framework-specific rules.

## Criteria for Code Duplication

Keep concrete implementations separate while their apparent similarity is accidental or their change reasons differ. Consolidate when repository evidence shows the same business rule, algorithm, validation contract, or coordinated change responsibility is maintained in multiple places.

### Criteria for Commonalization

**Cases for Commonalization**
- Business logic duplication
- Complex processing algorithms
- Areas likely requiring bulk changes
- Validation rules

**Cases to Keep Separate**
- Accidental matches (coincidentally same code)
- Contracts or change reasons that evidence shows differ
- Significant readability decrease from commonalization
- Simple helpers in test code

## Change Boundary and Reference Representativeness

Prompt paths are investigation starting points. Include another repository file when evidence shows that it implements the accepted outcome, is a required dependency or wiring path, or must change to preserve a contract affected by the work. Callers, consumers, tests, configuration, imports, and data flow are useful evidence rather than a required checklist.

Existing code relates to a change in two ways. Code that depends on it is reached through references to the changed code. Code that already holds the same responsibility may share no name or reference with it; reach it through position and role (sibling features, files with the same role in the same layer, shared layers) and through the input it takes and the purpose it serves, then compare their logic to judge whether the responsibility is the same. Stop when the candidates that could change implementation or proof have been read and judged; a search with no match shows only that the search found nothing.

When adopting a pattern, API, or dependency, inspect the relevant feature and repository uses that share its responsibility and current contract. Prefer the compatible implementation in that responsibility. Frequency helps locate candidates but does not make a pattern authoritative; when approaches coexist, use their callers, lifecycle, and compatibility to distinguish the current pattern from a legacy or unrelated one.

Resolve external dependency versions from manifests, lockfiles, and compatible consumers. Escalate only when those sources cannot resolve a choice that changes compatibility or architecture.

## Common Failure Patterns and Avoidance Methods

### Pattern 1: Error Fix Chain
**Symptom**: Fixing one error causes new errors
**Cause**: Surface-level fixes without understanding root cause
**Avoidance**: Identify root cause with 5 Whys before fixing

### Pattern 2: Circumventing Type Guarantees
**Symptom**: `any` or `as` declares a type that no check or contract establishes
**Cause**: Impulse to avoid type errors
**Avoidance**: Apply the evidence criteria in Type Safety Fundamentals.

### Pattern 3: Implementation Without Sufficient Testing
**Symptom**: Many bugs after implementation
**Cause**: Accepted behavior left without a test that proves it
**Avoidance**: Prove each delivered behavior at the boundary where it is observed

### Pattern 4: Building on Unverified Premises
**Symptom**: Dependent work fails, or workarounds accumulate, once an assumed premise proves false
**Cause**: Treating an assumed capability, behavior, or existing implementation as fact
**Avoidance**: When an unverified premise could invalidate the chosen approach, check it by the cheapest sufficient means before building dependent work on it. When results contradict the premise, reconsider the approach before patching its parts. Keep this reasoning in the active task; it needs no separate artifact.

### Pattern 5: Insufficient Existing Code Investigation
**Symptom**: Duplicate implementations, architecture inconsistency, integration failures, adopting outdated patterns
**Cause**: Insufficient understanding of existing code before implementation; referencing only nearby files without verifying representativeness
**Avoidance Methods**:
- Before implementation, find functionality that already holds the same responsibility and the code that depends on the change, as Change Boundary and Reference Representativeness describes; similar functionality may share no name with the new code
- Similar functionality found -> Use or extend that implementation when it satisfies the current contract
- Similar functionality is technical debt -> Repair it when it blocks the current outcome, was caused by the current change, or lies in scope; otherwise report it separately. Create an ADR when the repair requires an architectural decision
- No similar functionality exists -> Implement new functionality following existing design philosophy
- Record every decision and its rationale in the artifact the current workflow assigns to it

## Debugging Techniques

### 5 Whys - Root Cause Analysis
Trace each answer to observed evidence until reaching a cause whose correction prevents the original failure. Record each question, evidence, and the final causal link; stop when the next answer would be speculation and name the evidence needed.

## Type Safety Fundamentals

**Type Safety Principle**: Base type narrowing on runtime checks or an established contract. A type guard must guarantee only what its checks establish.

- Use `unknown` for input whose structure is not established, and validate the properties needed by the consumer.
- Use generics, unions, or intersections to express type relationships and variants.
- Place assertions based on verified SDK or framework contracts at the relevant boundary. When static analysis cannot express that contract, scope any suppression to the affected rule and document the contract evidence and the assertion's scope.

**Type Complexity Review Signals**

Use these as review prompts, not pass/fail thresholds. Existing project conventions and the type's responsibility take precedence.

- Field count above 20: review whether the type mixes responsibilities
- Optional fields above 30%: review whether required and optional shapes should separate
- Nesting beyond 3 levels: review flattening
- **External API Types**: Represent the actual external shape and convert at the application boundary

## Refactoring Techniques

**Basic Policy**
- Small Steps: Keep the nearest applicable tests and static checks passing after each behavior-preserving refactor
- Safe Changes: Change one refactoring responsibility at a time and verify its observable behavior before the next responsibility
- Behavior Guarantee: Ensure existing behavior remains unchanged while proceeding

**Implementation Procedure**: Understand Current State -> Gradual Changes -> Behavior Verification -> Final Validation

**Priority**: Duplicate Code Removal > Large Function Division > Complex Conditional Branch Simplification > Type Safety Improvement

## Implementation Completeness Assurance

### Impact Tracing

Before implementation, trace callers, dependencies, and data flow (generation -> modification -> reference) of the changed code until the files that could change the change boundary defined in Change Boundary and Reference Representativeness have been checked. Carry the direct and indirect impact that the implementation or its verification relies on into that work.

### Unused Code Deletion Rule

When the current change makes code, documentation, or configuration obsolete:
- Delete it in the same change once its callers and generated or operational uses are checked; version control retains the prior implementation
- Preserve and report it when obsolescence is uncertain or deletion would expand beyond the accepted outcome
- Keep unrelated dormant code outside the implementation scope

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
**Both readings remain compatible with the available requirements**: Return the unresolved behavior decision — state the two candidate behaviors, the source that would settle which is correct, and the condition for stopping rather than picking one

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
