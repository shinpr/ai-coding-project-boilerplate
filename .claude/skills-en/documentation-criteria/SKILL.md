---
name: documentation-criteria
description: Determines which PRD, ADR, UI Spec, Design Doc, and Work Plan a change requires and where each is stored. Use when deciding documentation scope or creating or reviewing a technical document.
---

# Documentation Creation Criteria

This skill owns document routing: which durable decisions the change needs to record and where each document lives. Each template linked from Storage Locations owns the document's content and structural requirements.

## What Each Document Fixes

- **PRD** — Fixes the business outcome, current requirements, exclusions, and acceptance criteria that later work traces to. Its AC IDs are stable traceability keys for design and verification. Implementation design belongs in the Design Doc, technical option selection in an ADR, and task order in the Work Plan.
- **ADR** — Fixes one durable technical choice and the materially distinct options it beat, allowing later work to distinguish an accepted decision from an incidental implementation. Complete implementation design belongs in the Design Doc.
- **UI Spec** — Fixes screen structure, transitions, component and state contracts, interactions, and visual acceptance before implementation. Create one only while those decisions remain open; reuse an approved UI Spec or proceed to the Design Doc when representative repository evidence already determines them.
- **Design Doc** — Records the complete implementation design for the confirmed scope: responsibilities, flows, contracts, change impact, and verification boundaries. Implementation treats it as the primary technical baseline, so implementation does not silently invent missing How. When repository evidence invalidates technical How while confirmed outcome, desired-future requirements, and non-goals remain true, correct the implementation and the affected technical artifact through their owning workflow without reopening product requirements.
- **Work Plan** — Fixes dependency order, task boundaries, executable verification, and the earliest useful proof point. It references design details instead of reproducing them.
- **Task File** — Carries one executable Work Plan outcome, its governing sources, investigation starting points, write responsibility, and observable verification into implementation.

## Creation Decision Matrix

| Structural Scale | Base Documents | Creation Order |
|------------------|----------------|----------------|
| Small | None | Direct implementation |
| Medium | Design Doc, Work Plan | Design Doc -> Work Plan |
| Large | PRD, Design Doc, Work Plan | PRD -> Design Doc -> Work Plan |

Add a UI Spec before the Design Doc for frontend/fullstack work when its decisions remain open. Complete any qualifying ADR batch before the Design Doc. A qualifying ADR raises the scale to Medium at minimum.

For a Large change, satisfy the PRD requirement by creating a new PRD, updating the relevant PRD, or creating a reverse PRD when no current product document exists. At any scale, update an existing PRD when the product scope changes.

## Structural Scale

Classify decision burden rather than repository layout. File count is supporting evidence only.

| Scale | Decision burden |
|-------|-----------------|
| Small | One coherent outcome, one evident repository-supported implementation within one responsibility boundary, and no unresolved durable choice |
| Medium | One coherent outcome that coordinates a boundary or contains a potentially durable choice |
| Large | Multiple independently valuable outcomes that require separate design decisions |

A cross-layer implementation can remain Medium when it serves one coherent outcome.

## ADR Decision Filters

Apply the Choice filter, then the Durability filter, to each technical topic inside the confirmed implementation scope. Check accepted ADRs before creating another record.

1. **Choice requires judgment** — confirmed requirements, accepted decisions, and representative repository evidence leave at least two credible, materially distinct options.
2. **Choice is durable** — selecting among them materially changes responsibility, dependency direction, a shared contract, persistence, technology, reversibility, or lifecycle cost that future work must preserve or understand.

Create one ADR for each topic that passes both filters and review the complete batch together. Group choices that must be selected or reconsidered together; separate independently revisitable decisions. Local implementation details and other cheaply reversible choices belong in the Design Doc.

## Storage Locations

| Document | Path | Naming Convention | Template |
|----------|------|------------------|----------|
| PRD | `docs/prd/` | `[feature-name]-prd.md` | [prd-template.md](references/prd-template.md) |
| ADR | `docs/adr/` | `ADR-[4-digits]-[title].md` | [adr-template.md](references/adr-template.md) |
| UI Spec | `docs/ui-spec/` | `[feature-name]-ui-spec.md` | [ui-spec-template.md](references/ui-spec-template.md) |
| UI Spec Assets | `docs/ui-spec/assets/{feature-name}/` | Prototype code files | - |
| Design Doc | `docs/design/` | `[feature-name]-design.md` | [design-template.md](references/design-template.md) |
| Work Plan | `docs/plans/` | `YYYYMMDD-{type}-{description}.md` | [plan-template.md](references/plan-template.md) |
| Task File | `docs/plans/tasks/` | See the task-decomposer filename table | [task-template.md](references/task-template.md) |

Every placeholder substituted into a generated directory or file name must be a lowercase ASCII kebab-case slug. Convert non-ASCII source text to that form before constructing the path.

Work Plans are excluded by `.gitignore`.

## References

Each template defines its document's content, status rules, required evidence, optional diagrams, and completion checks. Load only the template for the document being created or reviewed.
