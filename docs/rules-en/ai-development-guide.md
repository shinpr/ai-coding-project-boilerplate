# AI Developer Guide - Practical Implementation Guidelines

This document provides a comprehensive checklist, self-diagnosis methods, prohibited practices, and workflow considerations that LLMs (you) should reference during implementation.

## Pre-Implementation Mandatory Checklist

1. **Rule File Loading**: Always read all 6 rule files completely
2. **Staged Document Review**
   - During design: Review only relevant ADRs
   - During implementation: Review only relevant Design Docs
   - When starting work: Check in-progress work plans
   - Implementation without review is prohibited
3. **Task Analysis**: Consider essential purpose, impact scope, and generic solutions
4. **Plan Formulation**: Present implementation plan to user
5. **Test Implementation**: Utilize test helpers (builders, assertions, basic mocks)

## Self-Diagnosis Triggers During Implementation

### Must Stop and Check Timing

**Before Tool Usage**
- Edit/Write/MultiEdit: Confirm user approval
- Read: Check impact scope
- Bash: Understand command impact

**During Work Progress**
- When opening 5+ files: Reconfirm necessity
- After 2+ errors: Perform root cause analysis
- Investigation→Implementation transition: Present plan and confirm approval
- Before commit: Execute quality checks

### Self-Diagnosis Questions

**Implementation Direction**
- Am I deviating from the plan?
- Is the design generic?
- Is the code understandable?

**Quality and Consistency**
- Have I practiced Test-First (Red-Green-Refactor)?
- Am I following existing ADR/Design Docs?
- Have I checked impacts on related files?

## Red Flag Patterns (Situations Requiring Immediate Stop)

✅ **Recommended**: Complete functionality at each step, unknown type + type guards
❌ **Avoid**: "Make it work for now", any type usage

**Stop Patterns**
1. Writing similar code 3+ times (Rule of Three)
2. File exceeding 300 lines
3. Defining same content in multiple files
4. Changing without checking dependencies
5. Disabling code with comments
6. Error suppression
7. Excessive type assertions (as)

## Common Failure Patterns and Avoidance

### Recommended and Avoidable Patterns

✅ **Recommended**: Generic design, root cause resolution (5 Whys), YAGNI principle, document verification

❌ **Avoid**: Patchwork coding, symptomatic treatment, unplanned changes to 6+ files

## Escalation Criteria (Must Confirm with User)

1. **Architecture Changes**: New layers, responsibility changes, data flow changes
2. **External Dependency Addition**: npm packages, external APIs, environment variables
3. **Breaking Changes**: API changes, data structure changes, major naming changes
4. **Difficult Decisions**: Multiple implementation methods, unclear trade-offs, unpredictable risks

**Confirmation Template**: Situation explanation → Options (merits/demerits) → Recommended approach

## Instruction Priority

1. **Highest Priority**: User approval (mandatory before Edit/Write/MultiEdit)
2. **High Priority**: Quality check passing, document consistency
3. **Medium Priority**: Generic design, root cause resolution
4. **Low Priority**: Performance optimization

## Workflow Considerations

### Work Plan Utilization
- **Medium scale (3-5 files)**: Recommended
- **Large scale (6+ files)**: Mandatory
- **Keywords**: Mandatory for instructions containing "refactoring," "consolidation," "optimization"

**Commits**: Logical units, after quality checks, explain "why"

**Testing**: Red-Green-Refactor (exception: configuration files)

### Refactoring Timing
- Immediately after task start (highest priority)
- When discovering same pattern 3 times
- When file exceeds 300 lines

## Debug Flow

1. **Error Analysis**: Check stack trace
2. **5 Whys**: Pursue root cause
3. **Minimal Reproduction**: Isolate problem
4. **Test Verification**: Check related test failures

## Quality Checks (Mandatory on Implementation Completion)

### Quality Check Phases

**Phase 1-3: Basic Checks**
```bash
npm run check          # Biome comprehensive
npm run check:unused   # Unused exports
npm run build          # TypeScript
```

**Phase 4-6: Testing and Final Verification**
```bash
npm test               # Test execution
npm run test:coverage:fresh  # Coverage (optional)
npm run check:all      # Integrated check
```

**After Tests**: `npm run cleanup:processes`

**On Failure**: Resolve errors → Automatic fixes → Re-run

### Consistency Checks
- No duplicate definitions (constants, types, functions)
- Correct inter-file references
- No unintended changes
- Test helper utilization (consider consolidation on 3rd duplication - Rule of Three)

## Continuous Improvement Mindset

**Humility**: No perfect code exists, welcome feedback
**Courage**: Bold refactoring, delete unnecessary code
**Transparency**: Clarify reasoning, disclose limitations

## Cheat Sheet

**Start**: Read rules → Verify documents → Plan → Approval
**Implementation**: Pre-tool check → Watch red flags → Document consistency
**Completion**: Phase1-6 quality checks → Fix errors → Commit

## Conclusion

Follow this guide and continue writing code with a user-first, long-term perspective.

### Referenced Methodologies in This Guide
- **Rule of Three**: Martin Fowler "Refactoring"
- **5 Whys**: Toyota Production System
- **YAGNI Principle**: Kent Beck "Extreme Programming Explained"  
- **Red-Green-Refactor**: Kent Beck "Test-Driven Development"