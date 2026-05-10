# Project Context Section Catalog

This file is the section catalog used by `/project-inject`. Consumer agents load `SKILL.md` only; this file is loaded only during update operations.

## Section Index

| Section | Inclusion Rule | Source of Hearing Questions |
|---------|----------------|-----------------------------|
| Project Overview | Always include | This file (below) |
| Domain Constraints | Include when at least one rule changes AI decisions | This file (below) |
| Development Phase | Include when phase materially changes AI behavior (e.g., suppresses test scaffolding for prototype) | This file (below) |
| Directory Conventions | Include when non-obvious file placement rules exist | This file (below) |
| External Resources | Include when the project depends on resources outside the repository (design source, schema source, secret store, IaC source, etc.) | `external-resources-{frontend,backend,api,infra}.md` (load only the domains relevant to the project) |

## Section Definitions

### Project Overview

**Inclusion**: Always.

**Hearing**:
- AskUserQuestion 1: "What does this project do? (1–2 sentences)"
- AskUserQuestion 2: "What domain does it belong to?" with concrete option examples drawn from common categories (e.g., developer tooling, fintech, healthcare, e-commerce, internal platform). Always include "Other".

**Output structure**:
```markdown
## Project Overview
- **What this project does**: <one to two sentences>
- **Domain**: <domain>
```

### Domain Constraints

**Inclusion**: Include when at least one constraint, if ignored, would cause a bug or compliance failure.

**Hearing**:
- AskUserQuestion: "Are there domain-specific rules that AI must follow when making decisions in this project?" Options: "Yes, I will list them" / "No, no domain constraints apply".
- When "Yes": for each rule (cap at 3), capture the rule statement plus a measurable check. Accept statements only when they evaluate as pass/fail; reframe subjective phrasings into measurable form (e.g., turn "be careful with PII" into "log output uses anonymized patient IDs").
- Adapt example phrasings to the domain captured in Project Overview (e.g., for fintech: "every monetary mutation appends an audit log entry"; for developer tooling: "generated code keeps lockfile commands invocable").

**Output structure** (omit the section entirely when zero constraints):
```markdown
## Domain Constraints
1. <measurable rule 1>
2. <measurable rule 2>
3. <measurable rule 3>
```

### Development Phase

**Inclusion**: Include when phase materially changes AI behavior. Skip when behavior is identical across phases.

**Hearing**:
- AskUserQuestion: "Which phase is this project in?" Options: "Prototype", "Production", "In operation", "No meaningful difference between phases".
- When "No meaningful difference": omit the section.

**Output structure**:
```markdown
## Development Phase
- **Phase**: <Prototype | Production | In operation>
```

### Directory Conventions

**Inclusion**: Include when at least one file placement rule is non-obvious from the repository structure (i.e., a contributor reading the tree would guess wrong).

**Hearing**:
- AskUserQuestion: "Are there file placement rules that AI should follow?" Options: "Yes" / "No".
- When "Yes": capture each rule as a single line stating the trigger and the destination (e.g., "Temporary working files: place under `./tmp/` and remove on completion").

**Output structure** (omit the section entirely when zero rules):
```markdown
## Directory Conventions
- <rule 1>
- <rule 2>
```

### External Resources

**Inclusion**: Include the section when at least one selected domain has a present axis OR a non-empty self-declaration. Otherwise omit the section.

**Hearing routing**:
- AskUserQuestion: "Which external-resource domains apply to this project?" Multi-select options:
  - Frontend (design source, design system, guidelines, visual verification environment)
  - Backend (database schema, migration history, secret store, background jobs)
  - API contract (schema source, mocks, authentication, schema change process)
  - Infrastructure (IaC source, environment configuration, infrastructure secrets, deployment trigger)
  - None apply
- For each selected domain, load the matching reference file using the slug map below and run its hearing protocol.

**Domain to file slug mapping**:
| Domain (user-facing label) | Reference file |
|---------------------------|----------------|
| Frontend | `external-resources-frontend.md` |
| Backend | `external-resources-backend.md` |
| API contract | `external-resources-api.md` |
| Infrastructure | `external-resources-infra.md` |

**Hearing protocol** (per domain reference): each reference defines structured axes plus a self-declaration phase. The structured phase asks one AskUserQuestion per axis, offering "Not applicable" as one explicit choice. The self-declaration phase always runs once, asking for free-form additions, regardless of how the structured choices landed.

**Per-axis output schema** (3 fields):
```markdown
#### <Axis name>
- Source type: <verbatim text of the AskUserQuestion choice the user selected>
- Location: <URL | file path | service or package name>
- Access method: <WebFetch | file read | MCP server name | CLI command | manual procedure>
```

**Axis output rules**:

1. **Axis output is conditional on whether the schema can be filled.** Render the axis block when the user's choice points to an external resource with identifiable **Location** and **Access method** values. The following choices produce zero output lines for that axis:
   - Listed absence-declaring choices: "Not applicable", "No <resource>", "No <resource> required", "No documented <resource>", "Ad-hoc <resource>", "Manual <process> (no <resource>)".
   - Any other choice whose Location and Access method values resolve to blank.

2. **Multiple instances within one axis** (e.g., primary and analytics databases, separate guideline files for CSS and accessibility) — repeat the axis block with a disambiguating suffix:
   ```markdown
   #### Database Schema Source — Primary
   - Source type: Schema file in the repository
   - Location: prisma/schema.prisma
   - Access method: file read

   #### Database Schema Source — Analytics
   - Source type: Database MCP server that introspects a live database
   - Location: bigquery-prod
   - Access method: MCP server `bigquery`
   ```

3. **Cross-axis reference** (e.g., the same secret store appears under both Backend and Infrastructure) — the first occurrence carries the canonical fields; the second occurrence renders as a reference back to it:
   ```markdown
   #### Secrets in Infrastructure
   - Source type: Secrets sourced from a secret manager via IaC data lookup
   - Reference: same store as Backend > Secret Store
   - Access method: <inherited; record only differences if any>
   ```

**Domain block layout**:
```markdown
### <Domain>

<axis blocks in catalog order, each rendered per the rules above>

#### Additional Resources

<rendered only when self-declaration captured items; placed after the last present axis within the same domain>
- <free-form description from user>
```

## Output Assembly Rules

After hearing completes, the calling command (`/project-inject`) assembles the configured `SKILL.md` per the order it specifies. This file owns the per-section content shape (above) and these cross-section rules:

1. Sections marked for omission produce zero output lines. The rebuilt body advances directly to the next included section.
2. Domain blocks within External Resources appear in catalog order (Frontend → Backend → API contract → Infrastructure), regardless of the order in which the user selected them during hearing.
3. The Vagueness rejection rule (defined in `/project-inject` Step 3) is a hearing-time filter applied to every `add` and `update` section. The captured rules that pass the filter are written through normal section output; the filter contributes zero output lines of its own.
