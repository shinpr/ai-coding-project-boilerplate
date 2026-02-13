---
description: Implement user skill change requests with maximum precision optimization
---

**Command Context**: Workflow for understanding skill file change requests and implementing with maximum precision

Change request: $ARGUMENTS

## Execution Process

Register the following steps in TodoWrite and proceed systematically.

### Step 1: Understand the Request

If unspecified, use AskUserQuestion to clarify:
- Which skill to modify (e.g., typescript-rules / coding-standards)
- Change type: Add new criteria / Modify existing criteria / Delete criteria
- Specific changes

Target file identification:
- Skill name provided → Read: `.claude/skills/{skill-name}/SKILL.md`
- Partial name known → Glob: `.claude/skills/*{keyword}*/SKILL.md`
- Unknown → Glob: `.claude/skills/*/SKILL.md` for full scan → Confirm selection with user

### Step 2: Create Design Proposal

Present before/after comparison of current state and proposed change:

```
【Current】
"Handle errors appropriately" (ambiguous: "appropriately" undefined)

【Proposal】
"Error handling implementation criteria:
1. try-catch required for: external API calls, file I/O, JSON.parse, etc.
2. Required error log items: error.name, error.stack, timestamp"

Proceed with this design? (y/n)
```

**Design 9-Point Checklist**:
1. Maximum accuracy with minimal description (context efficiency)
2. Deduplication within and across skill files
3. Group related content in single file (minimize read operations)
4. Measurable decision criteria (if-then format)
5. Transform NG examples to recommendation format (background: including NG examples)
6. Consistent notation
7. Make implicit prerequisites explicit
8. Description order: most important first, exceptions last
9. Clear scope boundaries: what's covered vs what's not

### Step 3: Three-Pass Review Process

1. **Addition Mode**: Ambiguous expressions → measurable criteria, implicit prerequisites → explicit conditions, edge case definitions (minimum 5 additions)
2. **Critical Modification Mode**: Consolidate duplicates, simplify excessive detail, replace overlap with other skills → references (record before/after diffs)
3. **Restoration Decision Mode**: Deletions with accuracy risk → restore, valid deletions → keep

Final check: "Are necessary and sufficient conditions present for accurate implementation of user requirements?"

### Step 4: Approval and Implementation

1. Present before/after comparison to user and obtain approval
2. Apply changes with appropriate tool
3. Verify with git diff
4. Suggest `/sync-skills` execution

## Completion Criteria

- [ ] Identified target skill and understood current state
- [ ] Reviewed design proposal against 9-point checklist
- [ ] Completed three-pass review process
- [ ] Obtained user approval
- [ ] Applied changes and verified with git diff
- [ ] Suggested /sync-skills execution

## Error Handling

| Error | Action |
|-------|--------|
| Skill not found | Display available skill list |
| Large change detected (50%+) | Suggest phased implementation |
| Responsibility overlap with other skills | Confirm boundaries and defer to user judgment |

**Scope**: Understanding user change requests and implementing with maximum precision. Through /sync-skills coordination.
