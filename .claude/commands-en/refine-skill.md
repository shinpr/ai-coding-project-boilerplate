---
description: Implement user skill change requests with optimization pattern evaluation
---

**Command Context**: Workflow for understanding skill file change requests and implementing via skill-creator (modification mode) with quality-assured optimization.

Change request: $ARGUMENTS

## Execution Process

Register the following steps with TaskCreate and proceed systematically.

### Step 1: Understand the Request

If unspecified, use AskUserQuestion to clarify:
- Which skill to modify (e.g., typescript-rules / coding-standards)
- Change type: Add new criteria / Modify existing criteria / Delete criteria
- Specific changes

Target file identification:
- Skill name provided → Read: `.claude/skills/{skill-name}/SKILL.md` (also check `~/.claude/skills/`)
- Partial name known → Glob: `.claude/skills/*{keyword}*/SKILL.md`, `~/.claude/skills/*{keyword}*/SKILL.md`
- Unknown → Glob: `.claude/skills/*/SKILL.md`, `~/.claude/skills/*/SKILL.md` for full scan → Confirm selection with user

### Step 2: Collect User Phrases (optional)

Collect phrases the team actually uses when requesting this kind of work:
- Required if the change affects description or scope
- Can be skipped for minor criteria modifications

### Step 3: Create Design Proposal

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

**Design Checklist**: Evaluate proposal against the 9 editing principles defined in skill-optimization skill. Key focus areas:
- Context efficiency: every added sentence must contribute to LLM decision-making
- Measurability: all criteria use if-then format or concrete thresholds
- Deduplication: verify no overlap with other skill files
- Scope boundaries: confirm changes stay within this skill's responsibility

### Step 4: Execute Changes via skill-creator

Invoke skill-creator agent via Agent tool in modification mode:

```
subagent_type: skill-creator
prompt: |
  Mode: modification
  Skill name: {target skill name}
  Existing content: {current full SKILL.md content}
  Modification request: {approved change content from Step 3}
```

Review the changesSummary returned by skill-creator to verify changes match intent.

### Step 5: Quality Review

Invoke skill-reviewer agent via Agent tool:
- Pass the modified SKILL.md content assembled from skill-creator output
- Review mode: `modification`

**Review outcome handling:**
- Grade A or B: proceed to Step 6
- Grade C: re-invoke skill-creator with reviewer's `actionItems` and `patternIssues` to fix (max 2 iterations)
- Reviewer identifies issues outside the change scope: report to user as separate improvement opportunities

### Step 6: Approval and Implementation

1. Present before/after comparison to user and obtain approval
2. Include skill-reviewer's grade and any remaining action items
3. Present skill-creator's changesSummary
4. Confirm user intent alignment: "Do the changes achieve what you originally requested?"
5. Apply changes with appropriate tool
6. Verify with git diff
7. If reviewer flagged issues outside change scope, list them as optional follow-ups
8. Suggest `/sync-skills` execution

## Completion Criteria

- [ ] Identified target skill and understood current state
- [ ] Reviewed design proposal against skill-optimization editing principles
- [ ] Executed changes via skill-creator (modification mode)
- [ ] skill-reviewer returned grade A or B
- [ ] Obtained user approval
- [ ] Applied changes and verified with git diff
- [ ] Suggested /sync-skills execution

## Error Handling

| Error | Action |
|-------|--------|
| Skill not found | Display available skill list |
| Large change detected (50%+ of file) | Suggest phased implementation |
| Responsibility overlap with other skills | Confirm boundaries and defer to user judgment |
| Grade C after 2 review iterations | Present changes with issues list, let user decide |
| Reviewer identifies regression | Revert specific change causing regression, re-invoke skill-creator |

**Scope**: Understanding user change requests and implementing with quality-assured optimization. Change execution delegated to skill-creator (modification mode). Quality evaluation delegated to skill-reviewer agent. Metadata sync through /sync-skills.
