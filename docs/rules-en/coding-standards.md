# Universal Coding Standards

## Technical Anti-patterns (Red Flag Patterns)

Immediately stop and reconsider design when detecting the following patterns:

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

✅ **Aggressive Refactoring** - Prevent technical debt and maintain health
❌ **Unused "Just in Case" Code** - Violates YAGNI principle (Kent Beck)

## Comment Writing Rules

- **Function Description Focus**: Describe what the code "does"
- **No Historical Information**: Do not record development history
- **Timeless**: Write only content that remains valid whenever read
- **Conciseness**: Keep explanations to necessary minimum

## Fallback Design Principles

### Core Principle: Fail-Fast
Design philosophy that prioritizes improving primary code reliability over fallback implementations in distributed systems.

### Criteria for Fallback Implementation
- **Default Prohibition**: Do not implement unconditional fallbacks on errors
- **Exception Approval**: Implement only when explicitly defined in Design Doc
- **Layer Responsibilities**:
  - Infrastructure Layer: Always throw errors upward (no fallback decisions)
  - Application Layer: Implement decisions based on business requirements

### Detection of Excessive Fallbacks
- Require design review when writing the 3rd catch statement in the same feature
- Verify Design Doc definition before implementing fallbacks
- Properly log errors and make failures explicit

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

**Cases to Avoid Commonalization**
- Accidental matches (coincidentally same code)
- Possibility of evolving in different directions
- Significant readability decrease from commonalization
- Simple helpers in test code

### Implementation Example
```typescript
// ❌ Immediate commonalization on 1st duplication
function validateUserEmail(email: string) { /* ... */ }
function validateContactEmail(email: string) { /* ... */ }

// ✅ Commonalize on 3rd occurrence
function validateEmail(email: string, context: 'user' | 'contact' | 'admin') { /* ... */ }
```

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
**Avoidance**: Always start with failing tests

### Pattern 4: Ignoring Technical Uncertainty
**Symptom**: Frequent unexpected errors when introducing new technology
**Cause**: Assuming "it should work according to official documentation" without prior investigation
**Avoidance**:
- Record certainty evaluation at the beginning of task files
  ```
  Certainty: low (Reason: no examples of MCP connection found)
  Exploratory implementation: true
  Fallback: use conventional API
  ```
- For low certainty cases, create minimal verification code first

### Pattern 5: Insufficient Existing Code Investigation
**Symptom**: Duplicate implementations, architecture inconsistency, integration failures
**Cause**: Insufficient understanding of existing code before implementation
**Avoidance Methods**:
- Before implementation, always search for similar functionality (using domain, responsibility, configuration patterns as keywords)
- Similar functionality found → Use that implementation (do not create new implementation)
- Similar functionality is technical debt → Create ADR improvement proposal before implementation
- No similar functionality exists → Implement new functionality following existing design philosophy
- Record all decisions and rationale in "Existing Codebase Analysis" section of Design Doc

## Debugging Techniques

### 1. Error Analysis Procedure
1. Read error message (first line) accurately
2. Focus on first and last of stack trace
3. Identify first line where your code appears

### 2. 5 Whys - Root Cause Analysis
```
Symptom: Build error
Why1: Type definitions don't match → Why2: Interface was updated
Why3: Dependency change → Why4: Package update impact
Why5: Major version upgrade with breaking changes
Root cause: Inappropriate version specification
```

### 3. Minimal Reproduction Code
To isolate problems, attempt reproduction with minimal code:
- Remove unrelated parts
- Replace external dependencies with mocks
- Create minimal configuration that reproduces problem

### 4. Debug Log Output
```typescript
console.log('DEBUG:', {
  context: 'operation-name',
  input: { /* relevant data */ },
  state: currentState,
  timestamp: new Date().toISOString()
})
```

## Type Safety Fundamentals

**Absolute Rule**: `any` type is completely prohibited. It disables type checking and becomes a source of runtime errors.

**any Type Alternatives (Priority Order)**
1. **unknown Type + Type Guards**: Use for validating external input
2. **Generics**: When type flexibility is needed
3. **Union Types・Intersection Types**: Combinations of multiple types
4. **Type Assertions (Last Resort)**: Only when type is certain

**Type Guard Implementation Pattern**
```typescript
function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'id' in value && 'name' in value
}
```

**Modern Type Features**
- **satisfies Operator**: `const config = { port: 3000 } satisfies Config` - Preserves inference
- **const Assertion**: `const ROUTES = { HOME: '/' } as const satisfies Routes` - Immutable and type-safe
- **Branded Types**: `type UserId = string & { __brand: 'UserId' }` - Distinguish meaning
- **Template Literal Types**: `type Endpoint = \`\${HttpMethod} \${Route}\`` - Express string patterns with types

**Type Complexity Management**
- Field Count: Up to 20 (split by responsibility if exceeded, external API types are exceptions)
- Optional Ratio: Up to 30% (separate required/optional if exceeded)
- Nesting Depth: Up to 3 levels (flatten if exceeded)
- Type Assertions: Review design if used 3+ times
- **External API Types**: Relax constraints and define according to reality (convert appropriately internally)

## Refactoring Techniques

**Basic Policy**
- Small Steps: Maintain always-working state through gradual improvements
- Safe Changes: Minimize the scope of changes at once
- Behavior Guarantee: Ensure existing behavior remains unchanged while proceeding

**Implementation Procedure**: Understand Current State → Gradual Changes → Behavior Verification → Final Validation

**Priority**: Duplicate Code Removal > Large Function Division > Complex Conditional Branch Simplification > Type Safety Improvement

## Situations Requiring Technical Decisions

### Timing of Abstraction
- Extract patterns after writing concrete implementation 3 times
- Be conscious of YAGNI, implement only currently needed features
- Prioritize current simplicity over future extensibility

### Performance vs Readability
- Prioritize readability unless clear bottleneck exists
- Measure before optimizing (don't guess, measure)
- Document reason with comments when optimizing

### Granularity of Type Definitions
- Overly detailed types reduce maintainability
- Design types that appropriately express domain
- Use utility types to reduce duplication

## Continuous Improvement Mindset

- **Humility**: Perfect code doesn't exist, welcome feedback
- **Courage**: Execute necessary refactoring boldly
- **Transparency**: Clearly document technical decision reasoning

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
- Data flow: generation → modification → reference

#### 3. Identification
Structured impact report (mandatory):
```
## Impact Analysis
### Direct Impact: ClassA, ClassB (with reasons)
### Indirect Impact: SystemX, ComponentY (with integration paths)
### Processing Flow: Input → Process1 → Process2 → Output
```

**Important**: Do not stop at search; execute all 3 stages

### Unused Code Deletion Rule

When unused code is detected → Will it be used?
- Yes → Implement immediately (no deferral allowed)
- No → Delete immediately (remains in Git history)

Target: Code, documentation, configuration files

### Existing Code Deletion Decision Flow

```
In use? No → Delete immediately (remains in Git history)
       Yes → Working? No → Delete + Reimplement
                     Yes → Fix
```

## Red-Green-Refactor Process (Test-First Development)

**Recommended Principle**: Always start code changes with tests

**Background**:
- Ensure behavior before changes, prevent regression
- Clarify expected behavior before implementation
- Ensure safety during refactoring

**Development Steps**:
1. **Red**: Write test for expected behavior (it fails)
2. **Green**: Pass test with minimal implementation
3. **Refactor**: Improve code while maintaining passing tests

**NG Cases (Test-first not required)**:
- Pure configuration file changes (.env, config, etc.)
- Documentation-only updates (README, comments, etc.)
- Emergency production incident response (post-incident tests mandatory)

## Test Design Principles

### Test Case Structure
- Tests consist of three stages: "Arrange," "Act," "Assert"
- Clear naming that shows purpose of each test
- One test case verifies only one behavior

### Test Data Management
- Manage test data in dedicated directories
- Define test-specific environment variable values
- Always mock sensitive information
- Keep test data minimal, using only data directly related to test case verification purposes

### Mock and Stub Usage Policy

✅ **Recommended: Mock external dependencies in unit tests**
- Merit: Ensures test independence and reproducibility
- Practice: Mock DB, API, file system, and other external dependencies

❌ **Avoid: Actual external connections in unit tests**
- Reason: Slows test speed and causes environment-dependent problems

### Test Failure Response Decision Criteria

**Fix tests**: Wrong expected values, references to non-existent features, dependence on implementation details, implementation only for tests
**Fix implementation**: Valid specifications, business logic, important edge cases
**When in doubt**: Confirm with user

## Test Helper Utilization Rules

### Basic Principles
Use test helpers to reduce duplication and improve maintainability.

### Decision Criteria
| Mock Characteristics | Response Policy |
|---------------------|-----------------|
| **Simple and stable** | Consolidate in common helpers |
| **Complex or frequently changing** | Individual implementation |
| **Duplicated in 3+ places** | Consider consolidation |
| **Test-specific logic** | Individual implementation |

## Test Granularity Principles

### Core Principle: Observable Behavior Only
**MUST Test**: Public APIs, return values, exceptions, external calls, persisted state
**MUST NOT Test**: Private methods, internal state, algorithm implementation details

```typescript
// ✅ Test observable behavior
expect(calculateTotal(100, 0.1)).toBe(110)

// ❌ Test implementation details
expect((calculator as any).internalState).toBe(someValue)
```

## Continuity Test Scope

Limited to verifying existing feature impact when adding new features. Long-term operations and load testing are infrastructure responsibilities, not test scope.
