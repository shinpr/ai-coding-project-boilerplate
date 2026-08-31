---
description: Execute from codebase-scoped analysis through optional ADR decisions to complete Design Doc approval
---

**Explicit User Instruction**: The user explicitly instructs and authorizes every subagent call named in this recipe. Execute each applicable call when its prerequisites are met.

Execute the `documentation-criteria` skill before document routing or creation.
Execute the `llm-friendly-context` skill before writing Agent prompts, handoffs, or generated artifacts.
Execute the `subagents-orchestration-guide` skill before invoking agents or resolving findings.

## Outcome and Ownership

Coordinate the design phase from repository evidence to an approved Design Doc. The orchestrator owns requirement convergence, Structural Scale, ADR qualification, evidence selection, and Review Resolution. Named specialists own semantic investigation and artifact authorship.

The Design Doc is always the complete implementation design for Medium/Large work. A qualifying ADR batch narrows technical choices before the Design Doc, which retains the complete flow and implementation boundary.

Requirements: $ARGUMENTS

## Flow

```text
requirement source -> codebase-analyzer -> scope/decision confirmation [Stop]
                                             |
                               optional ADR batch -> batch review [Stop]
                                             |
                 Design Doc -> code-verifier -> Review Resolution
                                             |
                     document-reviewer -> design-sync -> approval [Stop]
```

Execute each dependent step after its prerequisite evidence exists. Use Review Resolution for every actionable verifier, reviewer, or design-sync finding. Wait at each `[Stop]` for explicit user confirmation.

At each Agent invocation below, build the prompt as a mechanical extraction: copy the named source values into the exact fields, apply only the declared serialization, then invoke immediately.

## Step 1: Select the Governing Requirement Source

Use the approved PRD path when one exists. Otherwise use the confirmed requirements verbatim.

Set `confirmed_requirement_context` to the approved PRD path exactly. Only when no approved PRD exists, use the orchestrator-confirmed convergence record unchanged.

## Step 2: Collect Decision Material

Invoke `codebase-analyzer` once for the complete confirmed scope with exactly `prd_path: [approved PRD path]`, or `requirements: [confirmed requirements verbatim]` when no approved PRD exists.

Require one valid JSON result and let the analyzer discover affected paths, responsibility boundaries, and cross-layer contracts. Treat its focus areas as existing-behavior safeguards, not as new requirements.

## Step 3: Confirm Scope and ADR Decisions

Execute `requirement-convergence`. The orchestrator builds and judges the convergence record from the user request and Step 2 evidence.

Judge all four convergence fields. Assign `cost` from Step 2 structural evidence and record its unknowns; run the hearing only for fields below `ready`.

Determine Structural Scale from outcomes and responsibility boundaries. File count is supporting evidence only.

Resolve `decisionMaterials.candidateDecisionPoints` against the governing requirement source, `reuse`, and `invalidations`. Remove a point when that evidence already converges on one sufficient approach. For each remaining item, apply documentation-criteria filters in order:

1. Choice requires judgment between at least two credible, materially distinct options inside confirmed scope.
2. The selection has durable material impact.

Record every passing item as `adrDecisionPoints`; an empty list routes directly to the Design Doc.

Present what the user decides on: the outcome and the requirements to build, the exclusions, and the responsibilities the change targets. Add an unknown only when the user must resolve it to confirm that scope. Structural Scale, ADR qualification, and cost evidence stay in the orchestrator record — the ADR batch and the Design Doc have their own approval stops. Offer proceed, or correct scope and re-run analysis. Continue only when every convergence field is `ready` or `weak-but-explicit`. `[Stop: Scope confirmation]`.

## Step 4: Create and Approve an ADR Batch When Needed

When `adrDecisionPoints` is non-empty:

1. Invoke `technical-designer` once with `document_to_create: ADRBatch`, `confirmed_requirement_context`, the ordered `decision_points`, and the corresponding `decision_materials` copied unchanged from Step 2.
2. Invoke `document-reviewer` once with `doc_type: ADRBatch`, `targets: [all returned paths]`, and `confirmed_requirement_context`.
3. Route the verdict first: `approved` proceeds; `needs_revision` applies Review Resolution, updates one ADR per path serially, and re-reviews the complete batch; `rejected` resolves the governing-source conflict before another review.
4. Present one batch decision only after an approved review. `[Stop: ADR batch approval]`.
5. After user approval, update each ADR status to `Accepted` and verify the change.

## Step 5: Create the Design Doc

Invoke `technical-designer` with exactly:

- `document_to_create: DesignDoc`;
- `confirmed_requirement_context`;
- `structural_scale`;
- `adr_paths: [accepted paths or []]`;
- `codebase_analysis: [complete Step 2 JSON unchanged]`.

The Design Doc owns the complete implementation design and retains all applicable downstream safeguards in the documentation-criteria template.

## Step 6: Verify and Resolve Repository Claims

Invoke `code-verifier` with `doc_type: design-doc` and the Design Doc path. Leave `code_paths` absent so future behavior remains intent and current premises and feasibility are verified.

Apply Review Resolution to every discrepancy before document review. Send only `apply` findings to a fresh technical-designer invocation with `Operation Mode: update`, `Existing Document: [Design Doc path]`, and `correction_findings: [complete findings unchanged except for their dispositions]`. The designer applies its review-triggered bounded self-verification gate when a finding names an unverified decision-changing premise; this fresh designer is the sole correction specialist and selects the evidence route. Rerun code-verifier after a correction. Pass the latest verifier result together with the recorded dispositions as `verification_evidence`. Continue only when it contains no unresolved `apply` item.

## Step 7: Review and Approve

Invoke `document-reviewer` with `doc_type: DesignDoc`, `target`, `review_context: creation`, the original user requirements as `requirements_verbatim`, `confirmed_requirement_context`, `codebase_analysis`, and `verification_evidence` from Step 6.

- `approved`: continue.
- `needs_revision`: apply Review Resolution, update through a fresh technical-designer invocation using the existing path and complete findings with an `apply` disposition, then rerun Steps 6-7 for the affected boundary.
- `rejected`: resolve technical governing-source conflicts through Review Resolution; ask the user only when confirmed outcome, desired-future requirements, and non-goals cannot all remain true and the user must choose which changes.

Invoke `design-sync` for consistency with other Design Docs and apply Review Resolution to actionable conflicts. Report `SKIPPED` distinctly when only one Design Doc exists.

Present the Design Doc, accepted ADR paths, recorded declines, and design-sync result. `[Stop: Design approval]`.

## Completion Criteria

- Scope and Structural Scale were confirmed from outcomes and responsibility boundaries.
- ADRs exist only for decision points passing both filters, and the complete batch received one review and approval.
- A Design Doc exists regardless of whether ADRs were needed.
- Applicable existing-behavior, contract, assumption, equivalence, and verification safeguards reached the Design Doc.
- Review Resolution routed only `needs_revision` issues into correction work.
- All stop points received explicit user confirmation.
