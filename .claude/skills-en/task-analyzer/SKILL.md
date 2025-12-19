---
name: task-analyzer
description: Metacognitive task analysis and skill selection. Analyzes task essence, estimates scale, and returns appropriate skills with metadata.
---

# Task Analyzer - Metacognitive Analysis Framework

## Purpose

Analyze the essence of incoming tasks to:
1. Determine work scale (small/medium/large)
2. Identify applicable skills
3. Recognize potential failure patterns
4. Provide first action guidance

## Analysis Framework

### Task Essence Extraction

When receiving a task, analyze:

```yaml
taskEssence:
  surfaceRequest: "[What user literally asked for]"
  underlyingGoal: "[What user actually wants to achieve]"
  implicitRequirements: "[Requirements not explicitly stated but implied]"
  scaleDetermination:
    fileCount: "[Estimated files to change]"
    scale: "small|medium|large"
    confidence: "high|medium|low"
```

### Scale Determination Criteria

| Scale | File Count | Characteristics |
|-------|------------|-----------------|
| Small | 1-2 files | Single responsibility change, localized impact |
| Medium | 3-5 files | Cross-component change, requires coordination |
| Large | 6+ files | System-wide impact, requires documentation |

### Skill Selection Matrix

Based on task characteristics, select applicable skills:

| Task Type | Required Skills |
|-----------|-----------------|
| New Feature | documentation-criteria, implementation-approach, typescript-rules, coding-standards |
| Bug Fix | coding-standards, typescript-rules, debugging techniques from coding-standards |
| Refactoring | coding-standards, implementation-approach |
| Test Writing | typescript-testing, integration-e2e-testing |
| Documentation | documentation-criteria |
| Frontend | frontend/typescript-rules, frontend/typescript-testing, frontend/technical-spec |

### Failure Pattern Recognition

Identify potential failure patterns before starting:

```yaml
warningPatterns:
  - pattern: "[Detected pattern name]"
    risk: "high|medium|low"
    mitigation: "[How to avoid this pattern]"
```

Common patterns to watch for:
1. **Error Fix Chain** - Surface fixes without root cause analysis
2. **Type Safety Abandonment** - Overuse of any/as
3. **Insufficient Testing** - Skipping Red-Green-Refactor
4. **Technical Uncertainty** - Unknown technology without spike
5. **Missing Investigation** - Not checking existing code first

### First Action Guidance

Provide concrete first step based on analysis:

```yaml
firstActionGuidance:
  action: "[Specific tool or action to take]"
  rationale: "[Why this should be the first step]"
  expectedOutcome: "[What this action should reveal]"
```

## Output Format

When analyzing a task, return structured JSON:

```json
{
  "taskEssence": {
    "surfaceRequest": "...",
    "underlyingGoal": "...",
    "implicitRequirements": ["..."],
    "scaleDetermination": {
      "fileCount": "...",
      "scale": "...",
      "confidence": "..."
    }
  },
  "applicableSkills": [
    {
      "name": "...",
      "relevance": "primary|secondary",
      "sections": ["..."]
    }
  ],
  "warningPatterns": [
    {
      "pattern": "...",
      "risk": "...",
      "mitigation": "..."
    }
  ],
  "firstActionGuidance": {
    "action": "...",
    "rationale": "...",
    "expectedOutcome": "..."
  }
}
```

## Integration with TodoWrite

After task-analyzer completes:

1. **Update TodoWrite** with refined task description based on taskEssence
2. **Add skill constraints** as first todo: "Confirm skill constraints"
3. **Add verification** as final todo: "Verify skill fidelity"
4. **Reflect warnings** in task decomposition to avoid failure patterns

## Usage Pattern

1. Receive new task from user
2. Run task-analyzer to understand essence
3. Load applicable skills
4. Update TodoWrite with refined understanding
5. Begin implementation following skill guidelines
6. Verify skill fidelity at completion

## References

For skill metadata and selection:
- [Skills Index](references/skills-index.yaml) - Metadata for all available skills including tags, typical usage, and key references
