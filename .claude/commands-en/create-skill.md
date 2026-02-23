---
description: Create a new skill from user knowledge through interactive dialog and optimization
---

**Command Context**: Guide users through creating a well-structured skill file via interactive dialog, then generate and review optimized content.

Skill topic: $ARGUMENTS

## Execution Process

Register the following steps in TodoWrite and proceed systematically.

### Step 1: Pre-flight Check

1. Glob existing skills: `.claude/skills/*/SKILL.md`
2. If `$ARGUMENTS` matches an existing skill name: suggest `/refine-skill` instead and stop
3. List existing skill names for user awareness

### Step 2: Collect Skill Knowledge

Use AskUserQuestion to collect information in 3 rounds.

**Round 1: Skill Essence**
- What domain knowledge does this skill encode? (1-2 sentences)
- What is the primary goal when this skill is applied? (e.g., "ensure type safety", "standardize test patterns")

**Round 2: Scope and Triggers**
- When should this skill be activated? List 3-5 concrete scenarios (e.g., "when writing unit tests", "when reviewing PR for security")
- What does this skill explicitly NOT cover? (scope boundary)

**Round 3: Decision Criteria and Content**
- What are the concrete rules or criteria? (the core knowledge to encode)
- Any examples of good/bad patterns?
- Any external references or standards this skill is based on?

### Step 3: Determine Name and Structure

1. Derive skill name in gerund/noun form following existing conventions:
   - `coding-standards`, `typescript-rules`, `implementation-approach` (noun/gerund compound)
2. Estimate size based on collected content volume
3. Present name and structure to user via AskUserQuestion for confirmation

### Step 4: Generate Skill Content

Invoke skill-creator agent via Task tool with collected information:
- Raw knowledge from Round 3
- Skill name from Step 3
- Trigger scenarios from Round 2
- Scope from Round 2
- Decision criteria from Round 3

### Step 5: Review Generated Content

Invoke skill-reviewer agent via Task tool:
- Pass skill-creator's generated content
- Review mode: `creation`

If grade C: apply suggested fixes from reviewer and re-review (max 2 iterations).
If grade A or B: proceed to Step 6.

### Step 6: User Review and Write

1. Present generated SKILL.md content to user for final approval
2. Confirm user intent alignment: "Does this skill capture the knowledge and criteria you described?"
3. If revision requested: apply changes and re-run skill-reviewer
3. Upon approval, write to `.claude/skills/{name}/SKILL.md`
4. Suggest running `/sync-skills` to update metadata and language variants

## Completion Criteria

- [ ] No naming conflict with existing skills
- [ ] Skill knowledge collected through 3 rounds of dialog
- [ ] Skill name confirmed by user
- [ ] skill-creator agent returned valid JSON output
- [ ] skill-reviewer agent returned grade A or B
- [ ] User approved final content
- [ ] File written to `.claude/skills/{name}/SKILL.md`
- [ ] `/sync-skills` suggested to user

## Error Handling

| Error | Action |
|-------|--------|
| Skill name already exists | Suggest `/refine-skill {name}` instead |
| Insufficient knowledge after 3 rounds | Ask targeted follow-up (max 2 additional questions) |
| skill-creator returns invalid JSON | Retry once with simplified input |
| Grade C after 2 review iterations | Present current content with issues list, let user decide |
| User rejects generated content | Collect specific feedback, re-run skill-creator with adjustments |

## Scope Boundary

**This command handles**: Interactive knowledge collection, orchestration of creator and reviewer agents, file writing.
**This command does NOT handle**: Skill content optimization logic (delegated to skill-creator), quality evaluation logic (delegated to skill-reviewer), metadata sync (delegated to `/sync-skills`).
