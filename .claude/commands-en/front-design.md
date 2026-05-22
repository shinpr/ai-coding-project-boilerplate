---
description: Execute from codebase analysis to frontend design document creation
---

**Command Context**: This command is dedicated to the frontend design phase.

## Orchestrator Definition

**Core Identity**: "I am an orchestrator." (see subagents-orchestration-guide skill)

**Execution Protocol**:
1. **Delegate all work** to sub-agents — your role is to invoke sub-agents, pass data between them, and report results. The one exception is the Step 1 scope bootstrap, a recipe-local orchestrator task limited to locating seed files.
2. **Run the frontend design flow below in order** (this command covers medium/large frontend) — a fixed linear sequence, no branches:
   - Execute: scope bootstrap → codebase-analyzer → [Stop: Scope confirmation] → ui-analyzer → ui-spec-designer → technical-designer-frontend → code-verifier → document-reviewer → design-sync
   - technical-designer-frontend creates a prerequisite ADR when the design involves an architecture decision (per documentation-criteria); the ADR never replaces the Design Doc — the flow always continues through Design Doc creation and the full verification chain
   - **Stop at every `[Stop: ...]` marker** → Wait for user approval before proceeding
3. **Scope**: Complete when design documents receive approval

**subagents-orchestration-guide usage**: Reference the guide for orchestration principles and the Scale Determination table. This command defines its own start order; the guide's requirement-analyzer-origin flow does not apply here.

**CRITICAL**: Execute document-reviewer, design-sync (for Design Docs), and all stopping points — each serves as a quality gate. Skipping any step risks undetected inconsistencies.

## Workflow Overview

```
Requirements → scope bootstrap → codebase-analyzer → [Stop: Scope confirmation]
                                                            ↓
                                                       ui-analyzer
                                                            ↓
                                              ui-spec-designer → [Stop: UI Spec approval]
                                                            ↓
                                              technical-designer-frontend
                                                            ↓
                                              code-verifier → document-reviewer
                                                            ↓
                                                 design-sync → [Stop: Design approval]
```

## Scope Boundaries

**Included in this command**:
- Scope bootstrap: locating seed files so codebase-analyzer receives a populated input
- Codebase analysis with codebase-analyzer (entry point of the frontend design phase)
- Scope confirmation with the user, grounded in codebase-analyzer findings
- UI fact gathering with ui-analyzer
- UI Specification creation with ui-spec-designer (prototype code inquiry included)
- ADR creation as a prerequisite to the Design Doc, when architecture changes, new technology, or data flow changes are involved
- Design Doc creation with technical-designer-frontend
- Design Doc verification with code-verifier (before document review)
- Document review with document-reviewer
- Design Doc consistency verification with design-sync

**Responsibility Boundary**: This command completes with frontend design document (UI Spec/ADR/Design Doc) approval. Work planning and beyond are outside scope.

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
  - `prompt`: include `requirements` (the user requirements verbatim) and `requirement_analysis` — a JSON object with `affectedFiles` (Step 1 seed), `purpose` (the user requirements), `scale` (provisional value from the Scale Determination table applied to the seed file count), `technicalConsiderations` (`{ constraints: [], risks: [], dependencies: [] }`). Analyze the existing codebase for frontend design guidance.

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

### Step 4: UI Fact Gathering
- Invoke **ui-analyzer** using Agent tool
  - `subagent_type: "ui-analyzer"`, `description: "UI fact gathering"`
  - `prompt`: include `requirements` (the user requirements) and `requirement_analysis` — a JSON object with `affectedFiles` (the union of `analysisScope.filesAnalyzed`, `analysisScope.tracedDependencies`, and the `focusAreas[].relatedFiles` paths from the Step 2 codebase-analyzer output), `purpose` (the user requirements), `scale` (the Step 3 confirmed scale), `technicalConsiderations` (`{ constraints: [], risks: [], dependencies: [] }`). ui-analyzer reads the project-context External Resources section, fetches external UI sources via the declared access methods, and analyzes the existing UI codebase.

The codebase-analyzer JSON (Step 2) and the ui-analyzer JSON (Step 4) are reused by ui-spec-designer and technical-designer-frontend.

### Step 5: UI Specification Phase
Ask the user about prototype code.

**Ask the user**: "Do you have prototype code for this feature? If so, please provide the path to the code. The prototype will be placed in `docs/ui-spec/assets/` as reference material for the UI Spec."

- **[STOP]**: Wait for user response about prototype code availability

Then create the UI Specification:
- Invoke **ui-spec-designer** using Agent tool
  - `subagent_type: "ui-spec-designer"`, `description: "UI Spec creation"`
  - Build the prompt by including: the source (an existing PRD in `docs/prd/` when one exists for this feature; otherwise the user requirements with the Step 2 codebase-analyzer JSON and the Step 3 confirmed scope), `ui_analysis` (ui-analyzer JSON from Step 4), and the prototype path when provided. Place prototype in `docs/ui-spec/assets/{feature-name}/`.
- Invoke **document-reviewer** to verify UI Spec
  - `subagent_type: "document-reviewer"`, `description: "UI Spec review"`, `prompt: "doc_type: UISpec target: [ui-spec path] Review for consistency and completeness"`
- **[STOP]**: Present UI Spec for user approval

### Step 6: Design Document Creation Phase
- Invoke **technical-designer-frontend** using Agent tool to create the design documentation. Per documentation-criteria it produces a Design Doc; when the design involves an architecture decision (architecture change, new technology, or data flow change) it first creates the prerequisite ADR.
  - `subagent_type: "technical-designer-frontend"`, `description: "Design documentation creation"`, `prompt: "Create the design documentation for this requirement. Per documentation-criteria, produce a Design Doc; when the design involves an architecture decision, first create the prerequisite ADR. Requirements: [user requirements verbatim]. Codebase analysis: [codebase-analyzer JSON from Step 2]. UI analysis: [ui-analyzer JSON from Step 4]. UI Spec is at [ui-spec path]. Inherit component structure and state design from UI Spec. Present at least two architecture alternatives with trade-offs."`
- Invoke **code-verifier** to verify the Design Doc against existing code.
  - `subagent_type: "code-verifier"`, `description: "Design Doc verification"`, `prompt: "doc_type: design-doc document_path: [Design Doc path] mode: pre-implementation (code_paths omitted — verifier discovers scope from document). Verify Design Doc against existing code."`
- Invoke **document-reviewer** for each document technical-designer-frontend produced — the Design Doc, and the ADR when one was created.
  - Design Doc: `subagent_type: "document-reviewer"`, `description: "Document review"`, `prompt: "doc_type: DesignDoc target: [Design Doc path] mode: composite codebase_analysis: [codebase-analyzer JSON from Step 2] code_verification: [JSON from code-verifier]. Review for consistency and completeness."`
  - ADR (when created): `subagent_type: "document-reviewer"`, `description: "ADR review"`, `prompt: "doc_type: ADR target: [ADR path] mode: composite. Review for consistency and completeness."`
- When the ADR review requires changes, technical-designer-frontend(update) revises the ADR and re-aligns the Design Doc with the corrected ADR — the Design Doc must not stand on an unreviewed or superseded ADR. When this re-alignment changes the Design Doc, re-run code-verifier and the Design Doc document-reviewer on the updated Design Doc so its verification reflects the final content.

### Step 7: Design Consistency Verification
- Invoke **design-sync** using Agent tool.
  - `subagent_type: "design-sync"`, `description: "Design consistency check"`, `prompt: "Check consistency across all Design Docs in docs/design/. Report conflicts and overlaps."`
- **[STOP]**: Present the design document, plus design-sync results for a Design Doc, and obtain user approval

## Completion Criteria

- [ ] Built the Step 1 scope bootstrap seed (or obtained target files from the user when the search returned none)
- [ ] Executed codebase-analyzer with a populated `requirement_analysis`
- [ ] Confirmed the design scope with the user and set the scale from the confirmed target files
- [ ] Executed ui-analyzer; codebase-analyzer (Step 2) and ui-analyzer (Step 4) outputs reused by ui-spec-designer and technical-designer-frontend
- [ ] Created the UI Specification with ui-spec-designer
- [ ] Created the Design Doc with technical-designer-frontend, preceded by a prerequisite ADR when the design involved an architecture decision
- [ ] Executed code-verifier on the Design Doc and passed results to document-reviewer
- [ ] Executed document-reviewer on each produced document (Design Doc, and ADR when created) and addressed feedback
- [ ] Executed design-sync for consistency verification
- [ ] Obtained user approval for the design document

## Output Example
Frontend design phase completed.
- UI Specification: docs/ui-spec/[feature-name]-ui-spec.md
- Design document: docs/design/[document-name].md or docs/adr/[document-name].md
- Approval status: User approved
