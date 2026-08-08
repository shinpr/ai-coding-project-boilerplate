---
description: Execute from repository evidence through applicable UI Spec and optional ADR decisions to complete frontend Design Doc approval
---

Execute the `documentation-criteria` skill before document routing or creation.
Execute the `llm-friendly-context` skill before writing Agent prompts, handoffs, or generated artifacts.
Execute the `subagents-orchestration-guide` skill before invoking agents or resolving findings.

## Outcome and Ownership

Coordinate a Medium/Large frontend design from evidence to an applicable UI Spec and approved Design Doc. The orchestrator owns requirement convergence, Structural Scale, document routing, ADR qualification, evidence selection, and Review Resolution. Named specialists own semantic investigation and artifacts.

The frontend Design Doc always carries the complete implementation design. An ADR batch narrows qualifying technical choices; an applicable UI Spec owns UI structure and behavior that remain to be designed.

Requirements: $ARGUMENTS

## Flow

```text
requirement source -> codebase-analyzer -> scope/document routing confirmation [Stop]
                                               |
                             conditional UI analysis -> UI Spec review [Stop]
                                               |
                                   optional ADR batch/review [Stop]
                                               |
              Design Doc -> code-verifier/Resolution -> document-reviewer
                                               |
                               design-sync -> approval [Stop]
```

Use Review Resolution for every actionable finding. Wait at each `[Stop]` for explicit user confirmation.

At each Agent invocation below, build the prompt as a mechanical extraction: copy the named source values into the exact fields, apply only the declared serialization, then invoke immediately.

## Step 1: Select the Governing Requirement Source

Use the approved PRD path when one exists. Otherwise use the confirmed requirements verbatim.

Set `confirmed_requirement_context` to the approved PRD path exactly. Only when no approved PRD exists, use the orchestrator-confirmed convergence record unchanged.

## Step 2: Collect Repository Decision Material

Invoke `codebase-analyzer` once for the complete confirmed scope with exactly `prd_path: [approved PRD path]`, or `requirements: [confirmed requirements verbatim]` when no approved PRD exists.

Require one valid JSON result and let the analyzer discover affected paths, responsibility boundaries, and cross-layer contracts. Treat `focusAreas` as existing-behavior safeguards rather than requirements.

## Step 3: Determine UI Spec Applicability and Resolve UI Evidence

Apply the documentation-criteria UI Spec creation condition. When it does not apply, skip UI analysis and Step 5.

When a UI Spec applies, select project-context external resources only when one can change the current UI direction, component contract, or verification boundary. Otherwise use `external_resource_refs: []`.

Ask for prototype code only when it supplies an unresolved approved UI decision or the target cannot be determined from requirements, repository UI, and recorded resources. A missing optional prototype is not a stop condition.

Invoke `ui-analyzer` with exactly one governing source: `prd_path: [approved PRD path]`, or `requirements: [confirmed requirements verbatim]` when no approved PRD exists. Add only an existing `ui_spec_path`, a decision-relevant `prototype_path`, and selected `external_resource_refs` or `[]`.

## Step 4: Confirm Scope and ADR Decisions

Execute `requirement-convergence`. Build and judge the convergence record from the governing requirement source, repository analysis, and applicable UI analysis.

Judge all four convergence fields. Assign `cost` from Step 2 structural evidence and record its unknowns; run the hearing only for fields below `ready`.

Determine Structural Scale from outcomes and responsibility boundaries; file count is supporting evidence only. Resolve candidate decision points against the governing source, `reuse`, and `invalidations`; applicable UI facts may support or contradict the remaining options. Apply documentation-criteria Choice and Durability filters only after this convergence and record passing points as `adrDecisionPoints`; an empty list is valid.

Present the confirmed outcome and requirements, cost evidence and unknowns, exclusions, affected responsibilities, Structural Scale, UI Spec applicability, and qualifying ADR points or none. Offer proceed, or correct and re-run. Continue only when every convergence field is `ready` or `weak-but-explicit`. `[Stop: Scope confirmation]`.

## Step 5: Create and Approve the UI Spec

Run this step only when Step 3 determined that a UI Spec applies.

Invoke `ui-spec-designer` with `confirmed_requirement_context`, the complete `ui_analysis` and `codebase_analysis` unchanged, a decision-relevant `prototype_path` when one exists, and selected `external_resource_refs` or `[]`.

Invoke `document-reviewer` with `doc_type: UISpec` and `target` as the returned UI Spec path. `approved` presents the UI Spec; `needs_revision` applies Review Resolution and re-reviews after correction; `rejected` resolves the governing-source conflict before another review. `[Stop: UI Spec approval]`.

## Step 6: Create and Approve an ADR Batch When Needed

When `adrDecisionPoints` is non-empty:

1. Route shared/backend-owned points to technical-designer first, then frontend-owned points to technical-designer-frontend. Invoke each owner with `document_to_create: ADRBatch`, `confirmed_requirement_context`, its ordered `decision_points`, corresponding unchanged `decision_materials`, and `ui_spec_path` only when the approved UI Spec constrains that decision.
2. Collect all returned paths and invoke `document-reviewer` once with `doc_type: ADRBatch`, `targets: [all paths]`, and `confirmed_requirement_context`.
3. Route the verdict first: `approved` proceeds; `needs_revision` applies Review Resolution, updates one ADR per path serially, and re-reviews the complete batch; `rejected` resolves the governing-source conflict before another review.
4. Present one batch decision only after an approved review. `[Stop: ADR batch approval]`.
5. After user approval, set every ADR status to `Accepted` and verify the changes.

## Step 7: Create the Frontend Design Doc

Invoke `technical-designer-frontend` with:

- `document_to_create: DesignDoc`;
- `confirmed_requirement_context`;
- `structural_scale`;
- the applicable approved `ui_spec_path` and selected external-resource records;
- `adr_paths: [accepted paths or []]`;
- the complete Step 2 `codebase_analysis` unchanged;
- the complete Step 3 `ui_analysis` unchanged when present.

The Design Doc owns the complete component-to-service implementation and retains all applicable downstream safeguards.

## Step 8: Verify, Review, and Approve

Invoke `code-verifier` with `doc_type: design-doc` and the returned Design Doc path, leaving `code_paths` absent. Apply Review Resolution before document review; update through technical-designer-frontend and rerun verification after applied corrections. Pass the latest verifier result together with the recorded dispositions as `verification_evidence`. Continue when every remaining discrepancy carries a resolved disposition.

Invoke `document-reviewer` with `doc_type: DesignDoc`, the returned Design Doc path, `review_context: creation`, original user requirements, `confirmed_requirement_context`, the unchanged analysis inputs supplied to the designer, and `verification_evidence`.

- `approved`: continue.
- `needs_revision`: apply Review Resolution, update through technical-designer-frontend, and rerun verification and review for the affected boundary.
- `rejected`: resolve the governing-source conflict; ask the user only when product outcome or a major approved decision must change.

Invoke `design-sync` with the returned Design Doc as source, apply Review Resolution to actionable conflicts, and report `SKIPPED` distinctly when only one Design Doc exists.

Present the applicable UI Spec, Design Doc, accepted ADR paths, recorded declines, and sync result. `[Stop: Design approval]`.

## Completion Criteria

- External and prototype evidence was requested only when it controlled a current decision.
- Scope and Structural Scale were confirmed from outcomes and responsibility boundaries.
- ADRs exist only for points passing both filters, and the batch received one review and approval.
- An applicable UI Spec and a complete frontend Design Doc exist regardless of ADR need.
- Applicable existing UI behavior, contracts, assumptions, states, equivalence, and verification safeguards reached the Design Doc.
- Review Resolution routed only `needs_revision` issues into correction work.
- All stop points received explicit user confirmation.
