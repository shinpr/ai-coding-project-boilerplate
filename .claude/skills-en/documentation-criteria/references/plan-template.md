# Work Plan: [Title]

Created Date: YYYY-MM-DD
Type: feature|fix|refactor
Estimated Impact: X files
Related Issue/PR: #XXX (if any)

## Related Documents
- Design Doc(s):
  - [docs/design/XXX.md]
  - [docs/design/YYY.md] (if multiple, e.g. backend + frontend)
- ADR: [docs/adr/ADR-XXXX.md] (if any)
- PRD: [docs/prd/XXX.md] (if any)

## Verification Strategy (from Design Doc)

### Correctness Proof Method
- **Correctness definition**: [extracted from Design Doc]
- **Verification method**: [extracted from Design Doc]
- **Verification timing**: [extracted from Design Doc]

### Early Verification Point
- **First verification target**: [extracted from Design Doc]
- **Success criteria**: [extracted from Design Doc]
- **Failure response**: [extracted from Design Doc]

## Objective
[Why this change is necessary, what problem it solves]

## Impact Scope
### Target Files
- [ ] src/domain/xxx
- [ ] src/application/xxx
- [ ] src/infrastructure/xxx
- [ ] src/presentation/xxx

### Test Files
- [ ] __tests__/xxx.test.ts
- [ ] __tests__/xxx.test.ts

### Documentation
- [ ] ADR creation needed (for architecture changes)
- [ ] Design Doc update needed
- [ ] README update needed

## Implementation Phases

Select ONE phase structure based on implementation approach from Design Doc.
See documentation-criteria skill for detailed Phase Division Criteria.
All quality checks follow Quality Check Workflow from coding-standards skill.
**Delete the unused Option entirely from the final plan.** For hybrid approach, use Option C.

### Option A: Vertical Slice Phase Structure

Use when implementation approach is Vertical Slice. Each phase = one value unit with verification.

#### Phase 1: [Value Unit 1 Name] (Estimated commits: X)
**Purpose**: [First vertical slice — proves approach works]
**Verification**: [From Verification Strategy: early verification point]

##### Tasks
- [ ] Task 1: Implementation
- [ ] Task 2: Verification per Verification Strategy
- [ ] Quality check (staged)

##### Phase Completion Criteria
- [ ] Early verification point passed
- [ ] [Functional criteria]

#### Phase 2: [Value Unit 2 Name] (Estimated commits: X)
**Purpose**: [Subsequent value unit]
**Verification**: [From Verification Strategy]

##### Tasks
- [ ] Task 1: Implementation
- [ ] Task 2: Verification per Verification Strategy
- [ ] Quality check

##### Phase Completion Criteria
- [ ] [Functional criteria]
- [ ] [Quality criteria]

### Option B: Horizontal Slice Phase Structure

Use when implementation approach is Horizontal Slice. Phases follow Foundation → Core → Integration → QA.

#### Phase 1: [Foundation] (Estimated commits: X)
**Purpose**: Contract definitions, interfaces, test preparation

##### Tasks
- [ ] Task 1: Specific work content
- [ ] Task 2: Specific work content
- [ ] Quality check (staged)
- [ ] Unit tests: All related tests pass

##### Phase Completion Criteria
- [ ] [Functional completion criteria]
- [ ] [Quality completion criteria]

#### Phase 2: [Core Feature] (Estimated commits: X)
**Purpose**: Business logic, unit tests

##### Tasks
- [ ] Task 1: Specific work content
- [ ] Task 2: Specific work content
- [ ] Quality check (staged)
- [ ] Integration tests: Verify overall feature functionality

##### Phase Completion Criteria
- [ ] [Functional completion criteria]
- [ ] [Quality completion criteria]

#### Phase 3: [Integration] (Estimated commits: X)
**Purpose**: External connections, presentation layer

##### Tasks
- [ ] Task 1: Specific work content
- [ ] Task 2: Specific work content
- [ ] Quality check (staged)
- [ ] Integration tests: Verify component coordination

##### Phase Completion Criteria
- [ ] [Functional completion criteria]
- [ ] [Quality completion criteria]

### Option C: Hybrid Phase Structure

Use when implementation approach is Hybrid. Combine vertical and horizontal phases as defined in Design Doc implementation approach. Structure phases per Design Doc specification, ensuring each phase has Tasks, Verification, and Phase Completion Criteria sections matching the format above.

### Final Phase: Quality Assurance (Required) (Estimated commits: 1)

This phase is required for ALL implementation approaches.

**Purpose**: Cross-cutting quality assurance and Design Doc consistency verification

#### Tasks
- [ ] Verify all Design Doc acceptance criteria achieved
- [ ] Security review: Verify security considerations from Design Doc are implemented
- [ ] Quality checks (types, lint, format)
- [ ] Execute all tests (including integration/E2E from test skeletons, when provided)
- [ ] Coverage 70%+
- [ ] Document updates

### Quality Assurance
- [ ] Quality check (staged)

## Risks and Countermeasures
| Risk | Countermeasure |
|------|----------------|
| [Expected risk] | [How to address it] |

## Completion Criteria
- [ ] All phases completed
- [ ] All integration/E2E tests passing (when test skeletons provided)
- [ ] Design Doc acceptance criteria satisfied
- [ ] Staged quality checks completed (zero errors)
- [ ] All tests pass
- [ ] Necessary documentation updated
- [ ] User review approval obtained

## Progress Tracking
### Phase 1
- Start: YYYY-MM-DD HH:MM
- Complete: YYYY-MM-DD HH:MM
- Notes: [Any special remarks]

### Phase 2
- Start: YYYY-MM-DD HH:MM
- Complete: YYYY-MM-DD HH:MM
- Notes: [Any special remarks]

## Notes
[Special notes, reference information, important points, etc.]
