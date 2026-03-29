---
description: Create a new skill from user knowledge through interactive dialog and optimization
---

**Command Context**: Guide users through creating a well-structured skill file via interactive dialog, then generate and review optimized content.

Skill topic: $ARGUMENTS

## Execution Process

Register the following steps with TaskCreate and proceed systematically.

### Step 1: Pre-flight Check

1. Glob existing skills: `.claude/skills/*/SKILL.md`, `~/.claude/skills/*/SKILL.md`
2. If `$ARGUMENTS` matches an existing skill name: suggest `/refine-skill` instead and stop
3. List existing skill names for user awareness

### Step 2: Collect Skill Knowledge

Use AskUserQuestion to collect information in 4 rounds.

**Round 1: Skill Essence**
- What domain knowledge does this skill encode? (1-2 sentences)
- What is the primary goal when this skill is applied? (e.g., "ensure type safety", "standardize test patterns")

**Round 2: Project-Specific Value**

Verify whether the proposed skill adds value beyond the LLM's baseline knowledge.

- What project-specific rules, patterns, class names, or workflows does this skill encode that the LLM would not know from general training?
- Provide concrete examples (e.g., specific error classes, team conventions, file patterns in this codebase)

| User response | Action |
|---------------|--------|
| Provides project-specific details | Incorporate into skill content. Proceed to Round 3. |
| Describes only general knowledge | Warn: "A skill containing only general knowledge is unlikely to trigger at runtime." Offer: (A) identify project-specific aspects to add, (B) proceed with the understanding that the skill may not trigger reliably |

**Round 3: Scope, Triggers, and User Phrases**
- When should this skill be activated? List 3-5 concrete scenarios (e.g., "when writing unit tests", "when reviewing PR for security")
- What does this skill explicitly NOT cover? (scope boundary)
- What phrases does your team actually use when requesting this kind of work? (e.g., "add error handling to X", "review the catch blocks", "fix the retry logic")

Classify collected phrases into two categories:

| Category | Definition | Example |
|----------|-----------|---------|
| **skill-dependent** | Cannot be completed correctly without the skill's knowledge | "implement retry logic", "review error handling" |
| **pattern-copyable** | Can be completed by reading and copying existing code patterns | "add a fetchXxx function" |

If all phrases are pattern-copyable: "These tasks can be completed by copying existing code. Can you provide a scenario that requires the hidden rules this skill encodes?" Ensure at least 1 skill-dependent phrase exists before proceeding.

**Round 4: Decision Criteria and Evidence**
- What are the concrete rules or criteria? (the core knowledge to encode)
- Any examples of good/bad patterns?
- Any external references or standards this skill is based on?
- Practical artifacts: "Do you have any existing files, past failures, PRs, or conversation logs that demonstrate these patterns?" (these ground the skill in real-world usage)

### Step 3: Determine Name and Structure

1. Derive skill name in gerund/noun form following existing conventions:
   - `coding-standards`, `typescript-rules`, `implementation-approach` (noun/gerund compound)
2. Estimate size based on collected content volume
3. Present name and structure to user via AskUserQuestion for confirmation

### Step 4: Generate Skill Content

Invoke skill-creator agent via Agent tool with collected information:
- Mode: creation
- Skill name: from Step 3
- Raw knowledge: from Round 4
- Trigger scenarios: from Round 3
- User phrases: from Round 3 (both skill-dependent and pattern-copyable)
- Scope: from Round 3
- Decision criteria: from Round 4
- Project-specific value: from Round 2
- Practical artifacts: from Round 4 (if provided)

### Step 5: Review Generated Content

Invoke skill-reviewer agent via Agent tool:
- Pass skill-creator's generated content
- Review mode: `creation`

If grade C: apply suggested fixes from reviewer and re-review (max 2 iterations).
If grade A or B: proceed to Step 6.

### Step 6: User Review and Write

1. Present generated SKILL.md content to user for final approval
2. Confirm user intent alignment: "Does this skill capture the knowledge and criteria you described?"
3. If revision requested: apply changes and re-run skill-reviewer
4. Upon approval, write to `.claude/skills/{name}/SKILL.md`
5. Suggest running `/sync-skills` to update metadata and language variants

## Completion Criteria

- [ ] No naming conflict with existing skills
- [ ] Project-specific value validated in Round 2
- [ ] User phrases collected and classified (at least 1 skill-dependent)
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
| Insufficient knowledge after 4 rounds | Ask targeted follow-up (max 2 additional questions) |
| skill-creator returns invalid JSON | Retry once with simplified input |
| Grade C after 2 review iterations | Present current content with issues list, let user decide |
| User rejects generated content | Collect specific feedback, re-run skill-creator with adjustments |

## Scope Boundary

**This command handles**: Interactive knowledge collection, orchestration of creator and reviewer agents, file writing.
**This command does NOT handle**: Skill content optimization logic (delegated to skill-creator), quality evaluation logic (delegated to skill-reviewer), metadata sync (delegated to `/sync-skills`).
