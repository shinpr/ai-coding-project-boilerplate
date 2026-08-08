---
name: documentation-criteria
description: Guides PRD, ADR, Design Doc, UI Spec, and Work Plan creation. Use when creating or reviewing technical documents, or when "UI spec/screen design/component decomposition" is mentioned.
---

# Documentation Creation Criteria

## Creation Decision Matrix

| Structural Scale | Base Documents | Creation Order |
|------------------|----------------|----------------|
| Small | None | Direct implementation |
| Medium | Design Doc, Work Plan | Design Doc -> Work Plan |
| Large | PRD, Design Doc, Work Plan | PRD -> Design Doc -> Work Plan |

Add a UI Spec before the Design Doc for frontend/fullstack work. Complete any qualifying ADR batch before the Design Doc. A qualifying ADR raises the scale to Medium at minimum.

For a Large change, satisfy the PRD requirement by creating a new PRD, updating the relevant PRD, or creating a reverse PRD when no current product document exists. At any scale, update an existing PRD when the product scope changes.

## Structural Scale

Classify the decision burden, not repository layout. File count is supporting evidence only.

| Scale | Decision burden |
|-------|-----------------|
| Small | One coherent outcome, one evident repository-supported implementation within one responsibility boundary, and no unresolved durable choice |
| Medium | One coherent outcome that coordinates a boundary or contains a potentially durable choice |
| Large | Multiple independently valuable outcomes that require separate design decisions |

A cross-layer implementation can remain Medium when it serves one coherent outcome. A qualifying ADR raises the scale to Medium at minimum.

## ADR Decision Filters

Create an ADR only when a candidate decision passes both filters:

1. **Choice requires judgment**: At least two credible, materially distinct options remain after applying confirmed requirements, accepted ADRs, and repository evidence.
2. **Choice is durable**: The selection changes a responsibility boundary, dependency, shared contract, persistence model, technology, reversibility, or lifecycle cost that future work must preserve.

Create one ADR per decision point. Group tightly coupled choices when separating them would make either decision misleading.

Examples that often qualify include selecting or replacing an external dependency, moving ownership across architectural boundaries, changing persistence strategy, or establishing a shared contract. Local implementation details and readily reversible choices belong in the Design Doc. File counts, nesting depth, state counts, and pipeline length are evidence of complexity, not ADR triggers.

## Detailed Document Definitions

### PRD (Product Requirements Document)

**Purpose**: Define business requirements and user value

**Includes**:
- Business requirements and user value
- Success metrics and KPIs (each metric specifies a numeric target, measurement method, and timeframe)
- User stories and use cases
- Acceptance criteria with sequential IDs (AC-001, AC-002, ...) for downstream traceability
- MVP convergence — the smallest coherent behavior or journey that delivers the value, with excluded capabilities placed in Future or Out of Scope with a reason and an origin marking whether the user authored the exclusion or the requirement analysis judged it
- User journey or scope boundary diagram when prose does not make the material flow or boundary clear

**Scope**: Business requirements, user value, success metrics, user stories, and prioritization only. Implementation details belong in Design Doc, technical selection rationale in ADR, phases and task breakdown in Work Plan.

### ADR (Architecture Decision Record)

**Purpose**: Record technical decision rationale and background

**Includes**:
- Decision point and scope boundary
- Decision (what was selected)
- Rationale (why that selection was made)
- Evidence-backed comparison of the credible options and their trade-offs
- Architecture impact

**Scope**: Decision, rationale, option comparison, and architecture impact only. Implementation procedures and code examples belong in Design Doc, schedule and resource assignments in Work Plan.

### UI Specification

**Purpose**: Define UI structure, screen transitions, component decomposition, and interaction design for frontend features

**Includes**:
- Screen list and transition conditions
- Component decomposition with state x display matrix (default/loading/empty/error/partial)
- Interaction definitions linked to PRD acceptance criteria (EARS format)
- Prototype management (code-based prototypes as attachments, not source of truth)
- AC traceability from PRD to screens/components
- Existing component reuse map and design tokens
- Visual acceptance criteria (golden states, layout constraints)
- Accessibility requirements (keyboard, screen reader, contrast)

**Scope**: Screen structure, transitions, component decomposition, interaction design, and visual acceptance criteria only. Technical implementation and API contracts belong in Design Doc, test implementation in test skeleton generation output, schedule in Work Plan.

**Required Structural Elements**:
- At least one component with state x display matrix and interaction table
- AC traceability table mapping PRD ACs to screens/states
- Screen list with transition conditions
- Existing component reuse map (reuse/extend/new decisions)

**Prototype Code Handling**:
- Prototype code provided by user is placed in `docs/ui-spec/assets/{feature-name}/`
- Prototype is an attachment to the UI Spec; the UI Spec and Design Doc remain the canonical specification
- UI Spec + Design Doc are the canonical specifications

### Design Document

**Purpose**: Define technical implementation methods in detail

**Includes**:
- **Existing codebase analysis** (required)
  - Implementation path mapping (both existing and new)
  - Integration point clarification (connection points with existing code even for new implementations)
- Technical implementation approach (vertical/horizontal/hybrid)
- **Technical dependencies and implementation constraints** (required implementation order)
- Interface and type definitions
- Data flow and component design
- **Acceptance criteria (EARS format — see design-template.md; each criterion specifies a verifiable condition with pass/fail threshold)**
- Change impact map with explicit direct impact, indirect impact, and verified no-ripple-effect entries
- Complete enumeration of integration points
- Data contract clarification
- **Agreement checklist** (agreements with stakeholders)
- **Code inspection evidence** (inspected files/functions during investigation)
- **Field propagation map** (when fields cross component boundaries)
- **Requirement Convergence** (required) — the outcome, the non-goals and speculative requirements the user excluded, and the fields the user left unresolved; the first three are marked N/A with the PRD path when a PRD carries them (see design-template.md)
- **Design Convergence** (required) — Direct MVP, Failed Items, Adopted Additions, Rejected Additions (see design-template.md)
- **Data representation decision** (when the converged design introduces or modifies structures)
- **Applicable standards** (explicit/implicit classification)
- **Prerequisite ADRs** (including common ADRs)
- **Verification Strategy** (required)
  - Correctness proof method (what "correct" means for this change, how it's verified, when)
  - Early verification point (first target to prove the approach works, success criteria, failure response)

**Scope**: Technical implementation methods, interfaces, data flow, acceptance criteria, and verification strategy only. Technology selection rationale belongs in ADR, schedule and assignments in Work Plan.

### Work Plan

**Purpose**: Implementation task management and progress tracking.

**Scope**: Repository implementation outcomes from approved Design Docs, task dependencies, source section and acceptance-criteria references, executable verification, optional task-level false-green focus, and progress tracking only. The Work Plan references governing documents instead of reproducing their design details.

**Phase Division Criteria** (adapt to implementation approach from Design Doc):

**When Vertical Slice selected**:
- Each phase = one value unit (feature, component, or migration target)
- Each phase includes its own implementation + verification per Verification Strategy

**When Horizontal Slice selected**:
1. **Phase 1: Foundation Implementation** - Type definitions, interfaces, test preparation
2. **Phase 2: Core Feature Implementation** - Business logic, unit tests
3. **Phase 3: Integration Implementation** - External connections, presentation layer

**When Hybrid selected**:
- Combine vertical and horizontal as defined in Design Doc implementation approach

**All approaches**: Each phase ends at a repository-observable verification point. Whole-repository quality assurance remains a separate execution responsibility.

## Creation Process

1. **Problem Analysis**: Confirm scope, Structural Scale, and candidate decision points
   - Identify explicit and implicit project standards before investigation
   - **Output evidence**: confirmed scale with deciding axis, required-document list, and named source for each existing document
   - **Transition**: proceed when every document has `create`, `update`, or `not required` with a rule-based reason
2. **ADR Qualification**: Apply the Choice filter, then the Durability filter, independently to each candidate decision point
   - **Output evidence**: qualifying decision points, credible options, repository evidence, and rejected candidates with reasons
   - **Transition**: when ADRs qualify, create and review the complete batch before the Design Doc; otherwise continue directly
3. **Creation**: Use templates and accepted ADRs, include measurable conditions
   - **Output evidence**: document at the required storage path with every required section populated or marked N/A with rationale
   - **Transition**: proceed when template checks and traceability checks pass
4. **Approval**: Review the ADR batch together and set accepted decisions to `Accepted`; approval of the resulting Design Doc enables planning or implementation
   - **Output evidence**: reviewer result, resolved findings, accepted ADRs, and recorded user approval
   - **Transition**: implementation begins only after the required approval is recorded

## Storage Locations

| Document | Path | Naming Convention | Template |
|----------|------|------------------|----------|
| PRD | `docs/prd/` | `[feature-name]-prd.md` | See prd-template.md |
| ADR | `docs/adr/` | `ADR-[4-digits]-[title].md` | See adr-template.md |
| UI Spec | `docs/ui-spec/` | `[feature-name]-ui-spec.md` | See ui-spec-template.md |
| UI Spec Assets | `docs/ui-spec/assets/{feature-name}/` | Prototype code files | - |
| Design Doc | `docs/design/` | `[feature-name]-design.md` | See design-template.md |
| Work Plan | `docs/plans/` | `YYYYMMDD-{type}-{description}.md` | See plan-template.md |
| Task File | `docs/plans/tasks/` | See the task-decomposer filename table | See task-template.md |

*Note: Work plans are excluded by `.gitignore`

## ADR Status
`Proposed` -> `Accepted` -> `Deprecated`/`Superseded`/`Rejected`

## AI Automation Rules
- Apply the Choice filter before the Durability filter; both must pass
- Check existing ADRs before creating or changing a decision
- Create one ADR per qualifying decision point and review the batch together

## Diagram Requirements

Use diagrams only when they make a material relationship easier to judge than prose or a compact table:

| Document | Required Diagrams | Purpose |
|----------|------------------|---------|
| PRD | User journey or scope boundary diagram when needed | Clarify a material user flow or scope boundary |
| ADR | Option comparison diagram when 2+ material options have relationships or trade-offs that are easier to compare visually | Visualize trade-offs |
| UI Spec | Screen transition or component tree diagram when needed | Clarify a material screen flow or component structure |
| Design Doc | Architecture or data-flow diagram when needed | Clarify a material technical relationship |

## Common ADR Relationships
1. **At creation**: Identify and reference accepted common ADRs that govern the change
2. **When missing**: Apply both ADR filters; a generic cross-cutting concern alone does not justify an ADR
3. **Design Doc**: Specify common ADRs in "Prerequisite ADRs" section
4. **Compliance check**: Verify design aligns with common ADR decisions

## Templates

Templates are available in the `references/` directory:
- [Design Document template](references/design-template.md)
- [Product Requirements Document template](references/prd-template.md)
- [UI Specification template](references/ui-spec-template.md)
- [Work Plan template](references/plan-template.md)
- [Architecture Decision Record template](references/adr-template.md)
- [Task File template](references/task-template.md)
