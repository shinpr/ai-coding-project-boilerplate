# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
