# AI Developer Guide - Technical Decision Criteria and Anti-pattern Collection

This document compiles technical decision criteria, anti-patterns, debugging techniques, and quality check commands that LLMs (you) should reference during implementation. This document focuses purely on technical guidance.

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
// ❌ Bad example: Immediate commonalization on 1st duplication
function validateUserEmail(email: string) { /* ... */ }
function validateContactEmail(email: string) { /* ... */ }
// → Premature abstraction

// ✅ Good example: Commonalize on 3rd occurrence
// 1st time: inline implementation
// 2nd time: Copy but consider future
// 3rd time: Extract to common validator
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
```bash
# How to read stack traces
1. Read error message (first line) accurately
2. Focus on first and last of stack trace
3. Identify first line where your code appears
```

### 2. 5 Whys - Root Cause Analysis
```
Symptom: TypeScript build error
Why1: Type definitions don't match → Why2: Interface was updated
Why3: Dependency change → Why4: Package update impact
Why5: Major version upgrade with breaking changes
Root cause: Inappropriate version specification in package.json
```

### 3. Minimal Reproduction Code
To isolate problems, attempt reproduction with minimal code:
- Remove unrelated parts
- Replace external dependencies with mocks
- Create minimal configuration that reproduces problem

### 4. Debug Log Output
```typescript
// Track problems with structured logs
console.log('DEBUG:', {
  context: 'user-creation',
  input: { email, name },
  state: currentState,
  timestamp: new Date().toISOString()
})
```

## Quality Check Command Reference

### Phase 1-3: Basic Checks
```bash
# Biome comprehensive check (lint + format)
npm run check

# Detect unused exports
npm run check:unused

# TypeScript build
npm run build
```

### Phase 4-6: Tests and Final Confirmation
```bash
# Test execution
npm test

# Coverage measurement (clear cache)
npm run test:coverage:fresh

# Overall integrated check
npm run check:all
```

### Auxiliary Commands
```bash
# Check coverage report
open coverage/index.html

# Vitest process cleanup (mandatory after tests)
npm run cleanup:processes

# Safe test execution (with auto cleanup)
npm run test:safe

# Auto fixes
npm run format        # Format fixes
npm run lint:fix      # Lint fixes
```

### Troubleshooting
- **Port in use error**: `npm run cleanup:processes`
- **Cache issues**: `npm run test:coverage:fresh`
- **Dependency errors**: Reinstall with `npm ci`

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