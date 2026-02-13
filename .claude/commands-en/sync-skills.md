---
description: Synchronize skill metadata and optimize rule-advisor precision after skill edits
---

**Command Context**: Post-editing maintenance workflow for skill files

## Essential Purpose

Not mere consistency maintenance, but rule-advisor selection accuracy enhancement. Metadata optimization as the final step of skill editing workflow.

## Execution Process

Register the following steps in TodoWrite and proceed systematically.

### Step 1: Scan Skill Files

- Glob: `.claude/skills/*/SKILL.md` to retrieve all skill files
- Read: `.claude/skills/task-analyzer/references/skills-index.yaml`

### Step 2: Synchronize and Optimize Metadata

Verify the following for each skill:

| Metadata | Verification |
|----------|-------------|
| sections | 100% match with `## ` sections in SKILL.md |
| tags | Accurately reflect file content keywords |
| typical-use | Specify concrete usage scenarios |
| key-references | Cover current methodologies |

### Step 3: Change Necessity Evaluation

**EVALUATION SEQUENCE**:
- IF sections achieve 100% synchronization → OUTPUT "Synchronization verified. No updates required." THEN TERMINATE
- IF content-to-tag mapping shows zero mismatches → DETERMINE no_changes_needed = true THEN TERMINATE
- IF AND ONLY IF measurable improvements exist → GENERATE specific modification proposals WITH exact before/after values

**NOTE**: You MUST NOT force changes. When no improvements are detected, you SHALL report "No modifications necessary" and STOP execution.

### Step 4: User Approval and Application

Present proposals to user and apply after approval:

```
[1/N] typescript-rules
  ✅ sections: synchronized
  💡 tags proposed: +[functional-programming]
  💡 typical-use: "old description" → "new description"
```

## Completion Criteria

- [ ] Scanned all skill files
- [ ] Verified consistency with skills-index.yaml
- [ ] Evaluated change necessity (if none needed, reported and terminated)
- [ ] If changes exist, obtained user approval
- [ ] Applied changes

## Error Handling

| Error | Action |
|-------|--------|
| skills-index.yaml not found | Verify path, report and terminate if not found |
| SKILL.md parse error | Skip affected skill, continue with others |
| Large number of inconsistencies detected | Propose staged approach starting from highest priority |

## Execution Timing

- After skill file edits (mandatory)
- When adding new skill files
- After major skill revisions
- When rule-advisor selection accuracy appears degraded

**Scope**: Post-edit skill metadata synchronization and rule-advisor precision optimization.
