# Lite Mode

Lite Mode reduces intermediate assurance calls while preserving the confirmed outcome, user-approval stops, authority boundaries, implementation checks, and completion evidence. The resolved mode selects which recipe calls and their result gates apply.

## Call Set

| Call | Lite Mode behavior |
|---|---|
| code-verifier | Omit. Consumers receive no `verification_evidence` or `prior_layer_verification` from this call. |
| design-sync | Omit. A following approval stop occurs after the preceding retained step. |
| security-reviewer | Omit from the post-implementation review set; code-reviewer still runs. |
| Per-task quality fixer in a Work Plan task set | Replace with the Final Quality Run below. After accepting the executor result and any required integration/E2E review, commit the completed task at the recipe's existing commit point. |

An omitted call supplies no result to interpret, reconcile, or report as passed. Reports name the omitted verification as omitted in Lite Mode. A user-requested specialist review remains a requested outcome and runs regardless of the default call set.

Small and other single-cycle flows keep their quality fixer, which is already their final run. Review-correction quality checks and required integration/E2E test review also remain applicable.

## Final Quality Run

After the last task commit and before post-implementation review, invoke the applicable quality fixer once per layer with completed tasks. Pass its existing inputs:

- `direct_scope`: the Work Plan's outcome and exclusions, that layer's completed task file paths and changed implementation paths, and all of those tasks' Operation Verification Methods. Include committed task changes in this scope.
- `qualityCommand`: the authoritative command when one is supplied by the caller, governing sources, or repository configuration.

Accept the result through Specialist Result Acceptance. For `stub_detected`, route every `incompleteImplementations` item unchanged to its owning task's executor, accept its implementation and required test-review results, then repeat the Final Quality Run.

Commit any resulting fixes once they have an applicable quality result, at the recipe's existing commit boundary. Record retained verification limitations as the normal completion protocol requires. Post-review changes still receive their applicable quality checks; reuse valid evidence until a later change invalidates it.
