---
description: Populate project-context skill via template-driven hearing
---

**Command Context**: `/project-inject` collects project-specific prerequisites that improve AI execution accuracy and writes them into the `project-context` skill. The hearing is template-driven: the section catalog lives in `references/template.md`, and new dimensions are added by editing that template.

## Why This Matters

CLAUDE.md's session initialization loads `project-context/SKILL.md` at the start of every session. Information collected here directly affects AI decision-making accuracy across all tasks. Keep the configured SKILL.md minimal — every line is paid in context budget per session.

## Execution Flow

Register all steps below using TaskCreate before starting Step 1, and update each task's status as you progress.

### Step 1: Load Inputs

1. Read `.claude/skills/project-context/SKILL.md` to learn the current state. The body holds the catalog section headings (`## Project Overview`, `## Domain Constraints`, `## Development Phase`, `## Directory Conventions`, `## External Resources`) in catalog order. Distinguish the two cases by whether captured content appears beneath any of these headings:
   - **Unconfigured** — every catalog heading is empty (the next non-blank line is another `## ` heading or end of file).
   - **Configured** — at least one catalog heading has captured content beneath it.
2. Read `.claude/skills/project-context/references/template.md` to obtain the section catalog.

**Checkpoint**: You hold the section catalog from `template.md` and the configured-or-unconfigured state of `SKILL.md`.

### Step 2: Build Section Plan

Produce a per-section plan (`add` / `keep` / `update` / `remove` / `skip`) covering every section in the catalog.

**Unconfigured case**:
- Project Overview: `add` (mandatory; the section's inclusion rule is "Always").
- For each remaining catalog section, AskUserQuestion: "Add the `<section name>` section?" Options: "Yes, add it" / "No, skip". Mark `add` or `skip` accordingly.

**Configured case**:
- For each currently populated section, AskUserQuestion: "Action for the existing `<section name>` section?" Options: "Keep as-is" (mark `keep`) / "Update — replace existing content" (mark `update`) / "Remove — drop from rebuilt SKILL.md" (mark `remove`).
- For each catalog section that is still empty in the existing SKILL.md, AskUserQuestion: "Add the `<section name>` section?" Options: "Yes, add it" (mark `add`) / "No, skip" (mark `skip`).

**Checkpoint**: Every catalog section has exactly one disposition: `add`, `keep`, `update`, `remove`, or `skip`.

### Step 3: Run Hearing per Section

For each section marked `add` or `update`, run the hearing protocol that `template.md` defines for that section. The catalog specifies the AskUserQuestion text and choices, the inclusion rules, and the per-section output structure.

**External Resources section**: follow the routing protocol in `template.md` § External Resources. That section owns the domain multi-select, the domain-to-file slug map, and the per-axis output schema; this command delegates to it.

**Vagueness rejection** (applies to every `add` and `update` section): When a user-provided rule uses subjective phrasing (e.g., "be careful about performance"), follow up with: "How would AI verify this rule passes? Restate it as a measurable check, or reply 'drop' to omit." Keep rules that arrive in measurable form as-is; replace subjective ones with the user's restated version, or omit them when the user replies 'drop'.

**Checkpoint**: You hold captured content for every `add` and `update` section, plus the verbatim original content for every `keep` section.

### Step 4: Assemble and Write SKILL.md

Build the rebuilt SKILL.md by concatenating, in this order:

1. Frontmatter — write this canonical block exactly:
   ```
   ---
   name: project-context
   description: Provides project-specific prerequisites for AI execution accuracy — domain constraints, development phase, directory conventions, external resource access methods. Use when the session starts, when checking project structure, or when a task references domain rules or external resources outside the repository.
   ---
   ```
2. `# Project Context` heading.
3. Each section in catalog order (Project Overview → Domain Constraints → Development Phase → Directory Conventions → External Resources). The output contains only sections whose disposition is `add`, `keep`, or `update` AND that satisfy their inclusion rule; the body advances directly from one included section to the next.

Write the assembled content to `.claude/skills/project-context/SKILL.md`. This single path is the runtime canonical source read by Claude in every session.

### Step 5: Verify

Apply each check below to the rebuilt `.claude/skills/project-context/SKILL.md`:

- [ ] Frontmatter matches the canonical block in Step 4 verbatim.
- [ ] Every section heading in the body is followed by captured content from the hearing (concrete values, lists, or sub-blocks).
- [ ] Every populated section's content matches the output structure that `template.md` defines for it.
- [ ] Every section in the body has disposition `add`, `keep`, or `update` AND satisfies its inclusion rule.
- [ ] Domain constraint statements are pass/fail checkable (e.g., "log entries use anonymized IDs" passes; "logs are clean" fails this check).
- [ ] Project Context content is limited to constraints, phases, conventions, and external resources. Technology stack details belong in the `technical-spec` skill; implementation principles belong in the `coding-standards` skill.

When any check fails, report the failing check to the user with the specific line and propose either a re-hearing for the affected section or a manual edit. Re-run Step 5 after the fix.

### Step 6: Present Result

Show the rebuilt SKILL.md to the user, list the changes made (added / updated / removed / kept sections), and confirm completion.

## Output Examples

**Initial run on an unconfigured skill** (every section freshly captured):

```
project-context configured:
- Sections kept: (none — first run)
- Sections updated: (none — first run)
- Sections added: Project Overview, Domain Constraints (2 rules captured), Development Phase, Directory Conventions (1 rule), External Resources (Backend domain — Database Schema Source, Secret Store)
- Sections removed: (none)
- File written: .claude/skills/project-context/SKILL.md
```

**Light update on a configured skill** (one section edited, rest preserved):

```
project-context updated:
- Sections kept: Project Overview, Development Phase, Directory Conventions
- Sections updated: Domain Constraints (3 rules captured)
- Sections added: (none)
- Sections removed: (none)
- File written: .claude/skills/project-context/SKILL.md
```

**Trim run** (an existing section removed, no new ones added):

```
project-context updated:
- Sections kept: Project Overview, Domain Constraints, Development Phase
- Sections updated: (none)
- Sections added: (none)
- Sections removed: Directory Conventions
- File written: .claude/skills/project-context/SKILL.md
```
