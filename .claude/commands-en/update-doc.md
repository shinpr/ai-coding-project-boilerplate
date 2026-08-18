---
description: Update existing design documents (Design Doc / PRD / ADR) with review
---

**Explicit User Instruction**: The user explicitly instructs and authorizes every subagent call named in this recipe. Execute each applicable call when its prerequisites are met.

Execute the `llm-friendly-context` skill (using Skill tool) before writing Agent prompts, handoffs, or generated artifacts.

**Command Context**: This command is dedicated to updating existing design documents.

## Orchestrator Definition

**Core Identity**: "I am not a worker. I am an orchestrator." (see subagents-orchestration-guide skill)

**Execution Gate**: Complete Steps 1-6 in order, following only the branches activated by document type and review result. Advance only through each step's stated evidence, review convergence, or approval condition. Complete after the final approval gate and every applicable Completion Criterion is satisfied.

**Execution Protocol**:
1. **Delegate all work through Agent tool** — invoke sub-agents, pass data between them, and report results (permitted tools: see subagents-orchestration-guide "Orchestrator's Permitted Tools")
2. **Execute update flow**:
   - Identify target → resolve outcome-changing ambiguity → update document → review → consistency check → final approval
3. **Scope**: Complete when updated document receives approval

**CRITICAL**: Complete document-reviewer and the final approval gate.

## Workflow Overview

```
Target document → resolve required input when needed
                        ↓
              technical-designer / technical-designer-frontend / prd-creator (update mode)
                        ↓ (Design Doc only)
              code-verifier → document-reviewer
                        ↓ (Design Doc only)
              design-sync → [Stop: Final approval]
```

## Scope Boundaries

**Included in this command**:
- Existing document identification and selection
- Change content clarification with user
- Document update with appropriate agent (update mode)
- Document review with document-reviewer
- Consistency verification with design-sync (Design Doc only)

**NOT included**:
- New requirement analysis
- Work planning or implementation

**Responsibility Boundary**: This command completes with updated document approval.

Target document: $ARGUMENTS

## Execution Flow

### Step 1: Target Document Identification

Resolve an explicit path first. Otherwise inspect repository documentation locations and conventions, then select files whose content and metadata match Design Doc, PRD, or ADR responsibilities. Treat conventional directories as discovery hints and resolve moved or renamed documents before reporting absence.

**Decision flow**:

| Situation | Action |
|-----------|--------|
| $ARGUMENTS specifies a path | Use specified document |
| $ARGUMENTS describes a topic | Search documents matching the topic |
| Multiple candidates found | Present options with AskUserQuestion |
| No documents found | Report and end (document creation is out of scope) |

### Step 2: Document Type and Layer Determination

Determine type from document path, then determine the layer to select the correct update agent:

| Path Pattern | Type | Update Agent | Notes |
|-------------|------|--------------|-------|
| `docs/design/*.md` | Design Doc | technical-designer or technical-designer-frontend | See layer detection below |
| `docs/prd/*.md` | PRD | prd-creator | - |
| `docs/adr/*.md` | ADR | technical-designer or technical-designer-frontend | See layer detection below |

**Layer detection** (for Design Doc and ADR):
Read the document and determine its layer from content signals:
- **Frontend** (→ technical-designer-frontend): Document title/scope mentions React, components, UI, frontend; or file contains component hierarchy, state management, UI interactions
- **Backend** (→ technical-designer): All other cases (API, data layer, business logic, infrastructure)

**ADR Update Guidance**:
- **Minor changes** (clarification, typo fix, small scope adjustment): Update the existing ADR file
- **Major changes** (decision reversal, significant scope change): Create a new ADR that supersedes the original

### Step 3: Change Content Resolution

Extract the requested outcome, reason, and affected document responsibilities from `$ARGUMENTS` and the current document. Continue directly when those inputs determine the update. Use AskUserQuestion only for a missing decision whose alternatives would materially change document meaning or scope.

Record the resolved changes as the update contract.

**Scope carried into the update**: Pass the confirmed sections, the reason for the change, and any size budget the user stated to the update agent. Before document review, map each changed section to a confirmed change or to a consistency update that change required; request a scope decision for any section changed outside that set or for an update that exceeds a stated budget.

### Step 4: Document Update

Invoke the update agent determined in Step 2:
```
subagent_type: [Update Agent from Step 2]
description: "Update [Type from Step 2]"
prompt: |
  Operation Mode: update
  Existing Document: [path from Step 1]

  ## Changes Required
  [Changes clarified in Step 3]

  Update the document to reflect the specified changes.
  Add change history entry.
```

### Step 5: Document Review

**For Design Doc updates only**: Before document-reviewer, invoke code-verifier:
```
subagent_type: code-verifier
description: "Verify updated Design Doc"
prompt: |
  doc_type: design-doc
  document_path: [path from Step 1]
  Verify the updated Design Doc against current codebase.

  Verification focus: Pay special attention to literal identifier referential
  integrity in the updated sections (paths, endpoints, type names, config keys).
```

Read `summary.status` before continuing: when it is `blocked`, the Input Gate failed and nothing was verified — stop and report `blockingReason` to the user rather than passing the result to document-reviewer, because its empty `discrepancies` would read as a clean verification.

**Store output as**: `$CODE_VERIFICATION_OUTPUT`

Invoke document-reviewer:
```
subagent_type: document-reviewer
description: "Review updated document"
prompt: |
  Review the following updated document.

  doc_type: [DesignDoc / PRD / ADRBatch]
  review_context: update
  target: [path from Step 1] (DesignDoc or PRD)
  targets: [[path from Step 1]] (ADRBatch only)
  requirements_verbatim: [Step 3 requested changes, verbatim] (Design Doc only)
  confirmed_requirement_context: [Step 3 confirmed understanding of the changes] (Design Doc only)
  verification_evidence: $CODE_VERIFICATION_OUTPUT (Design Doc only, omit for PRD/ADRBatch)

  Focus on:
  - Consistency of updated sections with rest of document
  - No contradictions introduced by changes
  - Completeness of change history
```

**Store output as**: `$STEP_5_OUTPUT`

**On review result**:
- `approved` → Proceed to Step 6.
- `needs_revision` → Apply Review Resolution, pass complete `apply` issue objects verbatim to the Step 2 update agent, then rerun verification when applicable and re-review with `prior_feedback`.
- `rejected` → Resolve the governing-source conflict or escalate when user authority is required.

Follow Review Resolution convergence and escalation conditions.

### Step 6: Consistency Verification and Final Approval [Stop]

For PRD or ADR, proceed from the approved document review to the final approval below.

For Design Doc, invoke design-sync:
```
subagent_type: design-sync
description: "Verify consistency"
prompt: |
  Verify consistency of the updated Design Doc with other design documents.

  Updated document: [path from Step 1]
```

**On consistency result**:
- No conflicts → include the result in the final approval summary
- Conflicts detected → Present conflicts to user with AskUserQuestion:
  - A: Return to Step 4 to resolve conflicts in this document
  - B: End command and address conflicts separately

Present the reviewed update and, for a Design Doc, its consistency result for one final user approval. This is the command's single approval gate.

## Error Handling

| Error | Action |
|-------|--------|
| Target document not found | Report and end (document creation is out of scope) |
| Sub-agent update fails | Repair discoverable input or routing errors and retry when the invocation materially changes; otherwise report the failure evidence |
| Reviewer returns `rejected` | Resolve the governing-source conflict or escalate when user authority is required |
| design-sync detects conflicts | Present to user for resolution decision |

## Completion Criteria

- [ ] Identified target document
- [ ] Resolved change content from the request, document, or a necessary user answer
- [ ] Updated document with appropriate agent (update mode)
- [ ] Executed code-verifier before document-reviewer (Design Doc only)
- [ ] Executed document-reviewer and addressed feedback
- [ ] Executed design-sync for consistency verification (Design Doc only)
- [ ] Obtained one final user approval for the reviewed update

## Output Example
Document update completed.
- Updated document: docs/design/[document-name].md
- Approval status: User approved

**Responsibility Boundary**: This command ends with document approval. Work planning and beyond are outside scope.
