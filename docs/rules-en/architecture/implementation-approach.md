# Implementation Strategy Selection Framework (Meta-cognitive Approach)

An implementation strategy selection framework based on meta-cognitive thinking. Derives optimal implementation approaches through a systematic decision process from understanding existing implementations to constraint compatibility.

## Meta-cognitive Strategy Selection Process

### Phase 1: Comprehensive Current State Analysis

**Core Question**: "What does the existing implementation look like?"

#### Analysis Framework
```yaml
Architecture Analysis:
  - Current responsibility separation and improvement potential
  - Data flow identification and evaluation
  - Dependency visualization and impact scope
  - Technical debt quantification

Implementation Quality Assessment:
  - Code quality and maintainability
  - Test coverage and reliability
  - Performance characteristics
  - Security considerations

Historical Context Understanding:
  - Why did it become the current form?
  - Validity check of past decisions
  - Changes in technical constraints
  - Evolution of business requirements
```

#### Meta-cognitive Question List
- What is the true responsibility of this implementation?
- Which parts are business essence and which derive from technical constraints?
- What dependencies or implicit preconditions are unclear from the code?
- What benefits and constraints does the current design bring?

### Phase 2: Strategy Exploration and Creation

**Core Question**: "When determining before → after, what implementation patterns or strategies should be referenced?"

#### Strategy Discovery Process
```yaml
Research and Exploration:
  - Implementation examples and patterns from similar tech stacks (use WebSearch)
  - Approach collection from projects handling similar challenges
  - Open source implementation references
  - Technical literature and blog research

Creative Thinking:
  - Sequential/parallel application of multiple strategies
  - Design based on project time/human/technical constraints
  - Phase division and milestone setting
  - Pre-design of necessary extension points
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

**Important**: The optimal solution is discovered through creative thinking according to each project's context.

### Phase 3: Risk Assessment and Control

**Core Question**: "What risks arise when applying this to existing implementation, and what's the best way to control them?"

#### Risk Analysis Matrix
```yaml
Technical Risks:
  - Impact on existing systems
  - Data consistency assurance
  - Performance degradation possibility
  - Integration complexity

Operational Risks:
  - Service availability impact
  - Deployment downtime
  - Monitoring/operation process changes
  - Failure rollback procedures

Project Risks:
  - Schedule delay possibility
  - Technology learning costs
  - Quality requirement achievement
  - Cross-team coordination complexity
```

#### Risk Control Strategies
```yaml
Preventive Measures:
  - Phased migration to new system without service disruption
  - Verification through parallel operation of old and new systems
  - Addition of integration and regression tests for new features
  - Pre-implementation setup of performance and error monitoring

Incident Response:
  - Clarify rollback procedures and conditions to old system
  - Prepare log analysis and metrics dashboards
  - Define communication system and role assignments for failures
  - Document partial service continuation procedures
```

### Phase 4: Constraint Compatibility Verification

**Core Question**: "What are this project's constraints?"

#### Constraint Checklist
```yaml
Technical Constraints:
  - Compatibility with existing libraries/frameworks
  - Server resource, network, database capacity limits
  - Mandatory requirements like data protection, access control, audit logging
  - Numerical targets like response time <5 seconds, 99.9% uptime

Temporal Constraints:
  - Project deadlines and priorities
  - Dependencies with other projects
  - Milestone/release plans
  - Learning/acquisition period considerations

Resource Constraints:
  - Team size, new technology learning time, existing skill sets
  - Developer work hours, server resources, operational system allocation
  - Project budget ceiling, running cost ceiling
  - External vendor support deadlines, SLAs, contract terms

Business Constraints:
  - Market launch timing requirements
  - Customer impact minimization requirements
  - Regulatory/industry standard compliance
```

### Phase 5: Implementation Approach Decision

Select optimal solution from basic implementation approaches (creative combinations encouraged):

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
**Verification Method**: Verify at appropriate L1/L2/L3 levels according to each phase's goals

### Phase 6: Decision Rationale Documentation

**Design Doc Documentation**: Clearly specify implementation strategy selection reasons and rationale.

## Verification Level Definitions

Priority for completion verification of each task:

- **L1: Functional Operation Verification** - Operates as end-user feature (e.g., search executable)
- **L2: Test Operation Verification** - New tests added and passing (e.g., type definition tests)
- **L3: Build Success Verification** - No compile errors (e.g., interface definitions)

**Priority**: L1 > L2 > L3 in order of verifiability importance

## Integration Point Definitions

Define integration points according to selected strategy:
- **Strangler-based**: When switching between old and new systems for each feature
- **Feature-driven**: When users can actually use the feature
- **Foundation-driven**: When all architecture layers are ready and E2E tests pass
- **Hybrid**: When individual goals defined for each phase are achieved

## Anti-patterns

- **Pattern Fixation**: Selecting only from listed strategies without considering unique combinations
- **Insufficient Analysis**: Skipping Phase 1 analysis framework before strategy selection
- **Risk Neglect**: Starting implementation without Phase 3 risk analysis matrix
- **Constraint Ignorance**: Deciding strategy without checking Phase 4 constraint checklist
- **Rationale Omission**: Selecting strategy without using Phase 6 documentation template

## Guidelines for Meta-cognitive Execution

1. **Leverage Known Patterns**: Use as starting point, explore creative combinations
2. **Active WebSearch Use**: Research implementation examples from similar tech stacks
3. **Apply 5 Whys**: Pursue root causes to grasp essence
4. **Multi-perspective Evaluation**: Comprehensively evaluate from each Phase 1-4 perspective
5. **Creative Thinking**: Consider sequential application of multiple strategies and designs leveraging project-specific constraints
6. **Clarify Decision Rationale**: Make strategy selection rationale explicit in design documents