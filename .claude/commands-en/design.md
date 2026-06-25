---
description: Execute from codebase analysis to design document creation
---

Execute the `llm-friendly-context` skill (using Skill tool) before writing Agent prompts, handoffs, or generated artifacts.

**Command Context**: This command is dedicated to the design phase.

## Orchestrator Definition

**Core Identity**: "I am not a worker. I am an orchestrator." (see subagents-orchestration-guide skill)

**Execution Protocol**:
1. **Delegate all work through Agent tool** — invoke sub-agents, pass data between them, and report results (permitted tools: see subagents-orchestration-guide "Orchestrator's Permitted Tools"). The one exception is the Step 1 scope bootstrap, a recipe-local orchestrator task limited to locating seed files.
2. **Run the design flow below in order** — a fixed linear sequence, no branches:
   - Execute: scope bootstrap → codebase-analyzer → [Stop: Scope confirmation] → technical-designer → code-verifier → document-reviewer → design-sync
   - technical-designer creates a prerequisite ADR when the design involves an architecture decision (per documentation-criteria); the ADR never replaces the Design Doc — the flow always continues through Design Doc creation and the full verification chain
   - **Stop at every `[Stop: ...]` marker** → Wait for user approval before proceeding
3. **Scope**: Complete when design documents receive approval

**subagents-orchestration-guide usage**: Reference the guide for orchestration principles (Delegation Boundary, Decision precedence, permitted tools) and the Scale Determination table. This command defines its own start order; the guide's requirement-analyzer-origin flow does not apply here.

**CRITICAL**: NEVER skip document-reviewer, design-sync (for Design Docs), or stopping points — each serves as a quality gate.

## Workflow Overview

```
Requirements → scope bootstrap → codebase-analyzer → [Stop: Scope confirmation]
                                                            ↓
                                                    technical-designer
                                                            ↓
                                                    code-verifier → document-reviewer
                                                            ↓
                                                       design-sync → [Stop: Design approval]
```

## Scope Boundaries

**Included in this command**:
- Scope bootstrap: locating seed files so codebase-analyzer receives a populated input
- Codebase analysis with codebase-analyzer (entry point of the design phase)
- Scope confirmation with the user, grounded in codebase-analyzer findings
- ADR creation as a prerequisite to the Design Doc, when architecture changes, new technology, or data flow changes are involved
- Design Doc creation with technical-designer
- Design Doc verification with code-verifier (before document review)
- Document review with document-reviewer
- Design Doc consistency verification with design-sync

**Responsibility Boundary**: This command completes with design document approval.

## Execution Flow

Requirements: $ARGUMENTS

### Step 1: Scope Bootstrap
codebase-analyzer requires a populated `requirement_analysis.affectedFiles`. Build that seed with a lightweight, orchestrator-local pass — locating files only, with no deep reading and no design decisions:

1. Extract candidate keywords from the user requirements (feature names, domain nouns, identifiers).
2. Search the repository with Bash (`rg`, or `grep` when `rg` is unavailable) for files matching those keywords.
3. Collect the matched file paths as the seed `affectedFiles`.
4. **When the search returns no files**: ask the user which files or modules the design targets (AskUserQuestion), and use that answer as `affectedFiles`. If the user confirms no related code exists, report that codebase-grounded design does not apply and confirm with the user how to proceed.
5. **When the search returns more than ~20 files**: the keywords are too broad. Present the most relevant candidates to the user (AskUserQuestion) and confirm the seed `affectedFiles` before proceeding.

This step locates seed files only. Reading files in full, tracing dependencies, and analysis remain codebase-analyzer's responsibility.

### Step 2: Codebase Analysis
- Invoke **codebase-analyzer** using Agent tool
  - `subagent_type: "codebase-analyzer"`, `description: "Codebase analysis"`
  - `prompt`: include `requirements` (the user requirements verbatim) and `requirement_analysis` — a JSON object with `affectedFiles` (Step 1 seed), `purpose` (the user requirements), `scale` (provisional value from the Scale Determination table applied to the seed file count), `technicalConsiderations` (`{ constraints: [], risks: [], dependencies: [] }`)

### Step 3: Scope Confirmation
After codebase-analyzer returns, confirm the design scope with the user before any design work. Use AskUserQuestion.

Present, sourced from the codebase-analyzer JSON:
- **Target files/modules**: `analysisScope.filesAnalyzed` and the modules they belong to
- **Affected layers**: layers touched, derived from `analysisScope.categoriesDetected` and `focusAreas`
- **Unknowns/assumptions**: `limitations` plus any assumptions codebase-analyzer recorded
- **Questions before design**: open points that need a user answer before design proceeds

Ask the user to choose one:
- **Proceed to design with this scope** — continue to Step 4
- **Correct the scope and re-run** — return to Step 1 with the corrected scope; when the user names the corrected files or modules, use those directly as the Step 1 seed
- **Hold additional hearing, then proceed** — gather the missing answers, then continue to Step 4

After the user confirms the scope, count the confirmed target files and set the scale from the Scale Determination table. This confirmed scale supersedes the Step 2 provisional value.

**[STOP]**: Wait for the user's choice before proceeding.

### Step 4: Design Document Creation
1. **technical-designer** → create the design documentation. Pass the user requirements (verbatim), the codebase-analyzer JSON, and the confirmed scope. Per documentation-criteria this is a Design Doc, preceded by a prerequisite ADR when the design involves an architecture decision. Present at least two design alternatives with trade-offs for each.
2. **code-verifier** → Verify the Design Doc against existing code.
3. **document-reviewer** → Quality check of each document technical-designer produced. For the Design Doc: `doc_type: DesignDoc`, pass `codebase_analysis` (the codebase-analyzer JSON) and the code-verifier results. For the ADR (when one was created): `doc_type: ADR`, pass `codebase_analysis`; code-verifier results apply to the Design Doc only. When the ADR review requires changes, technical-designer(update) revises the ADR **and** re-aligns the Design Doc with the corrected ADR — the Design Doc must not stand on an unreviewed or superseded ADR. When this re-alignment changes the Design Doc, re-run code-verifier and the Design Doc document-reviewer on the updated Design Doc so its verification reflects the final content.
4. **design-sync** → Design Doc consistency verification.
   - IF conflicts found → Report to user → Wait for fix instructions → Fix with technical-designer(update)
   - IF no conflicts → proceed
5. User approval — present the Design Doc together with the design-sync results, and WAIT for approval.

## Completion Criteria

- [ ] Built the Step 1 scope bootstrap seed (or obtained target files from the user when the search returned none)
- [ ] Executed codebase-analyzer with a populated `requirement_analysis`
- [ ] Confirmed the design scope with the user and set the scale from the confirmed target files
- [ ] Created the Design Doc with technical-designer, preceded by a prerequisite ADR when the design involved an architecture decision
- [ ] Executed code-verifier on the Design Doc and passed results to document-reviewer
- [ ] Executed document-reviewer on each produced document (Design Doc, and ADR when created) and addressed feedback
- [ ] Executed design-sync for consistency verification
- [ ] Obtained user approval for the design document

## Output Example
Design phase completed.
- Design document: docs/design/[document-name].md
- Consistency: No conflicts with other Design Docs (or fixes completed)

**Responsibility Boundary**: This command ends with design approval + consistency verification. Work planning and beyond are outside scope.
