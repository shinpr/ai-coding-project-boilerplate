---
name: documentation-criteria
description: Guides PRD, ADR, Design Doc, UI Spec, and Work Plan creation. Use when creating or reviewing technical documents, or when "UI spec/screen design/component decomposition" is mentioned.
---

# Documentation Creation Criteria

## Creation Decision Matrix

Evaluate rows by confirmed scale, then add the conditional documents named in the same row. ADR Creation Conditions override scale: when any ADR condition applies, create or update the ADR even for a 1-2 file change.

| Confirmed Scale | Required Documents | Conditional Additions | Creation Order |
|-----------------|--------------------|-----------------------|----------------|
| Large (6+ files or large-risk axis) | PRD, Design Doc, Work Plan | UI Spec for frontend/fullstack; ADR when any ADR condition applies | PRD -> UI Spec (if applicable) -> ADR (if applicable) -> Design Doc -> Work Plan |
| Medium (3-5 files or medium-risk axis) | Design Doc, Work Plan | UI Spec for frontend/fullstack; ADR when any ADR condition applies; update an existing PRD when the feature scope changes | PRD update (if applicable) -> UI Spec (if applicable) -> ADR (if applicable) -> Design Doc -> Work Plan |
| Small (1-2 files with no higher-risk axis) | One task file in task-template format | ADR when any ADR condition applies; update an existing PRD when the feature scope changes | PRD update (if applicable) -> ADR (if applicable) -> task file |

For a Large change, satisfy the PRD requirement by creating a new PRD, updating the relevant PRD, or creating a reverse PRD when no current product document exists.

### Structural Escalation

File count measures size, not structural impact, so a two-file change can still reshape a contract or a data flow. This rule is what the matrix's "higher-risk axis" resolves to.

When any ADR Creation Condition below applies, the confirmed scale is **Medium at minimum** — Design Doc and Work Plan required — regardless of file count. Escalation only raises a level; a file count that already reaches Medium or Large stands. Record the applied condition as the deciding axis.

Scale decides which documents a change requires. Task boundaries within a Work Plan are decided separately, by implementation outcome, rollback boundary, and executor lane (see plan-template).

## ADR Creation Conditions (Required if Any Apply)

### 1. Type System Changes
- **Adding nested types with 3+ levels**: `type A = { b: { c: { d: T } } }`
  - Rationale: Deep nesting has high complexity and wide impact scope
- **Changing/deleting types used in 3+ locations**
  - Rationale: Multiple location impacts require careful consideration
- **Type responsibility changes** (e.g., DTO->Entity)
  - Rationale: Conceptual model changes affect design philosophy

### 2. Data Flow Changes
- **Storage location changes** (DB->File, Memory->Cache)
- **Processing order changes with 3+ steps**
  - Example: "Input->Validation->Save" to "Input->Save->Async Validation"
- **Data passing method changes** (props->Context, direct reference->events)

### 3. Architecture Changes
- Layer addition, responsibility changes, component relocation

### 4. External Dependency Changes
- Library/framework/external API introduction or replacement

### 5. Complex Implementation Logic (Regardless of Scale)
- Managing 3+ states
- Coordinating 5+ asynchronous processes

## Detailed Document Definitions

### PRD (Product Requirements Document)

**Purpose**: Define business requirements and user value

**Includes**:
- Business requirements and user value
- Success metrics and KPIs (each metric specifies a numeric target, measurement method, and timeframe)
- User stories and use cases
- Acceptance criteria with sequential IDs (AC-001, AC-002, ...) for downstream traceability
- MVP convergence — the smallest coherent behavior or journey that delivers the value, with excluded capabilities placed in Future or Out of Scope with a reason and an origin marking whether the user authored the exclusion or the requirement analysis judged it
- User journey diagram (required)
- Scope boundary diagram (required)

**Scope**: Business requirements, user value, success metrics, user stories, and prioritization only. Implementation details belong in Design Doc, technical selection rationale in ADR, phases and task breakdown in Work Plan.

### ADR (Architecture Decision Record)

**Purpose**: Record technical decision rationale and background

**Includes**:
- Decision (what was selected)
- Rationale (why that selection was made)
- Option comparison (minimum 3 options) and trade-offs
- Architecture impact
- Principled implementation guidelines (e.g., "Use dependency injection")

**Scope**: Decision, rationale, option comparison, architecture impact, and principled guidelines only. Implementation procedures and code examples belong in Design Doc, schedule and resource assignments in Work Plan.

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

**Purpose**: Implementation task management and progress tracking

**Includes**:
- One task entry per implementation outcome, each carrying a stable `Phase X Task Y` ID, Target Files, a rollback boundary, and an executor lane (see plan-template.md)
- Task dependencies declared by those stable IDs (maximum 2 levels)
- Schedule and duration estimates
- **Include test skeleton file paths** (integration and E2E)
- **Verification Strategy summary** (extracted from Design Doc)
- **Final Quality Assurance Phase (required)**
- Progress records (checkbox format)

**Scope**: Task breakdown, dependencies, schedule, verification strategy summary, and progress tracking only. Technical rationale belongs in ADR, design details in Design Doc.

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

**All approaches**: The final phase is Quality Assurance: verify acceptance criteria, configured tests, and applicable quality checks. Each phase's verification method follows the Verification Strategy from the Design Doc.

**Three Elements of Task Completion Definition**:
1. **Implementation Complete**: Code is functional
2. **Quality Complete**: Tests, type checks, linting pass
3. **Integration Complete**: Verified connection with other components

## Creation Process

1. **Problem Analysis**: Change scale assessment, ADR condition check
   - Identify explicit and implicit project standards before investigation
   - **Output evidence**: confirmed scale with deciding axis, required-document list, and named source for each existing document
   - **Transition**: proceed when every document has `create`, `update`, or `not required` with a rule-based reason
2. **ADR Option Consideration** (ADR only): Compare 3+ options, specify trade-offs
   - **Output evidence**: option comparison with selected option, rejected options, known unknowns, and kill criteria
   - **Transition**: proceed when the decision is reviewable and blocking unknowns are named
3. **Creation**: Use templates, include measurable conditions
   - **Output evidence**: document at the required storage path with every required section populated or marked N/A with rationale
   - **Transition**: proceed when template checks and traceability checks pass
4. **Approval**: "Accepted" after review enables implementation
   - **Output evidence**: reviewer result, resolved conditions, and recorded user approval
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
| Task File | `docs/plans/tasks/` | `{plan-name}-task-{number}.md` | See task-template.md |

*Note: Work plans are excluded by `.gitignore`

## ADR Status
`Proposed` -> `Accepted` -> `Deprecated`/`Superseded`/`Rejected`

## AI Automation Rules
- Evaluate ADR Creation Conditions at every scale; create or update an ADR when any condition applies
- A type or data-flow change requires an ADR when it matches a condition in the corresponding section above
- Check existing ADRs before implementation

## Diagram Requirements

Required diagrams for each document (using mermaid notation):

| Document | Required Diagrams | Purpose |
|----------|------------------|---------|
| PRD | User journey diagram, Scope boundary diagram | Clarify user experience and scope |
| ADR | Option comparison diagram when 2+ material options have relationships or trade-offs that are easier to compare visually | Visualize trade-offs |
| UI Spec | Screen transition diagram, Component tree diagram | Clarify screen flow and component structure |
| Design Doc | Architecture diagram, Data flow diagram | Understand technical structure |
| Work Plan | Phase structure diagram, Task dependency diagram | Clarify implementation order |

## Common ADR Relationships
1. **At creation**: Identify common technical areas (logging, error handling, async processing, etc.), reference existing common ADRs
2. **When missing**: Consider creating necessary common ADRs
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
