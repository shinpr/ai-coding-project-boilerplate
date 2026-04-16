# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.20.8] - 2026-04-17

### Added

- **codebase-analyzer: Fact Disposition targets in focusAreas** (agents) — Step 4 enumerates existing facts within change scope. Schema expanded with `fact_id` (format: `<primary-file-path>:<symbol>`), `evidence` (single-form reference string), `factsToAddress` (designer checklist), and `relatedFiles` fields. Cross-layer canonical anchor rule: shared types/schemas/APIs referenced from multiple layers anchor `fact_id` to the canonical source file so per-layer analysis runs produce matching identifiers for the same concept. Priority ordering (branching outcomes > external contracts > domain invariants) with cardinality target 5-15 and explicit overflow handling
- **technical-designer: Fact Disposition Table section** (agents) — Required when Codebase Analysis input is provided. Six-column table (Fact ID / Focus Area / Disposition / Rationale / Evidence / Related Files) with one row per `focusArea`. Dispositions: `preserve` / `transform` / `remove` / `out-of-scope` with specific selection criteria and rationale content guidance per value. Applied to both technical-designer and technical-designer-frontend
- **document-reviewer: Fact Disposition coverage and semantic alignment checks** (agents) — New `codebase_analysis` input parameter. Gate 0 verifies Fact Disposition Table section presence. Gate 1 verifies row-level coverage of every `focusArea`, verbatim carry-through of `fact_id` / `evidence` / `relatedFiles`, and rationale-disposition semantic alignment using whole-phrase judgment with valid/invalid example patterns per disposition
- **design-sync: Disposition conflict detection** (agents) — New extraction target for Fact Disposition Table rows as `(fact_id, disposition)` pairs. Critical conflict type detects same `fact_id` across documents carrying different `disposition` values. Detection scope explicitly documented: same-layer cross-DD conflicts and cross-layer conflicts sharing a common anchor file
- **code-reviewer: Step 4-1 disposition implementation verification** (agents) — Post-implementation verification per disposition row. `remove` rows: cited symbol absent from production code path. `transform` rows: observable behavior matches rationale. `preserve` rows: observable behavior unchanged from pre-change state. `out-of-scope` rows: cited files not modified in the implementation diff. Mismatches produce `dd_violation` findings with specific rationale
- **Cross-Layer Orchestration: serial backend-first flow with symmetric review gates** (skills) — Sequence updated to Backend design → verify → review → Frontend design → verify → review → design-sync. Both document-reviewer invocations carry `[Stop on critical issues]` to block structural defect propagation to the next layer. Backend verification output passed to the frontend designer as `prior_layer_verification`
- **technical-designer-frontend: formal cross-layer inputs** (agents) — Required Information section adds Reviewed Prior-Layer Design Doc, Prior-Layer Review Findings, and Prior-Layer Verification as optional cross-layer-only inputs with explicit usage guidance
- **Cross-Layer Assumptions mechanism** (agents, skills) — Designers record prior-layer claims the design must depend on when those claims remain unverified. Format: `- [claim]: [justification]; verify at [target]`. document-reviewer validates presence (when prior-layer dependencies exist) and verification-target presence per entry. design-template section added
- **Design Doc template: Fact Disposition Table** (skills) — Six-column template added between Code Inspection Evidence and Design sections. L1/L2/L3 inline definition ("verification granularity tiers") added for self-documenting terminology

### Changed

- **Rationale-disposition alignment: semantic judgment over substring matching** (agents) — document-reviewer evaluates rationale as whole phrases against disposition semantics with valid/invalid example patterns per disposition. Eliminates false-positive risk where valid preserve phrasing (e.g., "no change", "unchanged") would have triggered on substring matches. Writer-side guidance in technical-designer and design-template updated symmetrically across all four dispositions
- **Agent-to-agent and skill-to-skill decoupling** (agents, skills) — Direct agent name references replaced with artifact names, passive voice, or parameter names across 52 agent files. Dead skill pointers (references to skills not loaded in the reading context) removed or neutralized across skill files. In-context references that aid precision are preserved (e.g., `task-analyzer` routing table)
- **Scope clarifiers for delegated work** (agents) — Cross-document consistency checks in technical-designer update mode explicitly marked "out of scope for this agent" to remove ambiguity about delegation

### Removed

- **Redundant CLAUDE.md context statement from all subagents** (agents) — Removed "Operates in an independent context without CLAUDE.md principles, executing autonomously until task completion." from 25 EN + 25 JA agent files. Subagents invoked via the Agent tool receive only their own system prompt, environment details, and frontmatter-declared skills — the parent's CLAUDE.md / project memory does not load. The removed statement restated the platform default and added no guidance. `rule-advisor` retains the description-level `(CLAUDE.md required process)` note since it references the caller's obligation, not its own context.

## [1.20.7] - 2026-04-12

### Added

- **codebase-analyzer: Quality assurance mechanism discovery** (agents) — New Step 4 item identifies linters, CI checks, schema validators, and domain-specific constraints (naming conventions, length limits, format requirements) covering affected files. New `qualityAssurance` output section with `mechanisms[]` and `domainConstraints[]`
- **technical-designer: QA mechanism identification in Standards Gate** (agents) — New step evaluates discovered mechanisms as `adopted` (enforced during implementation) or `noted` (observed, not adopted with reason). Recorded in Design Doc "Quality Assurance Mechanisms" section
- **work-planner: QA mechanism extraction and propagation** (agents) — Extracts adopted mechanisms from Design Doc and includes them in work plan header for downstream task reference
- **task-decomposer: File-coverage-based mechanism propagation** (agents) — Deterministic rule matches mechanisms to tasks by file path overlap (exact match or directory prefix). Project-wide mechanisms included in every task
- **quality-fixer: Task file input and mechanism-aware detection** (agents) — New `task_file` optional input parameter. Supplementary detection reads task file QA mechanisms, splits by type: `executable_check` added to command list, `passive_constraint` verified via Grep/file inspection after quality phases. New `taskFileMechanisms` output field. Applied to both quality-fixer and quality-fixer-frontend
- **task-executor: Reference Representativeness check** (agents) — Per-adoption verification with concrete thresholds (≥3 files across different directories = representative). New `dependency_version_uncertain` escalation type when repository-wide verification is insufficient
- **coding-standards: Reference Representativeness section** (skills) — IF-THEN criteria for verifying patterns, APIs, and dependencies before adoption. Failure mode documented. Pattern 5 extended with representativeness check reference
- **technical-spec: Quality Assurance Mechanism Awareness** (skills) — New section before Quality Check Requirements for identifying domain-specific quality mechanisms before executing standard phases
- **Documentation templates: QA Mechanisms sections** (skills) — Design template, plan template, and task template extended with Quality Assurance Mechanisms sections. Mechanism type (`executable_check` / `passive_constraint`) explicitly distinguished
- **Orchestration: task_file passing and updated response specs** (commands/skills) — build, front-build, implement commands always pass task file path to quality-fixer. Orchestration guide updated with `qualityAssurance` in codebase-analyzer handoff, `dependency_version_uncertain` escalation type, and `task_file` input documentation

## [1.20.6] - 2026-04-10

### Added

- **quality-fixer: Incomplete implementation detection gate** (agents) — New blocking Step 1 reviews uncommitted diffs for stub/placeholder code (TODO markers, hardcoded returns, empty bodies) before any quality checks run. Returns `stub_detected` status with structured response; orchestrator routes back to task-executor for completion. Applied to both quality-fixer and quality-fixer-frontend
- **quality-fixer: stub_detected branch handling** (commands/skills) — All consuming commands (build, front-build, implement, add-integration-tests) and orchestration guide updated with `stub_detected` routing in the 4-step task cycle
- **design-sync: Match Basis Rules with confidence levels** (agents) — Replaced "Same Concept Criteria" with structured match rules. High confidence (exact_string, explicit_alias) produces confirmed conflicts; medium confidence (same_endpoint_role, same_integration_role, same_ac_slot) produces candidate conflicts with required structural evidence. Output split into CONFIRMED_CONFLICTS and CANDIDATE_CONFLICTS sections
- **code-verifier: Literal identifier referential integrity** (agents) — New evidence rule verifies that concrete identifiers in documents (paths, endpoints, type names, config keys) have corresponding codebase definitions. Single authoritative definition sufficient for high confidence (exception to 2-source rule)
- **technical-designer: Dependency Inventory for update mode** (agents) — Required step before document modification: extract literal identifiers from update scope, verify against codebase and Accepted ADRs, output structured inventory with conflict flags. Applied to both technical-designer and technical-designer-frontend
- **investigator: Execution path mapping and node-by-node fault check** (agents) — Replaced hypothesis model with failure point model. New Step 3 traces execution paths per symptom (pathMap); new Step 4 checks each node for faults with explicit criteria and checkStatus (supported/weakened/blocked/not_reached). Multiple failure points preserved across layers
- **verifier: Path coverage check and independent failure point evaluation** (agents) — Replaced ACH (alternative hypothesis generation + single-winner selection) with coverage-based verification. New Step 4 checks pathMap completeness; Step 6 evaluates each failure point independently with failurePointRelationships. Coverage assessment (sufficient/partial/insufficient) replaces confidence (high/medium/low)
- **solver: Coverage-based recommendation strategy** (agents) — Accepts confirmedFailurePoints and coverageAssessment instead of causes and confidence. Failure points with blocked/not_reached status routed to residualRisks. Bash tool added
- **diagnose: Coverage gate before solver** (commands) — New Step 4 blocks solver invocation until coverageAssessment=sufficient. Insufficient/partial loops back to investigator (max 2 iterations) before offering user choice to proceed
- **acceptance-test-generator: Reserved E2E slot for user-facing journeys** (agents) — Multi-step user journey definition added with 3 conditions and user-facing vs service-internal classification. Budget enforcement reserves 1 E2E slot for user-facing journeys regardless of ROI threshold
- **integration-e2e-testing: Multi-Step User Journey definition** (skills) — System-type-specific boundary definitions (Web/Mobile/CLI/API), classification scope for reserved slot vs normal ROI path vs E2E Gap Check
- **work-planner: E2E Gap Check** (agents) — Warns when no E2E skeletons provided and Design Doc contains user-facing multi-step journey. Skipped when e2eAbsenceReason is provided from upstream
- **documentation-criteria: UI Spec in skill description** (skills) — Added UI Spec to skill description trigger for improved routing precision

### Changed

- **acceptance-test-generator: ROI calculation fix** (agents) — Removed cost division from ROI formula (was mathematically broken — E2E could never reach threshold). Raw score (0-120) now used for same-type ranking. Push-down analysis preserves E2E candidates that are part of multi-step journeys
- **acceptance-test-generator: Nullable E2E contract** (agents/commands/skills) — generatedFiles.e2e is now nullable with e2eAbsenceReason. Contract propagated through plan, front-plan, implement, and orchestration guide. 3 Generation Report patterns (e2e emitted / e2e null / both null)
- **design-sync: sync_status contract alignment** (skills) — Orchestration guide updated from synced/conflicts_found to NO_CONFLICTS/CONFLICTS_FOUND matching design-sync actual output
- **quality-fixer: blocked condition logic** (agents) — Fixed AND/OR logic inversion in Japanese version. All 3 conditions must be simultaneously met (multiple valid fixes AND business judgment required AND all confirmation methods exhausted)
- **quality-fixer: Task-scoped stub detection** (agents) — git diff HEAD scoped to task-relevant files when orchestrator provides file list, preventing false positives from unrelated changes in multi-change branches
- **PRD template: Sequential AC IDs** (skills) — AC format changed from flat `AC:` to sequential IDs (AC-001, AC-002, ...) for downstream traceability. Template shows 1-requirement-multiple-AC pattern
- **UI Spec template: Semantic design tokens** (skills) — Flat token table replaced with semantic sub-sections (Color Roles, Typography Hierarchy, Spacing Scale, Elevation, Border Radius). Responsive Behavior table replaces flat breakpoint list. State x Display Matrix expanded with concrete component references

## [1.20.5] - 2026-04-06

### Added

- **work-planner: Design-to-Plan Traceability** (agents) — New Step 5 scans all DD sections and extracts technical requirements into five categories (impl-target, connection-switching, contract-change, verification, prerequisite). Each item is mapped to a covering task in a Traceability table. Items without a covering task are marked as `gap` with mandatory justification; the plan remains in draft status until all gaps are user-confirmed
- **plan-template: Design-to-Plan Traceability section** (skills) — Traceability table template with sample rows for both `covered` and `gap` entries, category value definitions, and gap status definitions
- **design-template: Interface Change Matrix** (skills) — New section after Change Impact Map documenting existing-to-new interface mappings with conversion requirements and compatibility methods
- **design-template: Verification Method column** (skills) — Integration Points List expanded with Verification Method column to explicitly capture how each switching point is verified
- **orchestration-guide: Gap handling for work-planner handoff** (skills) — Orchestrator must present gap entries to user, keep plan in draft until confirmed, and block downstream agents (task-decomposer, etc.) until all gaps are resolved. Unjustified gaps are errors returned to work-planner

### Changed

- **work-planner: Output Policy gap exception** (agents) — Added explicit exception to the immediate-output policy: plans containing `gap` entries are output as draft and require user confirmation before finalizing
- **work-planner: Category table simplified** (agents) — Removed Task Requirement column (redundant with Traceability table's Category column). Category values now use short codes (impl-target, etc.) matching the Traceability table directly
- **orchestration-guide: technical-designer → work-planner handoff deduplicated** (skills) — Replaced inline category descriptions with reference to work-planner Step 5, establishing work-planner as single source of truth for category definitions

## [1.20.4] - 2026-04-05

### Added

- **codebase-analyzer: Deep call chain tracing** (agents) — Replaced shallow public-interface-only extraction with full-depth analysis. All visibility levels (public, private, internal) are now extracted with recursive call chain tracing within modules. External dependencies are traced to public interface only. Chains exceeding 10 unique functions record the remainder in `limitations`
- **codebase-analyzer: Data transformation pipeline detection** (agents) — New `dataTransformationPipelines` output field traces step-by-step input→output mapping for requirement-relevant entry points, including external resource lookups (master tables, config, constants) that modify output values
- **codebase-analyzer: `visibility` field in output schema** (agents) — `existingElements` schema now includes `visibility` (public/private/internal) and `method` as a category option, matching the expanded extraction requirements
- **technical-designer: Output comparison requirement** (agents) — Designs that replace or modify existing behavior must define a concrete output comparison method (identical input, expected output fields, diff method). When codebase analysis provides `dataTransformationPipelines`, each pipeline step must be covered
- **technical-designer: Early verification exception clause** (agents) — Default early verification point for replacements/modifications is output comparison. Exception: when primary risk is not behavioral equivalence (e.g., schema compatibility, integration contract), specify alternative target and document why output comparison is deferred
- **document-reviewer: Output comparison check** (agents) — Missing output comparison for changes that replace or modify existing behavior → `critical` issue. Uncovered `dataTransformationPipelines` steps → `important` issue
- **design-template: Output Comparison section** (skills) — New section under Verification Strategy for behavioral equivalence verification: comparison input, expected output fields, diff method, and transformation pipeline coverage
- **orchestration-guide: Pipeline bridge** (skills) — codebase-analyzer → technical-designer bridge now passes `dataTransformationPipelines` to inform Verification Strategy in addition to Existing Codebase Analysis

### Changed

- **technical-designer: Full method inventory** (agents) — Removed "about 5 important ones if over 10" limit. Now requires listing every public method with full signatures to prevent investigation shortcuts that lead to incomplete design documents

## [1.20.3] - 2026-04-04

### Added

- **code-reviewer: Identifier Verification** — Extract identifier specifications (resource names, endpoint paths, config keys, schema names) from Design Doc and verify exact string match against implementation. Added `identifierMatchRate` and `identifierVerification[]` to output schema
- **code-reviewer: Evidence-Based Confidence** — Multi-source evidence collection (primary: implementation, secondary: tests, tertiary: config/types) with high/medium/low confidence per AC. Added `evidence_source` field to track tool provenance per determination
- **code-reviewer: Finding Classification** — Quality findings categorized as `dd_violation`/`maintainability`/`reliability`/`coverage_gap` with category-specific rationale requirements. Output Self-Check ensures every finding cites file:line and tool name
- **Post-Implementation Verification** (commands, skills) — `build` and `front-build` now run code-verifier and security-reviewer in parallel after all tasks complete. Pass/fail criteria defined in orchestration guide with max 2 fix cycles before escalation
- **front-design: Workflow Overview** — ASCII flow diagram showing the full design pipeline with stop points
- **front-design: Completion Criteria** — Explicit checklist of required steps before design phase is complete
- **front-design: design-sync step** — Added Step 4 for cross-document consistency verification before final approval
- **ADR template: Architecture Impact section** — Documents how the decision affects existing components, dependencies, and constraints
- **ADR template: Rejected status** — Added to status options alongside Proposed/Accepted/Deprecated/Superseded
- **PRD template: User Journey and Scope Boundary diagrams** — Required mermaid diagrams added to template
- **PRD template: MoSCoW prioritization** — Must Have(P1)/Should Have(P2)/Could Have(P3)/Won't Have structure replaces Must/Nice to Have/Out of Scope
- **PRD template: Quantitative success metrics format** — Each metric specifies numeric target, measurement method, and timeframe
- **Design template: Error Handling table** — Free-text placeholder replaced with structured table (Category, Example, Detection, Recovery, User Impact)
- **Design template: Logging sub-categories** — Structured log events, levels, sensitive data handling, and monitoring requirements
- **Plan template: Hybrid option** — Option C added for hybrid implementation approach alongside Vertical Slice and Horizontal Slice
- **Security checks: Detection approach** — Added concrete detection methods for Access Control Gaps and Mishandling of Exceptional Conditions patterns

### Changed

- **BP-001 Negative → Positive form** (agents, 17 files) — Converted negative instructions to positive directives across all agent definitions. "Don't forget test creation" → "Include test creation in every task", "No contradiction with PRD" → "All requirements align with PRD", "any prohibited" → "use strict types", etc.
- **BP-002 Vague → Concrete** (agents, skills) — Replaced ambiguous expressions with measurable criteria. "avoid excessive detail" → "include only information required for task execution and verification", "measurable format" → "each metric specifies a numeric target, measurement method, and timeframe"
- **Emoji markers removed** (agents) — Removed ✅/❌ markers from instruction contexts (quality-fixer, requirement-analyzer, technical-designer-frontend, build, front-build). Retained only in user-facing output templates
- **documentation-criteria: Excludes → Scope** (skills) — Separate Includes/Excludes blocks consolidated into single Scope statement per document type, reducing duplication
- **documentation-criteria: QA phase unified** (skills) — Per-approach "Final Phase: Quality Assurance" entries consolidated into single "All approaches" statement
- **orchestration-guide: First Action Rule simplified** (skills) — Mermaid diagram and duplicate text replaced with single-line rule
- **orchestration-guide: Redundant sections removed** (skills) — Required Dialogue Points, Decision Flow diagram, duplicate orchestrator roles compressed
- **orchestration-guide: Medium frontend flow reordered** (skills) — UI Spec creation moved before codebase analysis to match large-scale flow and front-design command — component structure informs technical design
- **orchestration-guide: code-verifier description expanded** (skills) — Now documents both pre-implementation and post-implementation verification modes with status field values
- **front-design: Execution Protocol** (commands) — Replaced role/method block with structured protocol referencing orchestration guide. Documents UI Spec → codebase-analyzer ordering rationale
- **front-plan: Test skeleton mandatory** (commands) — Removed optional user confirmation — acceptance-test-generator always executes before work-planner per orchestration guide flow
- **front-build: Streamlined** (commands) — Removed redundant Execution Method, Sub-agent Invocation Method, and Structured Response Specification sections. Scope line added to Execution Protocol
- **front-review: Orchestrator identity** (commands) — Added Orchestrator Definition with TaskCreate-first action. Replaced rule-advisor with documentation-criteria in fix flow. Step numbering unified (Step 1-11)
- **review/front-review: Re-validation context** (commands) — Re-validation prompts now include Design Doc path and implementation file list alongside prior issues
- **review/front-review: Report template** (commands) — Added identifierMatchRate, confidence levels, identifier mismatches, and quality findings sections
- **skills-index.yaml** (skills) — Removed deleted sections from orchestration-guide entry (Decision Flow, Required Dialogue Points)

## [1.20.2] - 2026-04-03

### Added

- **Delegation Boundary: What vs How** (subagents-orchestration-guide): Orchestrator lacked a definition of what granularity to pass to specialists vs what to let them decide autonomously. Added what/where/constraints vs how separation, Bad/Good comparison table, 4-tier decision precedence for conflict resolution, and escalation rule for undeterminable execution methods
- **Scope granularity per agent type**: Executor agents receive task file paths by default (broader scope requires explicit user request); discovery/review agents receive directory or package scope with read-only access
- **quality-fixer blocked handling subsection** (Structured Response Specifications): Moved quality-fixer's multi-branch decision logic from an overloaded table cell into a dedicated subsection for scannability

### Changed

- **Prohibited Actions → positive-form Required Actions**: Negative instructions ("don't investigate directly", "don't skip requirement-analyzer") caused Pink Elephant Problem. Converted to affirmative delegation instructions ("Delegate all investigation to requirement-analyzer or codebase-analyzer")
- **Structured Response Specifications table format**: Bullet list with mixed-length entries replaced with Agent / Key Fields / Decision Logic table. Each agent's response-to-action mapping is now explicit
- **Consistency verification constraint**: Vague "prioritize these guidelines" replaced with reference to Decision precedence in the Delegation Boundary section
- **Remaining negative-form instructions cleaned**: "no modification" → "read-only access", "instead of guessing" removed, "higher-precedence source" → explicit "user instructions first, then design artifacts"
- **Japanese version: missing operational line added**: "フロー実行中は規模判定表に従って次のサブエージェントを決定する" was present in English but missing in Japanese

## [1.20.1] - 2026-04-02

### Added

- **Verification Strategy flow**: Design Doc → Work Plan → Task pipeline now propagates how correctness is proven. Design template includes Correctness Proof Method and Early Verification Point sections. Work Plan template carries the strategy summary. Task template includes Operation Verification Methods derived from the strategy.
- **Adaptive Phase Division Criteria**: Work Plan phase structure now adapts to implementation approach — vertical slice produces value-unit phases, horizontal slice retains Foundation → Core → Integration → QA, hybrid uses vertical as base with horizontal foundation phases. Plan template provides Option A/B with explicit instruction to delete the unused option.
- **Verification Strategy review gates**: document-reviewer Gate 0 checks existence; Gate 1 checks quality (measurability, risk coverage, early verification concreteness, timing alignment with approach)
- **Verification Strategy propagation in task-decomposer**: New section derives per-task Operation Verification Methods from the work plan's strategy, with concrete instantiation rules for early verification and per-task verification
- **technical-designer → work-planner bridging**: Orchestration guide documents Verification Strategy handoff between design and planning phases

### Changed

- **Agent cross-references removed**: Agent definitions no longer reference other agents by name. `requirement-analyzer` → `requirement analysis`, `code-verifier` → `code verification`, `codebase-analyzer` → `codebase analysis phase`, etc. Orchestration layers own routing decisions.
- **Acceptance criteria format**: technical-designer and technical-designer-frontend checklist item updated from "concrete trigger, action, and expected result" to "user-observable behaviors, integration/E2E oriented, CI-isolatable"
- **testSkeletons input contract**: work-planner now describes format expectations (comment-based skeletons, not implemented tests) instead of naming the producer agent
- **Command self-references removed**: update-doc no longer redirects to other commands; out-of-scope items stated without naming alternatives
- **Japanese terminology unified**: `確認レベル` (confirmation level) → `検証レベル` (verification level) across all agents, skills, and skills-index to match English `Verification Level Definitions`
- **skills-index.yaml updated**: `confirmation-levels` tag → `verification-levels`; `verification-strategy` tag and `Phase Division Criteria` section added to documentation-criteria

## [1.20.0] - 2026-04-01

### Added

#### Evidence-Based Design Pipeline

Design Docs are now based on explicit codebase evidence before implementation starts, with structured verification before review.

- **codebase-analyzer agent** (new): Analyzes existing codebase before Design Doc creation, producing structured JSON guidance (existing elements, data models, constraints, focus areas) for technical-designer
- **code-verifier in design flow**: Inserted before document-reviewer so review uses structured verification evidence instead of relying solely on the designer's investigation
- **Design Doc template: Test Boundaries section**: Mock boundary decisions, data layer testing strategy, and integration verification points — gives downstream test generation explicit mock/real scope
- **Design flow updated** (all orchestration paths): requirement-analyzer → codebase-analyzer → technical-designer → code-verifier → document-reviewer → design-sync. ADR-only flows skip codebase-analyzer and code-verifier. Step counts updated (Large: 11→13 backend, Medium: 7→9 backend)
- **Cross-layer orchestration**: codebase-analyzer ×2 and code-verifier ×2 steps added for per-layer analysis in fullstack flows

#### Investigation Targets for Task Execution

Task executors now read and record observations from specified files before implementing, reducing implementations that contradict actual system behavior.

- **task-decomposer**: Generates Investigation Targets per task based on task nature (existing code modification, new feature, test implementation, E2E setup, bug fix)
- **task-executor / task-executor-frontend**: Phase Entry Gate (4 checkboxes, BLOCKING) and Completion Gate (4 checkboxes, BLOCKING) enforce investigation before implementation. New `investigation_target_not_found` escalation type
- **Task template**: Investigation Targets section added with observation recording step in Red phase

#### E2E Environment Prerequisites

- **work-planner**: Extracts environment prerequisites from E2E skeletons (2-stage: detect precondition patterns → generate Phase 0 setup tasks for seed data, auth fixtures, service mocks, environment config)
- **quality-fixer / quality-fixer-frontend**: New `missing_prerequisites` blocked type distinguishes environment failures from specification conflicts, with structured `missingPrerequisites[]` response including concrete resolution steps
- **E2E environment prerequisites reference** (new): Seed data strategy, authentication fixture patterns, environment checklist

### Changed

- **quality-fixer success contract**: Unified on `status: "approved"` as the primary success indicator. Removed legacy `approved: true` field from JSON examples
- **quality-fixer blocked contract**: Split into two response formats — `specification conflict` and `missing prerequisites` — discriminated by `reason` field
- **Annotation syntax**: Made language-agnostic across work-planner, integration-test-reviewer, integration-e2e-testing skill (removed hardcoded `//` prefix from annotation pattern definitions while keeping TypeScript code examples unchanged)
- **@real-dependency annotation**: Added to skeleton spec (integration-e2e-testing) and work-planner annotation patterns, completing the producer→consumer chain from acceptance-test-generator
- **document-reviewer**: Added `code_verification` input parameter, data design completeness check (co-occurrence rule for data keywords), and code-verifier integration rules
- **technical-designer / technical-designer-frontend**: Added Codebase Analysis input parameter for consuming codebase-analyzer output
- **code-verifier**: Added data layer element enumeration in reverse coverage (dataOperationsInCode, testBoundariesSectionPresent)
- **orchestration guide**: Updated escalation_type list to include `similar_component_found` (frontend executor alignment). Added Call Examples for codebase-analyzer and code-verifier. Information bridging sections for codebase-analyzer→technical-designer and code-verifier→document-reviewer
- **typescript-testing skill**: Added Data Layer Testing section (mock limitations, when mocks are appropriate/insufficient, real database testing options, AI schema hallucination awareness)
- **skills-index.yaml**: Added `Data Layer Testing` section to typescript-testing, added e2e-environment-prerequisites reference to integration-e2e-testing
- **commands**: design, front-design, implement, reverse-engineer, update-doc updated to include codebase-analyzer and code-verifier in their flows

## [1.19.1] - 2026-03-30

### Changed

- Migrate circular dependency checker from madge to dpdm. madge has stale indirect dependencies with known security vulnerabilities (brace-expansion ReDoS) that are not being addressed upstream. dpdm is actively maintained and uses TypeScript compiler API directly with a shallower dependency tree.
- Remove `.madgerc` config file (settings migrated to dpdm CLI options)
- Remove unused `check:deps:graph` script

## [1.19.0] - 2026-03-30

### Changed

- Bump minimum Node.js version from >=20 to >=22 (Node 20 EOL: 2026-04-30)

## [1.18.7] - 2026-03-30

### Fixed

#### Skill Review False Positives from LLM-Consumer Unawareness

skill-reviewer was applying BP patterns as if skills were human-facing documents, causing false positives that blocked valid skill content.

- **BP-002**: Expressions resolvable from input context (e.g., "where the user left gaps" when the user's prompt is available) were flagged as vague. Added skill exception — deterministic operations derived from available input are not vague.
- **BP-005**: Standard technical terms already in the LLM's baseline knowledge were flagged as undefined. Added skill exception — only project-specific terms, internal naming conventions, and domain jargon outside the LLM's general knowledge require explicit definition.
- **Principle 2 (Deduplication)**: Mentions of the same concept at different structural roles (e.g., classification framework vs execution detail) were flagged as duplicates. Refined criteria — re-mentions at different structural roles are permitted when they add new constraints or criteria.

## [1.18.6] - 2026-03-29

### Fixed

#### Skill Optimization Workflow Precision

The skill creation and review workflow had several precision gaps: descriptions lacked project-specific trigger alignment, quality gates were observational rather than enforcing, BP-001 exceptions were vague enough to allow misuse, and the creator agent had no modification mode for targeted edits.

**Description as trigger mechanism**
- `skill-creator`: Description generation now requires **user phrases** and **project-specific value** as mandatory inputs, wired into the template `{Verb}s {what} using {project-specific criteria}. Use when {user phrases}.`
- `creation-guide`: Add core principle — description is an agent's trigger mechanism, not a human summary
- `creation-guide`: Add 4-item description quality checklist (project-specific terms, user phrases, user intent focus, general-knowledge-only warning)

**Progressive Disclosure as quality gate**
- `skill-reviewer`: Tier 1 (description quality) failure now blocks grade A/B — previously reported but did not affect grading
- `review-criteria`: Grading table updated with Tier 1 pass as explicit condition for A/B

**BP-001 exception tightening**
- `skill-optimization SKILL.md`: Replace vague "safety-critical/destructive" exception with strict 4-condition AND test: (1) single-step state destruction, (2) caller cannot normally recover, (3) operational constraint not quality policy, (4) positive form would blur scope
- Add concrete boundary examples (permitted vs must-rewrite negative instructions)
- `skill-reviewer`: Add `patternExceptions` output with per-condition evidence fields for auditable exception judgments

**Operational Constraints (BP-001 self-application)**
- `skill-creator`, `skill-reviewer`: Convert "Prohibited Actions" sections to positive-form "Operational Constraints" — the agents' own prohibition lists violated BP-001

**Modification mode**
- `skill-creator`: Add dual-mode operation (creation/modification) — modification mode applies targeted section-level changes while preserving unaffected content verbatim, with `changesSummary` output
- `refine-skill`: Route changes through skill-creator modification mode instead of direct editing

**Knowledge cutoff protection**
- `skill-creator`, `skill-reviewer`: Add WebSearch for verifying time-sensitive domain knowledge (API changes, deprecations, SDK versions) to prevent outdated suggestions caused by the LLM's knowledge cutoff date
- `skill-creator`: Add `researchFindings` output recording adopted/rejected findings with rationale

**Knowledge collection improvements**
- `create-skill`: Add Round 2 (project-specific value validation) — warns when skill contains only general knowledge unlikely to trigger at runtime
- `create-skill`: Add trigger phrase classification (skill-dependent vs pattern-copyable) in Round 3 with minimum 1 skill-dependent phrase requirement
- `create-skill`: Add practical artifacts collection in Round 4 (existing files, past failures, PRs)

**Cross-skill discovery**
- `skill-creator`, `skill-reviewer`, `create-skill`, `refine-skill`: Extend Glob paths to include `~/.claude/skills/*/SKILL.md` for detecting overlap with user-level skills

## [1.18.5] - 2026-03-29

### Fixed

#### Dependency Existence Verification in Design Workflow
Design documents could describe components as "existing" without verification, causing implementation failures when those dependencies turned out to be missing or mismatched.

- `technical-designer` / `technical-designer-frontend`: Add **Dependency Existence Verification** step to Existing Code Investigation — each assumed dependency is now verified via Grep/Glob before design proceeds, with three-way classification (found in codebase / external dependency / requires new creation)
- `document-reviewer`: Add **dependency realizability check** to Gate 1 — cross-checks claimed "existing" dependencies against the codebase during review. Missing dependency with no external source → `critical` (feasibility). Signature mismatch (method names, parameter types, return types) → `important` (consistency)

## [1.18.4] - 2026-03-28

### Fixed

#### Work-Planner Invocation Clarity
- `subagents-orchestration-guide`: Small Scale flow now explicitly names work-planner agent
- `plan` command: Step 3 rewritten with explicit `subagent_type` and conditional prompt branching (with/without test skeletons)
- `front-plan` command: Differentiate placeholder names (`[integration test path]` / `[E2E test path]` instead of identical `[path from step 2]`)
- `build` / `front-build` commands: Split "Neither exists" state into Design Doc present (invoke work-planner) vs absent (report and stop)
- `implement` command: Add explicit `subagent_type: "work-planner"` to test information communication section

#### Skills Index Sync
- `skills-index.yaml` (en): Remove stale parenthetical from coding-standards Security Principles section name
- `skills-index.yaml` (en): Add missing `Test Design Patterns` section to frontend-typescript-testing
- `skills-index.yaml` (ja): Remove stale `References` and `アンチパターン` sections from frontend-typescript-testing, add missing `テスト設計パターン`

## [1.18.3] - 2026-03-26

### Changed

#### Test Workflow: Skeleton-Based Single Source of Truth
- `design-template`: Remove Test Strategy section — test design responsibility moved to acceptance-test-generator skeletons
- `design-template`: Integration Points change from Verification to Contract (interface/API contract)
- `plan-template`: Remove Operational Verification Procedures from all phases — replaced by test skeleton file path references
- `plan-template`: Completion criteria updated to reference skeleton-based test results
- `work-planner`: Replace operational verification with test skeleton placement rules (integration tests in corresponding phases, E2E in final phase)
- `work-planner`: Add fallback for when test skeletons are not provided (AC-based test planning)
- `documentation-criteria`: Design Doc definition removes E2E verification; Work Plan references skeleton file paths
- `task-decomposer`: Phase completion content references skeleton file paths instead of copying E2E verification from Design Doc
- `technical-designer` / `technical-designer-frontend`: Replace E2E verification checklist with testable AC quality gate (concrete trigger, action, expected result)
- `technical-designer-frontend`: Add typescript-testing skill with Applying to Implementation entry

#### add-integration-tests: Fullstack Support
- Support backend, frontend, and fullstack test generation (previously backend-only)
- Document discovery with filename-based classification and user confirmation GATE
- Per-Design-Doc skeleton generation (aligned with acceptance-test-generator single-doc contract)
- Layer-specific task file naming for deterministic agent routing (`*-backend-task-*` / `*-frontend-task-*`)
- Input validation for empty arguments

## [1.18.2] - 2026-03-26

### Changed

#### Investigation Depth Consistency
- `code-verifier`: Section-by-section claim extraction with minimum 20 claims threshold and score stability constraint
- `code-verifier`: Tool-backed evidence rules requiring Glob/Grep confirmation for existence, behavioral, and identifier claims
- `code-verifier`: Reverse coverage assessment (code-to-document direction) enumerating routes, test files, and public exports
- `investigator`: Structured source table with minimum investigation actions per source type, replacing vague bullet list
- `investigator`: Tracking depth check replacing "shallow tracking signs" with explicit stop condition requirement
- `verifier`: Structured triangulation supplementation with source type gap analysis

#### Reverse-Engineer Workflow Accuracy
- `prd-creator`: 7-step reverse investigation protocol (route enumeration → entry point tracing → data model → tests → roles → spec → confirmation)
- `prd-creator`: Exact code transcription requirement for identifiers, URLs, and parameter names
- `prd-creator`: Scope expansion from entry points when external scope is provided
- `scope-discoverer`: Unit inventory enumeration (routes, test files, public exports) per discovered unit, propagated to downstream agents
- `scope-discoverer`: Step renumbering (4.5 → 5, subsequent steps shifted to 6-9)
- `technical-designer` / `technical-designer-frontend`: Reverse-engineer operation mode with mode-separated checklists
- `reverse-engineer`: Independent verifier scope discovery (code_paths intentionally omitted)
- `reverse-engineer`: verifiableClaimCount ≥ 20 quality gate
- `reverse-engineer`: unitInventory propagation to Design Doc generation

#### Diagnostic Workflow
- `diagnose`: Structured investigator prompts passing taskEssence and investigationFocus
- `diagnose`: Expanded quality checks with 6 specific criteria and re-run prompt template

#### Agent Structure
- Removed redundant "Core Responsibilities" sections from 5 agents (code-verifier, investigator, scope-discoverer, verifier) — content preserved in execution steps
- `technical-designer` / `technical-designer-frontend`: Consolidated integration point contracts, removed ADR template duplication
- `technical-designer` / `technical-designer-frontend`: Research guidelines condensed with reverse-engineer mode skip rule

## [1.18.1] - 2026-03-25

### Added

#### Structured JSON Output Enforcement
- Explicit "Return JSON Result" step added to all 15 agents (EN/JA) to ensure consistent structured JSON output
- Completion criteria updated with "Final response is the JSON output" check across all agents

#### Scope Discovery Improvements
- `scope-discoverer`: PRD unit grouping (step 7) with `valueProfile` metadata (`targetPersona`, `userGoal`, `valueCategory`)
- `scope-discoverer`: `prdUnits` array in output format for downstream document generation
- `reverse-engineer`: Updated to use `prdUnits` with quality gate validation (sourceUnits completeness check)
- `reverse-engineer`: Human review point now presents PRD unit grouping for confirmation

#### Document Update Layer Detection
- `update-doc`: Auto-detect frontend/backend layer from document content for correct agent selection (`technical-designer` vs `technical-designer-frontend`)

### Changed

- `quality-fixer` / `quality-fixer-frontend`: "User Report" section replaced with "Intermediate Progress Report" to clarify final output must be JSON
- `scope-discoverer`: "Merge signals" renamed to "Cohesion signals" with note that grouping is deferred to step 7
- `investigator`: Step 4 renamed from "Impact Scope Identification and Output" to "Impact Scope Identification"
- `solver`: Step 5 renamed from "Implementation Steps Creation and Output" to "Implementation Steps Creation"

### Fixed

- Added missing "Applying to Implementation" sections to 5 Japanese agent definitions (`code-reviewer`, `acceptance-test-generator`, `design-sync`, `integration-test-reviewer`, `requirement-analyzer`) that caused JA agents to operate without skill loading instructions

## [1.18.0] - 2026-03-21

### Added

#### Security Review Integration
- New `security-reviewer` agent (EN/JA) with 4-category finding classification (`confirmed_risk`, `defense_gap`, `hardening`, `policy`) and structured rationale
- Security check reference (`references/security-checks.md`) with stable and trend-sensitive detection patterns in coding-standards skill
- Security Principles section (Secure Defaults, Input and Output Boundaries, Access Control, Knowledge Cutoff Supplement) in coding-standards skill
- Security Review step in `build`, `front-build`, `implement` commands — invoked after all task cycles complete
- `security-reviewer` integrated into `review` and `front-review` commands as parallel validation alongside `code-reviewer`
- `requiresTestReview` boolean field in task-executor/task-executor-frontend structured responses
- Prompt Construction Rule in subagents-orchestration-guide for consistent subagent invocation
- Security considerations section in design-template with concrete evaluation items (Authentication, Input Validation, Sensitive Data)
- Security review task in plan-template final quality assurance phase

### Changed

#### Agent Pipeline Improvements
- `code-reviewer`: Rewrite from checklist to 5-step verification pipeline; add `acceptanceCriteria` array with per-AC status/location/gap/suggestion; change `Required Information` to `Input Parameters`
- `requirement-analyzer`: Rewrite from responsibility list to 6-step verification process; integrate file count estimation into Step 2; change `Required Information` to `Input Parameters`
- `work-planner`: Rewrite from responsibility list to 6-step planning process; change `Required Information` to `Input Parameters`
- `subagents-orchestration-guide`: Add security-reviewer to agent list and response specs; update flow diagram; change `testsAdded` pattern matching to `requiresTestReview` boolean
- `task-analyzer/skills-index.yaml`: Add Security Principles detail to coding-standards sections

## [1.17.1] - 2026-03-19

### Fixed

- Fix incorrect tool name: "Task tool" → "Agent tool" in all command files (EN/JA)
- Update deprecated MSW v1 API (`rest`/`res`/`ctx`) to v2 (`http`/`HttpResponse`) in frontend-typescript-testing skill
- Update deprecated `fireEvent` to `userEvent.setup()` pattern per RTL best practices
- Convert "Prohibited Actions" to "Output Self-Check" checklists in 6 agents for more effective LLM guidance
- Clarify orchestrator delegation protocol with explicit Agent tool reference and permitted tools whitelist
- Add sequential execution ordering and as-is data bridging rules to reverse-engineer orchestrator protocol
- Remove internal implementation details from skill descriptions (skill-optimization, documentation-criteria)
- Reorder test design pattern examples good-first to avoid LLM pattern imprinting

### Added

- `affectedLayers` field in requirement-analyzer output for fullstack workflow support
- Test design patterns section (good/bad examples) in EN frontend-typescript-testing skill (previously JA-only)

## [1.17.0] - 2026-03-08

### Added

#### UI Spec Support
- New `ui-spec-designer` agent (EN/JA) for creating UI Specifications from PRD and optional prototype code
- UI Spec template in documentation-criteria references
- UI Spec document type recognized by `document-reviewer`
- UI Spec integration steps in `technical-designer-frontend`
- UI Spec phase added to `front-design` command and orchestration flows

#### Playwright E2E Testing
- E2E test implementation guide (`references/e2e.md`) in frontend-typescript-testing skill
- E2E test design guide (`references/e2e-design.md`) in integration-e2e-testing skill
- E2E test support in `quality-fixer-frontend` and `acceptance-test-generator`

#### Autonomous Execution Enhancements
- 4-step task execution cycle (`task-executor → escalation check → quality-fixer → commit`) in `build` and `front-build` commands
- `integration-test-reviewer` integration for test skeleton compliance validation
- Structured response specs and sub-agent invocation constraints
- `acceptance-test-generator → work-planner` information passing section in orchestration guide

### Changed

#### Frontend Workflow Enhancements
- Orchestration flow step counts updated: large scale 11→13, medium scale 7→9 (frontend/fullstack)
- `front-plan` command restructured with test skeleton generation step
- `implement` command task execution section renamed and enhanced
- `documentation-criteria` skill updated with UI Spec in creation matrix, storage paths, diagram requirements, and templates
- `skills-index.yaml` updated with playwright/e2e tags and new references

#### Dependencies Modernization
- Remove 11 unused devDependencies: react, react-dom, @types/react, @types/react-dom, @vitejs/plugin-react, @testing-library/react, @testing-library/jest-dom, jsdom, c8, ts-node, ts-prune
- Remove 4 unused scripts: `build:frontend`, `dev:frontend`, `preview`, `check:unused:all`
- Migrate ts-prune → knip for unused export detection (`check:unused` now runs `knip --include exports`)
- Upgrade Biome v1 → v2 (schema migration: `organizeImports` → `assist.actions.source`, `include`/`ignore` → `includes` with `!` prefix)
- Upgrade vitest v3 → v4, @vitest/coverage-v8 v3 → v4, @vitest/ui v3 → v4
- Upgrade vite v5 → v6, @types/node v20 → v22
- Add `knip.json` configuration

#### ESM Migration
- Migrate project from CommonJS to ES Modules (`"type": "module"` in package.json)
- Update tsconfig.json: `target` ES2020 → ES2022, `module` commonjs → Node16
- Convert all scripts/ and bin/ files from CJS (`require`/`module.exports`) to ESM (`import`/`export`)
- Add `node:` protocol to all Node.js builtin imports

#### Agent/Skill Environment Independence (en/ja)
- quality-fixer: replace `ts-prune` reference with generic "unused export detection tool"
- quality-fixer-frontend: replace hardcoded `build:frontend` with auto-detect pattern from package.json
- technical-spec skill: replace hardcoded script names with environment-independent descriptions
- frontend/technical-spec skill: replace hardcoded build commands with auto-detect pattern

#### Documentation
- Remove `build:frontend` and `preview` from README script lists (en/ja)

### Removed

- `.tsprunerc` configuration file
- `scripts/check-unused-exports.js` (replaced by knip)

## [1.16.3] - 2026-03-05

### Fixed

- Replace deprecated `TodoWrite` with Tasks API (`TaskCreate`/`TaskUpdate`/`TaskList`) across all agent definitions, command files, and CLAUDE rule files (en/ja)
- Add missing `TaskCreate`/`TaskUpdate` to tools list for `code-reviewer`, `design-sync`, and `integration-test-reviewer` agents (en/ja)

## [1.16.2] - 2026-03-03

### Changed

#### Orchestrator Role Clarity (en/ja)
- Replace prohibition-style delegation ("NEVER investigate yourself") with positive role definition across build, design, implement, plan, update-doc commands: "your role is to invoke sub-agents, pass data between them, and report results"

#### reverse-engineer (en/ja) — Execution Accuracy
- Add Orchestrator Definition section with structured JSON passing and code-reading delegation
- Replace prose loop headers with explicit `FOR ... (sequential, one unit at a time)` notation (Steps 2-5, 7-10)
- Add prerequisite annotation to Step 3 (dependency on Step 2 output)
- Expand Step 5 revision prompt: replace vague "apply corrections" with severity-based handling (critical/important/recommended)
- Expand Step 10 from single-line reference to full backend + frontend revision prompts with severity-based handling
- Add `7a.`/`7b.` labels and sequential execution note for fullstack Design Doc generation
- Remove redundant "Context Passing" line (moved to Orchestrator Definition)

#### review (en/ja)
- Add `$STEP_2_OUTPUT` storage for code-reviewer results
- Replace vague re-validation ("measure improvement") with prior-issue-tracking re-validation using `$STEP_2_OUTPUT`

#### update-doc (en/ja)
- Add `$STEP_5_OUTPUT` storage for document-reviewer results
- Expand revision loop: replace single-line description with full sub-agent prompt including severity-based handling and `$STEP_5_OUTPUT` reference

#### Agents — Reverse Engineering Accuracy (en/ja)
- document-reviewer: add as-is implementation document review rule — verify code-observable behaviors are stated as facts, flag speculative language on deterministic behavior
- prd-creator: add Language Standard rule — code as SSoT, definitive form for observable behavior, "Undetermined Items" only for genuinely undeterminable claims
- prd-creator: add Inferred verification rule — attempt code reading before classifying claims as Inferred

## [1.16.1] - 2026-02-23

### Added
- `/create-skill` command (en/ja) for guided skill creation with interactive dialog and optimization
- `skill-optimization` skill (en/ja) with BP-001~008 content patterns and 9 editing principles, split into SKILL.md + references/ for context isolation
- `skill-creator` agent (en/ja) for optimized skill file generation
- `skill-reviewer` agent (en/ja) for skill quality evaluation with A/B/C grading

### Changed
- `/refine-skill` command (en/ja): replace inline Three-Pass Review with `skill-reviewer` agent delegation

### Fixed
- skills-index.yaml (en/ja): sync sections with actual SKILL.md H2 headings across coding-standards, technical-spec, project-context, documentation-criteria, subagents-orchestration-guide, frontend/technical-spec, frontend/typescript-rules (ja), frontend/typescript-testing (ja)

## [1.16.0] - 2026-02-14

### Added

#### Cross-Layer Orchestration
- Add cross-layer orchestration section to subagents-orchestration-guide SKILL.md (en/ja): design phase extensions, layer context prompts, vertical slice work planning, layer-aware agent routing table
- Add layer-aware task file naming convention to task-decomposer (en/ja): `*-backend-task-*` / `*-frontend-task-*` pattern for automatic agent routing
- Add Design Phase section to implement command (en/ja) for cross-layer scope detection
- Add layer-aware routing annotations to implement and build commands (en/ja)

#### Fullstack Reverse Engineering
- Add fullstack design option to reverse-engineer command (en/ja): per-unit backend + frontend Design Doc generation
- Add `technicalProfile` field to scope-discoverer output: primaryModules, publicInterfaces, dataFlowSummary, infrastructureDeps

### Changed

#### scope-discoverer (en/ja) — Unified Single-Pass Discovery
- Remove `scope_type` parameter (previously `prd` | `design-doc` dual mode)
- Unify discovery sources into single table with Perspective column (user-value / technical / both)
- Add Granularity Criteria section with split/merge signals based on vertical slice principles
- Add `implementation-approach` to required skills
- Remove Prohibited Actions section (all items already covered by positive statements elsewhere)

#### reverse-engineer (en/ja) — Fullstack Integration
- Step 6: Change from scope-discoverer re-invocation to scope mapping (reuse Step 1 results)
- Step 7: Merge Standard/Fullstack mode split into unified per-unit flow
- Unify `component` terminology to `unit` throughout

#### Other Changes
- Support multiple Design Docs in work-planner required info and quality checklist (en/ja)
- Support multiple Design Docs in plan-template (en/ja)
- Update README (en/ja): remove /front-reverse-design, update mermaid diagram for scope reuse, update scope-discoverer description

### Removed
- `/front-reverse-design` command (en/ja) — absorbed into `/reverse-engineer` with fullstack option

## [1.15.1] - 2026-02-13

### Changed

#### CLAUDE.md
- Restructure CLAUDE.md (en/ja) to linear step-based flow (Step 1-4), eliminating redundant sections
- Remove all inline "Reason:" annotations to reduce context token consumption
- Remove TypeScript-specific content (already covered by typescript-rules skill)
- Consolidate rule-advisor field references into a single location (Step 1)
- Add Quality Standard and Session Initialization sections
- Add quality-fixer and rule-advisor as explicit quality verification paths (Step 4)
- Convert auto-stop triggers to table format for scannability
- Specify concrete tool names (AskUserQuestion) for approval workflow
- Clarify `./tmp/` as project-root-relative directory

#### Commands
- Modernize refine-skill command (en/ja): Step-based structure, TodoWrite integration, completion criteria checklist, condensed 3-pass review (207→85 lines)
- Modernize sync-skills command (en/ja): TodoWrite integration, IF-THEN evaluation sequence, error handling table, Glob-based scanning instead of bash find (117→75 lines)
- Update task command (en/ja): add "Task Essence" as first metacognition item, rename rules→skills to align with CLAUDE.md
- Fix diagnose command (en/ja): migrate `selectedRules` field references to `selectedSkills` matching task-analyzer output format
- Modernize project-inject command (en/ja) with AskUserQuestion-based collection, dual output targets, and verification checklist

#### Skills
- Redesign project-context SKILL.md (en/ja) as AI-only prerequisite template, removing tech stack and implementation principles
- Sync active .claude/skills/project-context/SKILL.md with language-specific template

#### Documentation
- Update README (en/ja): /task description (rule→skill), project-inject description, skills table, FAQ, script reference terminology
- Rewrite quickstart guides (en/ja) to remove stale references (docs/rules/, /sync-rules, npx github:...)
- Update use-cases guides (en/ja): /task process steps and description, /sync-rules→/sync-skills, /refine-rule→/refine-skill, docs/rules→.claude/skills/ paths, rules→skills customization terminology
- Rename rule-editing-guide → skills-editing-guide (en/ja): full terminology migration from "rules" to "skills", add Skills Structure & Best Practices section with official docs links, Progressive Disclosure pattern, description/splitting guidelines, and common mistakes

## [1.15.0] - 2026-02-12

### Added
- `npx create-ai-project update` command to update agent definitions, commands, skills, and AI rules in existing projects
- `.create-ai-project.json` manifest file for version tracking
- Ignore mechanism (`--ignore`, `--unignore`) to protect user-customized files from being overwritten
- `--dry-run` flag to preview updates without applying changes
- This CHANGELOG file

## [1.14.15] - 2026-02-10

### Added
- Bash tool to 11 agents (both ja/en) that were missing shell command access, including investigator, verifier, requirement-analyzer, prd-creator, technical-designer, document-reviewer, code-reviewer, code-verifier, integration-test-reviewer, scope-discoverer, and technical-designer-frontend

## [1.14.14] - 2026-02-04

### Added
- Six design document quality improvements: Applicable Standards, Code Inspection Evidence, Data Representation Decision, and Field Propagation Map sections in design template
- Standards Identification Gate in technical designer workflow
- Gate-based review structure (Gate 0 / Gate 1) in document reviewer

## [1.14.13] - 2026-02-02

### Added
- `/update-doc` command for updating existing design documents (Design Doc / PRD / ADR) with built-in review workflow

### Changed
- Unified command frontmatter format by removing redundant `name` field

## [1.14.12] - 2026-01-23

### Changed
- Unified Task tool invocation format across all command files
- Removed deprecated "Think deeply/harder" expressions
- Added Orchestrator Definition to add-integration-tests command

### Fixed
- Heading hierarchy in review command

## [1.14.11] - 2026-01-21

### Changed
- Improved add-integration-tests command format with explicit Task tool invocation blocks, Role declaration, and expected output definitions

### Fixed
- Incorrect `subagents-orchestration-guide` reference in Japanese diagnose command

## [1.14.10] - 2026-01-20

### Changed
- Converted requirement-analyzer output to mandatory JSON format with `scopeDependencies` and `confidence` fields
- Improved scale determination with Grep tool for accurate file count estimation
- Added step counts to flow headings and explicit AskUserQuestion requirements at Stop points

## [1.14.9] - 2026-01-16

### Fixed
- Stabilized agent JSON output by adding explicit "JSON format is mandatory" directive to code-verifier, scope-discoverer, investigator, and verifier agents

## [1.14.8] - 2026-01-14

### Added
- `add-integration-tests` command to generate integration/E2E test skeletons from Design Doc acceptance criteria
- `front-reverse-design` command for reverse engineering PRD and Design Doc from frontend codebase
- `front-review` command for Design Doc compliance validation

### Changed
- Simplified task-decomposer agent and enhanced subagents-orchestration-guide

### Fixed
- Review command inconsistencies between en/ja versions

## [1.14.7] - 2026-01-12

### Changed
- Added Orchestrator Definition with explicit work-to-agent mapping in Execution Method sections
- Added Workflow Overview diagrams and Scope Boundaries to design commands
- Replaced "Avoid" sections with Responsibility Boundary pattern to prevent pink elephant problem

## [1.14.6] - 2026-01-09

### Added
- Complexity gate for over-engineering detection in design review process with `complexity_level` and `complexity_rationale` fields

## [1.14.5] - 2026-01-08

### Changed
- Enhanced diagnostic framework with multi-cause support, confidence loop (up to 2 iterations), rule-advisor integration, investigation focus points, design gap escalation, and residual risk documentation

## [1.14.4] - 2026-01-06

### Changed
- Simplified orchestrator role definitions using positive-form instructions
- Streamlined diagnose flow to always execute `investigator -> verifier -> solver`

### Removed
- "Pink elephant" negative constraints from orchestrator commands

## [1.14.3] - 2026-01-05

### Added
- WebSearch tool to solver agent for verifying generated solutions against project rules and best practices

## [1.14.2] - 2025-12-31

### Fixed
- Skill descriptions not displaying correctly in Claude Code due to YAML folded style (`>`) being parsed incorrectly
- Converted 26 skill files to single-line description format

## [1.14.1] - 2025-12-30

### Changed
- Enhanced skill descriptions with action verbs and "Use when:" triggers for better LLM discoverability
- Enhanced agent descriptions with trigger words and PROACTIVELY markers for auto-activation
- Updated 26 skill files and 38 agent files

## [1.14.0] - 2025-12-26

### Added
- `/reverse-engineer` command to generate PRD and Design Doc from existing codebases
- `scope-discoverer` agent for documentation scope discovery using multi-source triangulation
- `code-verifier` agent for document-code consistency validation

### Changed
- Updated document-reviewer with JSON output format and prior context handling
- Updated prd-creator with external scope support and confidence gating

## [1.13.1] - 2025-12-21

### Changed
- Enhanced investigator with problem type classification, causal chain tracking, `causeCategory`, `comparisonAnalysis`, and `impactAnalysis`
- Enhanced verifier with counter-evidence weighting and `scopeValidation`
- Added Step 0 (problem structuring) to diagnose command

## [1.13.0] - 2025-12-21

### Added
- `/diagnose` command for root cause analysis with 5-step flow
- `investigator` agent for comprehensive problem investigation with evidence matrix
- `verifier` agent for investigation verification using ACH and Devil's Advocate methods
- `solver` agent for solution derivation with tradeoff analysis

## [1.12.1] - 2025-12-19

### Fixed
- Excluded generated Claude Code files (`.claude/agents/`, `.claude/commands/`, `.claude/skills/`) from npm package

## [1.12.0] - 2025-12-19

### Added
- Skills system: all rules migrated to `.claude/skills-{en,ja}/` as SKILL.md files
- `task-analyzer` skill for metacognitive task analysis
- `subagents-orchestration-guide` skill for agent coordination

### Changed
- All 16 agents updated with `skills:` frontmatter
- rule-advisor JSON output field renamed: `selectedRules` to `selectedSkills` with ~80% size reduction

### Removed
- `docs/rules-en/` and `docs/rules-ja/` directories (migrated to skills)
- `docs/guides/` directory (moved to skills)
- Template files from `docs/` (moved to `.claude/skills/*/references/`)

## [1.11.3] - 2025-12-18

### Added
- Positive criteria to suppress test antipatterns: "Valid test: Expected value != Mock return value" criterion for detecting tautology tests

## [1.11.2] - 2025-12-11

### Changed
- Renamed package to `create-ai-project` (previously `ai-coding-project-boilerplate`)
- Now supports `npx create-ai-project` and `npm init ai-project` shorthands

## [1.11.1] - 2025-12-07

### Added
- "Decision Details" section (Why now / Why this / Known unknowns / Kill criteria) in ADR template
- "Design Summary (Meta)" block with risk level, constraints, and unknowns in Design Doc template
- "Failure scenario review" perspective in document-reviewer agent

## [1.11.0] - 2025-12-05

### Added
- `integration-test-reviewer` agent for verifying test implementation quality
- `design-sync` agent for ensuring Design Document consistency
- EARS notation for acceptance criteria (Event-Action-Response-State format)
- Property-based testing support with fast-check integration
- `check:code` script consolidating code quality checks

### Changed
- Clarified quality-fixer phase structure by removing ambiguous Phase 6

## [1.10.0] - 2025-12-03

### Added
- Package manager flexibility: support for npm, bun, and pnpm via `packageManager` field in package.json
- Claude Code automatically detects and uses the configured package manager

## [1.9.3] - 2025-11-30

### Removed
- Ambiguous "Proactive Use of Specialized Agents" section from CLAUDE.md to reduce token count and improve clarity

## [1.9.2] - 2025-11-30

### Changed
- Enhanced TodoWrite integration with rule-advisor output (firstActionGuidance, taskEssence, warningPatterns)
- Replaced prohibition-focused expressions with positive action alternatives (Pink Elephant Problem fix)

## [1.9.1] - 2025-11-24

### Changed
- Simplified Fail-Fast principle documentation from 16 lines to 4 lines in coding-standards.md
- Moved implementation specifics to language-specific rules (typescript.md, frontend/typescript.md)

## [1.9.0] - 2025-11-07

### Added
- ROI-based test generation with 3-layer quality filtering (60-75% test reduction)
- Universal `coding-standards.md` consolidating duplicated Frontend/Backend rules (~760 lines removed)
- Dynamic year detection for future-proof latest information searches

### Changed
- Agent prompt optimization reducing context pollution (~130 lines net reduction)
- Simplified AC scoping in technical-designer

### Fixed
- Initialization script template file detection logic

## [1.8.0] - 2025-10-26

### Added
- Frontend development infrastructure with React support
- 3 specialized frontend agents: `technical-designer-frontend`, `task-executor-frontend`, `quality-fixer-frontend`
- 3 frontend slash commands: `/front-design`, `/front-plan`, `/front-build`
- Frontend-specific rules for props-driven component design, React Testing Library + MSW patterns

### Changed
- Technology-agnostic approach: removed version-specific dependencies (React 19, Vite, Lighthouse)

## [1.7.17] - 2025-10-18

### Fixed
- Clarified rule-advisor agent must be invoked using the Task tool (was incorrectly attempted via Python or other tools)

## [1.7.16] - 2025-10-13

### Added
- 3-stage impact analysis process (Discovery, Understanding, Identification) for implementation completeness
- Unused code deletion rule requiring immediate decision (implement or delete, no deferral)
- Existing code deletion decision flow with clear criteria

## [1.7.15] - 2025-10-12

### Changed
- Optimized all rule documentation to save ~2,300 tokens of context consumption
- Removed meta descriptions, simplified YAML structures, condensed code comments
- Conservative approach: only changes with 0% execution accuracy impact applied

## [1.7.14] - 2025-10-10

### Changed
- Improved Acceptance Criteria scoping guidelines optimized for autonomous LLM implementation in CI/CD
- Simplified "Out of Scope" into 3 categories: External Dependencies, Non-Deterministic in CI, Implementation Details
- Added "AC Scoping for Autonomous Implementation" section to technical-designer

## [1.7.13] - 2025-10-07

### Removed
- Unused Vertical Slice and Hybrid Progressive architecture rules to prevent context pollution and AI precision loss (-1,306 lines, -7 files)

## [1.7.12] - 2025-09-30

### Changed
- Optimized orchestration workflow for Claude Sonnet 4.5 cognitive patterns
- Added explicit Main AI verification step between acceptance-test-generator and work-planner to prevent step skipping
- Introduced "Information Bridge Confirmation" approach for automated file verification

## [1.7.11] - 2025-09-28

### Fixed
- Excessive test generation caused by ambiguous rule descriptions (~97% reduction in false positives)
- Removed ambiguous terms like "operational continuity necessity" that caused LLM misinterpretation

## [1.7.10] - 2025-09-24

### Added
- Integration point analysis for cross-feature E2E testing with impact levels (High/Medium/Low)
- Fail-fast principles for better error detection, replacing unconditional fallback implementations

## [1.7.9] - 2025-09-09

### Changed
- Renamed `e2e-test-generator` to `acceptance-test-generator` for broader coverage
- E2E tests now run only when implementation is complete, preventing Red-phase blocking
- Clear separation between unit tests (Phase 0), integration tests, and E2E tests (final validation)

## [1.7.8] - 2025-09-08

### Added
- `/refine-rule` command for optimizing project rules with three-pass review process
- Quick Start Guide for 5-minute onboarding
- Use Cases Quick Reference for daily workflow patterns

## [1.7.7] - 2025-09-05

### Changed
- Improved `/implement` command with phase-based execution flow for better stability
- Added crash prevention measures: rule-advisor recursion prevention, high-risk agent protection

## [1.7.6] - 2025-08-31

### Added
- `/sync-rules` command for automatic rule metadata synchronization after edits

### Changed
- Enhanced agent implementation consistency with Design Doc compliance
- Improved TypeScript test design standards and type safety

### Fixed
- Metadata inconsistencies in typescript-testing rules

## [1.7.5] - 2025-08-30

### Added
- Enhanced unused exports detection script (`check-unused-exports.js`) with auto-removal capability
- `npm run check:unused` now uses improved script; `npm run check:unused:all` for raw ts-prune output

## [1.7.4] - 2025-08-29

### Fixed
- Subagents now operate independently without referencing parent CLAUDE.md configuration
- Task executor checkbox update functionality restored with precise pattern matching

## [1.7.3] - 2025-08-28

### Fixed
- task-executor checkbox update functionality broken in v1.7.0
- Restored concrete 3-step progress update instructions with [MANDATORY] enforcement keywords

## [1.7.2] - 2025-08-28

### Added
- `/project-inject` slash command for interactive project context configuration
- Guided setup process replacing manual placeholder editing in `project-context.md`

## [1.7.1] - 2025-08-26

### Fixed
- Incorrect section references in quality-fixer agent definitions (both ja/en)

## [1.7.0] - 2025-08-24

### Added
- `e2e-test-generator` agent for automated integration test skeleton creation
- Structured task decomposition with granular progress tracking in task-executor
- E2E verification procedures in Design Document and Work Plan templates

### Changed
- Enhanced quality-fixer with comprehensive error handling and pre-commit hook retry mechanisms
- Improved technical-designer ADR decision-making process and Design Document structure
- Enhanced work-planner with Design Document alignment and phase-based implementation

## [1.6.7] - 2025-08-20

### Added
- Pattern 5 anti-pattern "Insufficient Existing Code Investigation" to prevent duplicate implementations
- Pre-implementation existing code investigation checks for all AI agents

## [1.6.6] - 2025-08-19

### Changed
- Clarified orchestrator commit execution responsibilities in sub-agents documentation
- Explicit mention of using Bash tool for git commit execution in autonomous mode

## [1.6.5] - 2025-08-17

### Added
- Modern TypeScript best practices: branded types, functional programming (Effect-TS/fp-ts), modern DI patterns, `satisfies` operator, template literal types
- Comprehensive Red-Green-Refactor TDD methodology documentation

### Changed
- Fixed systematic inconsistencies between Japanese and English documentation
- Restructured Design Document template (269 lines, 48 sections)

## [1.6.4] - 2025-08-15

### Changed
- Simplified document-reviewer by removing unused iteration-based approach and non-deterministic review patterns

### Removed
- References to non-existent document-fixer sub-agent

## [1.6.3] - 2025-08-15

### Fixed
- Missing implementation-approach.md references in technical-designer and work-planner agents
- Progress checkbox update omissions in task-executor with concrete Edit tool instructions

## [1.6.2] - 2025-08-10

### Changed
- Enhanced English agent definitions with improved capabilities and constraints
- Standardized template documentation across ADR, Design Documents, Plans, and PRD
- Streamlined architecture process by removing obsolete documentation

### Added
- New architecture implementation approach guidelines

## [1.6.1] - 2025-08-09

### Added
- L1/L2/L3 verifiability levels for systematic task validation
- Vertical/horizontal slice strategy for optimal task ordering
- Composite review mode for multi-angle document verification in single execution

### Removed
- Suspended document-fixer agent

## [1.6.0] - 2025-08-08

### Added
- `code-reviewer` agent for comprehensive automated code review (security, performance, maintainability)
- `/review` command for triggering code reviews

### Changed
- Optimized agent definitions for improved execution accuracy
- Enhanced error handling in quality-fixer and task execution flow in task-executor

## [1.5.1] - 2025-08-07

### Fixed
- Stability issues in build command's autonomous execution mode
- Structured response processing for reliable `readyForQualityCheck: true` signal detection
- Quality gate reliability ensuring all checks execute before task completion

## [1.5.0] - 2025-08-07

### Added
- Technical information verification in document-reviewer with WebSearch integration
- Reverse engineering mode in prd-creator for existing implementations
- Latest technology research in technical-designer with automatic source citation

### Changed
- Improved PRD determination logic with three modes: create, update, and reverse-engineer
- Fixed scale assessment terminology inconsistencies across agents

## [1.4.4] - 2025-08-05

### Changed
- Removed rule-advisor dependencies from subagent definitions for improved maintainability
- Simplified task-executor configuration by removing ambiguous mandatory check items

## [1.4.3] - 2025-08-04

### Changed
- Adapted to Claude Code behavior change where subagents can no longer invoke other subagents through Task tool
- Removed Task tool from all 18 subagent definitions and replaced with direct rule file references

### Deprecated
- document-fixer marked as suspended due to Task tool limitations

## [1.4.2] - 2025-08-03

### Added
- NPX support for quick project setup: `npx github:shinpr/ai-coding-project-boilerplate my-project`
- Interactive configuration with language selection and automatic dependency installation

## [1.4.1] - 2025-08-03

### Changed
- Restructured reference management: removed redundant references from rule files, centralized in rules-index.yaml
- Enhanced rule-advisor from "minimal necessary" to "comprehensive quality" approach
- Achieved ~18% reduction in rule file sizes for better context window utilization

## [1.4.0] - 2025-08-03

### Added
- Dynamic rule selection system with `rules-index.yaml` providing metadata for each rule file
- `rule-advisor` subagent for intelligent rule selection based on task requirements
- Mandatory integration between TodoWrite and rule-advisor

### Changed
- Rule content optimized: ~15-18% reduction across all languages
- Enhanced agent behavior controls with automatic stops for large-scale changes

### Removed
- `canonical-phrases.md` (content integrated into other rule files)

## [1.3.1] - 2025-08-02

### Added
- Self-reflection questions in pre-implementation planning (task essence, rule-based prioritization, failure pattern recognition)
- Task command files for both Japanese and English environments

## [1.3.0] - 2025-08-01

### Added
- Multi-language support with dynamic switching between Japanese and English
- `scripts/set-language.js` for language management with `.claudelang` config file
- Complete bilingual file structure for all documentation, agents, commands, and templates
- npm scripts: `lang:ja`, `lang:en`, `lang:status`

## [1.2.4] - 2025-08-01

### Changed
- Improved task-executor execution precision with clear implementation permissions and action principles
- Fixed `/plan` command to focus on work plan creation only (no longer auto-starts implementation)
- Enhanced `/build` command to manage full cycle from task decomposition to quality assurance

## [1.2.3] - 2025-08-01

### Added
- 5 custom slash commands: `/onboard`, `/design`, `/plan`, `/implement`, `/build`
- Each command covers a distinct development phase with clear boundaries

## [1.2.2] - 2025-07-31

### Fixed
- task-executor autonomy: no longer repeats unnecessary confirmation prompts
- Duplicate task execution prevention for already-completed tasks
- Clarified task-executor instruction method (task file path only)

## [1.2.1] - 2025-07-31

### Changed
- Introduced 2-stage document fixing process (content improvement then AI optimization)
- Moved consistency verification to final phase for better new-inconsistency detection
- Added concrete criteria for ambiguous expression replacement and term unification

## [1.2.0] - 2025-07-30

### Added
- `document-fixer` subagent for automated document correction based on review results
- Parallel execution of document-reviewer from multiple review perspectives

### Changed
- Enhanced document-reviewer with more structured review process

## [1.1.2] - 2025-07-30

### Fixed
- Recursive call issue in CLAUDE.md where subagents reading the file triggered infinite recursion
- Removed all subagent-related descriptions from CLAUDE.md to resolve circular dependency

## [1.1.1] - 2025-07-29

### Changed
- Optimized CLAUDE.md: added project-specific rule priority, changed "guidelines" to "rules" for stronger enforcement
- Removed ~75 lines duplicated between CLAUDE.md and rule files
- Introduced `@` notation for unified subagent invocation
- Removed proactive execution conditions from quality-fixer to eliminate improper inter-agent dependencies

## [1.1.0] - 2025-07-28

### Added
- Requirements change detection in sub-agents guide
- Autonomous execution phase clarification (quality assurance / error fix / implementation)

### Changed
- Comprehensive improvements to all 8 subagents (document-reviewer, prd-creator, quality-fixer, requirement-analyzer, task-decomposer, task-executor, technical-designer, work-planner)
- Simplified TodoWrite tool usage in ai-development-guide.md

## [1.0.0] - 2025-07-28

### Added
- 8 specialized subagents (prd-creator, technical-designer, work-planner, requirement-analyzer, task-decomposer, task-executor, quality-fixer, document-reviewer)
- Interactive mode for prd-creator and requirement-analyzer
- Mermaid diagram guidelines for prd-creator, technical-designer, and work-planner

### Changed
- Sub-agents guide fully revised as a practical LLM guide

## [0.1.0] - 2025-07-27

### Added
- Initial release: Claude Code optimized TypeScript project boilerplate
- 6 development rule files covering technical specs, TypeScript, testing, and AI development
- Layered architecture patterns (Vertical Slice, Layered, Hybrid Progressive)
- Quality assurance system with 6-phase checks
- Biome linter/formatter, Vitest test framework, Husky + lint-staged
- ADR process, work plan templates, and sub-agent utilization guide
