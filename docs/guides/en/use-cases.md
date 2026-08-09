# Use Cases and Commands

Start with the [Quick Start](./quickstart.md) if the project is not configured yet. This page maps common development outcomes to the command that owns them.

## Choose a command

### Implementation and investigation

| Command | Outcome |
|---|---|
| `/implement <request>` | Confirm requirements and complete the applicable design, implementation, verification, and commit flow |
| `/task <request>` | Execute one focused task after identifying its scope and applicable skills |
| `/diagnose <problem>` | Investigate a problem, independently verify the cause, and derive supported solutions without implementing one |
| `/review [Design Doc]` | Review backend/general implementation against its Design Doc and security boundary; optionally apply approved corrections |
| `/front-review [Design Doc]` | Run the same review and correction flow for frontend implementation |

### Design and planned execution

| Command | Outcome |
|---|---|
| `/design <request>` | Confirm scope, resolve qualifying ADR decisions, and produce an approved Design Doc |
| `/front-design <request>` | Add a UI Spec when UI decisions remain open, then produce approved frontend design artifacts |
| `/plan [Design Doc]` | Create, review, and approve a Work Plan; optionally generate integration/E2E skeletons first |
| `/front-plan [Design Doc]` | Create and approve a frontend Work Plan |
| `/build [Work Plan]` | Materialize and execute backend/general task files from approved planned work |
| `/front-build [Work Plan]` | Materialize and execute frontend task files from approved planned work |
| `/add-integration-tests [Design Doc]` | Add the smallest integration/E2E set needed to prove accepted behavior in existing code |
| `/reverse-engineer <path>` | Discover existing behavior and generate reviewed PRDs and optional Design Docs |
| `/update-doc [document]` | Update and review an existing PRD, ADR, or Design Doc without continuing into implementation |

### Project knowledge and skills

| Command | Outcome |
|---|---|
| `/project-inject` | Record project-specific prerequisites in `project-context` |
| `/create-skill <knowledge>` | Create a new skill through an interactive hearing and review |
| `/refine-skill <change>` | Apply a targeted change to an existing skill and review the result |
| `/sync-skills` | Synchronize skill metadata after skill content changes |

## Common flows

### Complete a change

```text
/implement Add webhook signature verification
```

Use `/implement` when one request should proceed through its complete lifecycle. It confirms the outcome and exclusions first, then chooses the smallest document and implementation route supported by repository evidence.

### Execute a focused task

```text
/task Fix email validation for addresses containing "+"
```

Use `/task` when the request already has one focused outcome and does not need the full design-to-build workflow.

### Diagnose before choosing a fix

```text
/diagnose Requests intermittently return stale data after an update
```

`/diagnose` reports verified causes and supported solution options. Give a separate implementation instruction after choosing a solution.

### Separate design, planning, and implementation

```text
/design Add webhook signature verification
/plan docs/design/webhook-signature-design.md
/build docs/plans/20260809-feature-webhook-signature.md
```

Use the separate commands when each durable artifact should be approved before continuing or when planned work will be executed in another session.

### Resume existing planned work

```text
/build
```

With no argument, `/build` resolves the consumable task set owned by that recipe. Pass the Work Plan path when more than one plan could be intended. Use `/front-build` for task entries whose executor lane is frontend.

### Review completed implementation

```text
/review docs/design/webhook-signature-design.md
```

The command reviews Design Doc compliance and security. It presents supported findings, applies only the correction set the user authorizes, re-reviews those findings after correction, and runs the final quality check once after review convergence. It does not create review-fix task files.

## Document routing

| Structural Scale | Condition | Durable artifacts |
|---|---|---|
| Small | One coherent outcome has one evident repository-supported implementation inside one responsibility boundary | None |
| Medium | One coherent outcome coordinates a boundary or contains a potentially durable choice | Design Doc → Work Plan |
| Large | Multiple independently valuable outcomes require separate design decisions | PRD → Design Doc → Work Plan |

File count is evidence about the change surface, not the scale rule.

- A technical topic produces an ADR only when at least two credible materially different choices remain and the choice has durable impact. The ADR batch is approved before the Design Doc.
- Frontend/fullstack work produces a UI Spec only while screen, state, interaction, or visual decisions remain open.
- Small work passes its confirmed outcome, governing sources, affected paths, and observable verification directly to implementation. It does not create placeholder documents or task files.

## Test and quality behavior

- Integration/E2E skeletons are selected from accepted behavior and proof obligations. Existing tests count only when they exercise the same boundary and fail for the material failure being covered.
- One scenario may prove several obligations when its assertions keep the failure mapping clear. Different setup or failure modes remain separate.
- `quality-fixer` runs checks discovered from repository configuration and task verification methods, fixes failures owned by the change, and records unavailable checks or unrelated baseline failures.
- A quality result does not claim that an unavailable check passed. Build and review completion reports preserve that limitation.

## Artifact lifecycle

- PRDs, ADRs, UI Specs, and Design Docs are durable governing sources.
- Work Plans hold approved implementation order and task boundaries.
- Materialized task files are execution handoffs. Build recipes delete the task files they consume after the corresponding work is committed.

## Customizing project behavior

Use `/project-inject` for facts and constraints that apply to this repository. Use a skill for reusable judgment that should load only for a particular responsibility. Do not copy feature-specific decisions into a global rule; keep them in the applicable PRD, ADR, UI Spec, or Design Doc.

After changing skill content, run:

```text
/sync-skills
```

See the [Skills Editing Guide](./skills-editing-guide.md) for placement and validation guidance.

The command definitions under `.claude/commands/` are the source of truth for detailed execution behavior.
