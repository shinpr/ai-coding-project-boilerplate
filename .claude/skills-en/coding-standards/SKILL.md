---
name: coding-standards
description: Detects code smells, anti-patterns, and readability issues. Use when implementing features, reviewing code, or refactoring.
---

# Universal Coding Standards

## Basic Principles

Inspect until the evidence identifies the lowest-total-complexity solution that delivers the required user, operator, or maintainer value while keeping the system correct and maintainable.

- **Final State over Effort** - Minimize the complexity and size of what remains after the change — code, tests, concepts, and what a later change must know — not the work spent reaching it. The product keeps changing after this session and a future agent maintains whatever is left, so take on the larger change now when it leaves less behind. Do not choose a route because it needs fewer steps, edits, or tokens; effort only breaks a tie between results of equal final complexity.
- **Current-Requirement Code Only** - Introduce code paths, capabilities, infrastructure, abstractions, or speculative edge-case handling when a current requirement, verified constraint, or evidence-backed material risk requires them (YAGNI)
- **Sourced Values** - Take each behavior-setting value, such as a limit, timeout, or threshold, from an existing requirement, contract, measurement, or repository value for the same purpose; when none of these determines it, mark the value as assumed in a comment
- **Design Convergence** - Deliver the current required outcome with the least design surface in the final code. Before introducing persistent state, a public or cross-boundary contract, a behavioral mode, a reusable abstraction, or a component split, record what the existing capabilities already deliver, what they fail to deliver for the current outcome, and why the addition is the smallest thing that closes that gap
- **Structure for Local Edits** - The next change here will be made by an agent that reads only the code around it, so what a change must agree with belongs where that agent cannot miss it: a single definition, a type, an exhaustive branch, or a check that fails. For the code a change adds or extends, shape state so only valid combinations can be expressed, advance each state through its existing owner, and when a compiler, type, or lint check fails on the new code, change the structure so the check passes, suppressing it only when no such change exists

Judge total complexity across every activated surface: user decisions, settings, modes, concepts, outputs, persistent state, and implementation paths, together with their UX, runtime, testing, documentation, and maintenance cost. Compare only dimensions that differ between viable approaches. Prefer reuse or no new mechanism when it delivers the same required value and proof at lower total complexity.

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
- Facts that several places in this repository must agree on: names, keys, paths, closed sets of values, and data shapes one side writes and another reads

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

### Pattern 1: Symptom Fixes
**Symptom**: Fixing one error or finding causes new ones, or the same defect returns through another path
**Cause**: Each symptom is repaired where it appeared, leaving what produced it in place
**Avoidance**: Trace the failures or findings in hand to what produces them; findings with one cause are corrected once at that cause, so no other path can produce them again

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
- Existing code the change connects to or resembles has a problem, such as a fact written in two places, a state it can express but must not, or a shape the new case has to work around -> Revise it in this change when the revision leaves this change's final state simpler to maintain, keeping the outcome, requirements, and non-goals unchanged: a change built around the problem keeps both the problem and the workaround. Create an ADR when the revision requires an architectural decision
- No similar functionality exists -> Implement new functionality following existing design philosophy
- Record every decision and its rationale in the artifact the current workflow assigns to it

## Debugging Techniques

### 5 Whys - Root Cause Analysis
Trace each answer to observed evidence until reaching a cause whose correction prevents the original failure. Record each question, evidence, and the final causal link; stop when the next answer would be speculation and name the evidence needed.

## Type Safety Fundamentals

**Type Safety Principle**: Base type narrowing on runtime checks or an established contract. A type guard must guarantee only what its checks establish.

- Use `unknown` for input whose structure is not established, and validate the properties needed by the consumer.
- Use generics, unions, or intersections to express type relationships and variants.
- When code branches on the same closed set of values in more than one place, type the set as a union of literals and handle each member explicitly, ending with a `never` check, so adding a member fails type checking at every branch.
- Place assertions based on verified SDK or framework contracts at the relevant boundary. When static analysis cannot express that contract, scope any suppression to the affected rule and document the contract evidence and the assertion's scope.

**Type Complexity Review Signals**

Use these as review prompts, not pass/fail thresholds. Existing project conventions and the type's responsibility take precedence.

- Field count above 20: review whether the type mixes responsibilities
- Optional fields above 30%: review whether required and optional shapes should separate
- Nesting beyond 3 levels: review flattening
- **External API Types**: Represent the actual external shape and convert at the application boundary

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
