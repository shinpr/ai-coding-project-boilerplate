---
name: implementation-approach
description: Selects implementation strategy (vertical slice, horizontal, or hybrid) with risk assessment. Use when planning feature implementation.
---

# Implementation Strategy Selection Framework (Meta-cognitive Approach)

## Meta-cognitive Strategy Selection Process

### Phase 1: Decision-Sufficient Current State Analysis

**Core Question**: "What does the existing implementation look like?"

#### Analysis Framework
```yaml
Architecture Analysis: Responsibility separation, data flow, dependencies, technical debt
Implementation Quality Assessment: Code quality, test coverage, performance, security
Historical Context Understanding: Current form rationale, past decision validity, constraint changes, requirement evolution
```

#### Meta-cognitive Question List
- What is the true responsibility of this implementation?
- Which parts are business essence and which derive from technical constraints?
- What dependencies or implicit preconditions are unclear from the code?
- What benefits and constraints does the current design bring?

Stop when another current-state fact cannot change responsibility, reuse, option validity, total complexity, a contract, or verification.

**Completion evidence**: inspected paths, observed architecture/data-flow facts, known constraints, inferred historical rationale labeled as inferred, and unknowns that could change strategy selection.

**Transition**: proceed when every strategy-relevant claim is observed, explicitly inferred with evidence, or recorded as unknown.

### Phase 2: Design Convergence

**Core Question**: "What is the smallest design that delivers the current required outcome, and what evidence forces each addition beyond it?"

Complete these steps in order before exploring implementation strategies:

1. **Existing-Surface Baseline**: Form the simplest end-to-end path that delivers the current outcome through existing responsibilities. Explicit requirements and accepted decisions are binding; suggested mechanisms remain candidates.
2. **Evidence Check**: Test that path against current requirements, verified constraints, observed in-scope problems, and evidence-backed material risks. Keep only the unmet conditions that can change the selected design.
3. **Targeted Comparison**: For each unmet condition, test reuse, derivation from existing data, on-demand computation, or responsibility at the current caller or boundary before adding design surface. Compare viable choices by total complexity across the dimensions that materially differ: user decisions, settings, modes, concepts, outputs, persistent state, implementation paths, UX, runtime, implementation, testing, documentation, and maintenance. Select the lowest-total-complexity choice that satisfies the condition.
4. **Subtraction Check**: Remove each proposed addition and re-test its governing condition. Retain it only when the confirmed outcome, a required boundary, or necessary proof becomes unmet.

Candidate paths and rejected additions remain active analysis. The durable output is the **Selected Design**: the complete chosen path plus evidence for each added design surface and the condition that fails when it is removed. Only an accepted ADR may retain alternatives as decision history. During implementation, use the same convergence check without producing a separate artifact.

**Completion evidence**: one complete Selected Design; every added design surface names its current evidence, why lower-surface resolutions fail, and its subtraction result.

**Transition**: proceed when every supporting claim is observed, explicitly inferred with evidence, or recorded as unknown; route an unknown that blocks the next step as an exact evidence prerequisite. User interaction is required only when the unknown requires changing the confirmed outcome, desired-future requirements, or non-goals, or authorizing an irreversible action.

### Phase 3: Strategy Exploration and Creation

**Core Question**: "When determining before -> after, what implementation patterns or strategies should be referenced?"

#### Strategy Discovery Process
```yaml
Research and Exploration: repository patterns first; then official documentation for the resolved dependency version; then maintained OSS implementations; use literature/blogs only for supplementary alternatives and label them as non-authoritative
Creative Thinking: Strategy combinations, constraint-based design, phase division, extension point design
```

#### Reference Strategy Patterns (Creative Combinations Encouraged)

**Legacy Handling Strategies**:
- Strangler Pattern: Gradual migration through phased replacement
- Facade Pattern: Complexity hiding through unified interface
- Adapter Pattern: Bridge with existing systems

**New Development Strategies**:
- Feature-driven Development: Vertical implementation prioritizing user value
- Foundation-driven Development: Foundation-first construction prioritizing stability
- Risk-driven Development: Prioritize addressing maximum risk elements

**Integration/Migration Strategies**:
- Proxy Pattern: Transparent feature extension
- Decorator Pattern: Phased enhancement of existing features
- Bridge Pattern: Flexibility through abstraction

**Completion evidence**: at least two feasible candidate approaches when the decision is non-trivial, with each candidate mapped to the observed constraints it satisfies and the constraints it leaves unresolved.

**Transition**: proceed when candidates are comparable against the same constraint set.

### Phase 4: Risk Assessment and Control

**Core Question**: "What risks arise when applying this to the existing implementation, and which control measurably reduces likelihood or impact while preserving verification and rollback?"

#### Risk Analysis Matrix
```yaml
Technical Risks: System impact, data consistency, performance degradation, integration complexity
Operational Risks: Service availability, deployment downtime, process changes, rollback procedures
Project Risks: Schedule delays, learning costs, quality achievement, team coordination
```

#### Risk Control Strategies
```yaml
Preventive Measures: Phased migration, parallel operation verification, integration/regression tests, monitoring setup
Incident Response: Rollback procedures, log/metrics preparation, communication system, service continuation procedures
```

**Completion evidence**: each material risk has likelihood/impact evidence, one preventive or containment control, and a verification point.

**Transition**: proceed when every high-impact risk has either a control or a blocking escalation.

### Phase 5: Constraint Compatibility Verification

**Core Question**: "What are this project's constraints?"

#### Constraint Checklist
```yaml
Technical Constraints: Library compatibility, resource capacity, mandatory requirements, numerical targets
Temporal Constraints: Deadlines/priorities, dependencies, milestones, learning periods
Resource Constraints: Team/skills, work hours/systems, budget, external contracts
Business Constraints: Market launch timing, customer impact, regulatory compliance
```

**Completion evidence**: each constraint is observed, inferred, or unknown; every unknown that can invalidate a candidate names the exact evidence prerequisite.

**Transition**: proceed when remaining unknowns cannot change the valid candidate set, or the user resolves them.

### Phase 6: Implementation Approach Decision

Select the approach that satisfies all hard constraints and current requirements with the lowest transition risk and smallest verification delay. Use lifecycle cost and implementation effort only as tiebreakers after requirement coverage, compatibility, and risk control are equal.

#### Vertical Slice (Feature-driven)
**Characteristics**: Vertical implementation across all layers by feature unit
**Application Conditions**: Low inter-feature dependencies, output in user-usable form, changes needed across all architecture layers
**Verification Method**: End-user value delivery at each feature completion

#### Horizontal Slice (Foundation-driven)
**Characteristics**: Phased construction by architecture layer
**Application Conditions**: Foundation system stability important, multiple features depend on common foundation, layer-by-layer verification effective
**Verification Method**: Integrated operation verification when all foundation layers complete

#### Hybrid (Creative Combination)
**Characteristics**: Flexible combination according to project characteristics
**Application Conditions**: Unclear requirements, need to change approach per phase, transition from prototyping to full implementation
**Verification Method**: Assign L1 when the phase produces end-user-operable behavior, L2 when it produces a testable internal behavior or contract, and L3 only when the phase produces build-time structure with no runnable behavior yet

For Hybrid, assign one explicit L1/L2/L3 verification level and observable completion result to every phase.

**Completion evidence**: one selected approach, its phase boundaries, integration points, and a verification result for every phase.

**Transition**: proceed to documentation when the selected approach covers every hard constraint and its risks have controls. Otherwise return to candidate exploration (Phase 3), or to Design Convergence (Phase 2) when a Phase 4-5 result changes the Selected Design or its evidence.

### Phase 7: Decision Rationale Documentation

Return the following structure in the Design Doc or planning handoff:

```yaml
implementationApproachDecision:
  observedConstraints: [<constraint + evidence>]
  inferredConstraints: [<constraint + evidence and inference>]
  unknowns: [<unknown + required evidence or decision>]
  selectedApproach: <vertical | horizontal | hybrid description>
  selectionRationale: <hard-constraint coverage, compatibility, risk control, and total-complexity basis>
  addedDesignSurface: [<addition + current evidence + lower-surface insufficiency + subtraction result>]
  phaseVerification: [<phase + L1/L2/L3 + observable completion evidence>]
```

Candidate approaches and rejection reasoning remain active analysis unless an accepted ADR owns them as decision history.

**Completion evidence**: the selected approach and every added design surface trace to an observed constraint, accepted inference, or resolved value-boundary decision.

## Verification Level Definitions

Priority for completion verification of each task:

- **L1: Functional Operation Verification** - Operates as an end-user feature (e.g., a user can execute a search and receive results)
- **L2: Test Operation Verification** - New tests added and passing (e.g., type definition tests)
- **L3: Build Success Verification** - No compile errors (e.g., interface definitions)

**Priority**: L1 > L2 > L3 in order of verifiability importance

## Integration Point Definitions

Define integration points according to selected strategy:
- **Strangler-based**: When switching between old and new systems for each feature
- **Feature-driven**: When users can actually use the feature
- **Foundation-driven**: When all architecture layers are ready and E2E tests pass
- **Hybrid**: When individual goals defined for each phase are achieved

## Decision Gate Checklist

- [ ] Phase 1 evidence exists before strategy selection
- [ ] Phase 2 produces one complete Selected Design and every added design surface maps to current evidence, lower-surface insufficiency, and a failed condition under subtraction
- [ ] Candidate generation includes combinations when no listed strategy satisfies all hard constraints
- [ ] Every material risk has a control and verification point
- [ ] Every hard constraint maps to the selected approach
- [ ] Phase 7 output records the selection, total-complexity basis, and added design surface; alternatives appear only in an accepted ADR

When evidence required by a checked item is unknown, stop at that phase and report the exact repository evidence prerequisite. User interaction is required only when the unknown requires changing the confirmed outcome, desired-future requirements, or non-goals, or authorizing an irreversible action.

## Guidelines for Meta-cognitive Execution

1. **Leverage Known Patterns**: Use as starting point, explore creative combinations
2. **Evidence-Ordered Research**: Use repository evidence, version-matched official documentation, maintained OSS examples, then supplementary secondary sources
3. **Apply 5 Whys**: Pursue root causes to grasp essence
4. **Multi-perspective Evaluation**: Complete the evidence and transition checks for Phases 1-5
5. **Strategy Composition**: Combine strategies when one strategy cannot satisfy all hard constraints
6. **Decision Traceability**: Map every selection reason to evidence in the Phase 7 output
