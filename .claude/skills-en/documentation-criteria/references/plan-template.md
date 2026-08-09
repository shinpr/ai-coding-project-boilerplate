# Work Plan: [Title]

Created Date: YYYY-MM-DD
Type: feature|fix|refactor
Related Issue/PR: #XXX (if any)

## Governing Documents

- Design Doc: [docs/design/XXX.md] (list each when the change spans layers)
- UI Spec: [docs/ui-spec/XXX.md] (when applicable)
- ADR: [docs/adr/ADR-XXXX-title.md] (when applicable)
- PRD: [docs/prd/XXX.md] (when applicable)
- Test skeletons: [paths] (when generated)

## Implementation Scope

[One concise statement of the repository implementation outcome defined by the Design Doc.]

## Implementation Phases

Use the implementation approach and dependency order from the Design Doc. Each phase groups the work that reaches a shared observable verification point. Keep implementation, tests, configuration, wiring, and documentation together when they become complete at that point.

Shape phases from the selected approach:

- **Vertical Slice**: each phase is one value unit carrying its implementation and verification.
- **Horizontal Slice**: each phase completes and verifies one required architecture layer before their integration point.
- **Hybrid**: combine verified shared prerequisites with outcome-oriented slices and name the observable verification for each phase.

Whole-repository quality assurance remains a separate execution responsibility.

Each `PN-TN` checkbox entry is one implementation task. `PN-TN` is its stable ID and the key every dependency reference uses.

### Phase 1: [First implementation outcome]

#### Tasks

- [ ] **P1-T1: [Repository implementation outcome]**
  - **Source**: [every directly constraining Design Doc, ADR, or UI Spec path and section; AC IDs]
  - **Scope**: [responsibility, component, or expected files]
  - **Depends on**: none | [task IDs]
  - **Executor lane**: backend|frontend (selects the executor and quality-fixer pair per the Layer-Aware Agent Routing table in subagents-orchestration-guide skill)
  - **Rollback boundary**: [repository change that reverts with this task]
  - **Verification**: [Design Doc verification method or repository command]
  - **Verification Focus** (optional): **Primary failure** — [most material false-green state]; **Observable check** — [smallest check that detects it]

### Phase 2: [Next implementation outcome] (when required)

#### Tasks

- [ ] **P2-T1: [Repository implementation outcome]**
  - **Source**: [every directly constraining governing path and section; AC IDs]
  - **Scope**: [responsibility, component, or expected files]
  - **Depends on**: [task IDs]
  - **Executor lane**: backend|frontend
  - **Rollback boundary**: [repository change that reverts with this task]
  - **Verification**: [Design Doc verification method or repository command]
  - **Verification Focus** (optional): **Primary failure** — [...]; **Observable check** — [...]

Add one entry per implementation outcome. Separate entries only when a repository dependency, executor lane, or independently completable governing outcome requires it. Select exactly one executor lane per entry.

Add `Verification Focus` only when the task could appear complete while its cited acceptance criterion remains false.

## Completion Criteria

- [ ] Every Design Doc obligation needed for implementation is covered by at least one task
- [ ] Every task cites each directly constraining governing section and applicable AC
- [ ] Every task produces a repository implementation outcome required by its source
- [ ] Dependencies permit execution in the listed order
- [ ] Verification is executable from repository artifacts or the task's own output
- [ ] Task verification passes and cited acceptance criteria are satisfied
