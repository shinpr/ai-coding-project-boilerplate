---
name: task-analyzer
description: Classifies task intent, change risk, and execution scale, then selects skills from the project skills index. Use when starting work, routing a task, estimating scope, or selecting skills.
---

# Task Analyzer

Provides metacognitive task analysis and skill selection guidance.

## Skills Index

See **[skills-index.yaml](references/skills-index.yaml)** for available skills metadata.

## Task Analysis Process

### 1. Understand Task Essence

Identify the fundamental purpose beyond surface-level work:

| Surface Work | Fundamental Purpose |
|--------------|---------------------|
| "Fix this bug" | Problem solving, root cause analysis |
| "Implement this feature" | Feature addition, value delivery |
| "Refactor this code" | Quality improvement, maintainability |
| "Update this file" | Change management, consistency |

**Key Questions:**
- What problem are we really solving?
- What is the expected outcome?
- What could go wrong if we approach this superficially?

### 2. Estimate Structural Scale

Classify decision burden from the intended outcomes and responsibility boundaries. File count is supporting evidence only.

| Scale | Decision burden |
|-------|-----------------|
| Small | One coherent outcome, one evident repository-supported implementation within one responsibility boundary, and no unresolved durable choice |
| Medium | One coherent outcome that coordinates a boundary or contains a potentially durable choice |
| Large | Multiple independently valuable outcomes that require separate design decisions |

A cross-layer implementation can remain Medium when it serves one coherent outcome. A decision point passing both documentation-criteria ADR filters raises the scale to Medium at minimum. Record the evidence that established the outcome and boundary classification in `scaleRationale`.

**Scale affects skill priority:**
- Larger scale → process/documentation skills more important
- Smaller scale → implementation skills more focused

### 3. Identify Task Type

| Type | Characteristics | Key Skills |
|------|-----------------|------------|
| implementation | New code or user-visible behavior | coding-standards, typescript-testing |
| fix | Defect or regression resolution | coding-standards, typescript-testing |
| refactoring | Behavior-preserving structure improvement | coding-standards, implementation-approach |
| design | Architecture or contract decisions | documentation-criteria, implementation-approach |
| quality | Testing, review, verification | typescript-testing, integration-e2e-testing |
| documentation | PRD, ADR, Design Doc, UI Spec, plan, or instruction content | documentation-criteria |
| investigation | Evidence gathering without implementation | project-context plus the domain skill selected from the index |
| migration | Data, schema, API, dependency, or runtime transition | implementation-approach, documentation-criteria |
| operations | Environment, deployment, or runtime operation | technical-spec plus the domain skill selected from the index |
| security | Security design or review | coding-standards plus the implementation-domain skill |
| skill | Skill creation, prompt-quality review, or skill metadata change | skill-optimization, llm-friendly-context |

When multiple types apply, return the primary type that owns the requested outcome and list the remaining values in `secondaryTypes`.

### 4. Tag-Based Skill Matching

Extract relevant tags from task description and match against skills-index.yaml:

```yaml
Task: "Implement user authentication with tests"
Extracted tags: [implementation, testing, security]
Matched skills:
  - coding-standards (implementation, security)
  - typescript-testing (testing)
  - typescript-rules (implementation)
```

### 5. Implicit Relationships

Consider hidden dependencies:

| Task Involves | Also Include |
|---------------|--------------|
| Error handling | debugging, testing |
| New features | design, implementation, documentation |
| Performance | profiling, optimization, testing |
| Frontend | typescript-rules, typescript-testing |
| API/Integration | integration-e2e-testing |

## Output Format

Return structured analysis with skill metadata from skills-index.yaml:

```yaml
taskAnalysis:
  essence: <string>  # Fundamental purpose identified
  type: <implementation|fix|refactoring|design|quality|documentation|investigation|migration|operations|security|skill>
  secondaryTypes: [<task-type>, ...]
  scale: <small|medium|large>
  estimatedFiles: <number or unknown>  # Supporting evidence only
  scaleRationale:
    decidingAxis: <outcomes|responsibility-boundaries|durable-choice>
    evidence: <string>
  tags: [<string>, ...]  # Extracted from task description

selectedSkills:
  - skill: <skill-name>  # From skills-index.yaml
    priority: <high|medium|low>
    reason: <string>  # Why this skill was selected
    # Pass through metadata from skills-index.yaml
    tags: [...]
    typical-use: <string>
    size: <small|medium|large>
    sections: [...]  # All sections from yaml, unfiltered
```

**Note**: Section selection (choosing which sections are relevant) is done separately after reading the actual SKILL.md files.

## Process Gates

1. **Intent gate**: Proceed to scale estimation when `essence`, primary `type`, and any `secondaryTypes` are recorded. If the requested outcome is ambiguous, record the exact outcome decision required.
2. **Scale gate**: Proceed to skill matching when the outcome and responsibility-boundary evidence is sufficient for Structural Scale and `scaleRationale` names the deciding axis.
3. **Selection gate**: Finalize when every selected skill exists in `skills-index.yaml`, has a reason tied to the task, and its metadata is copied without invention.

When an unknown can change the outcome boundary, ADR qualification, or required workflow, request the exact repository evidence or user decision needed. An unknown file count alone does not block Structural Scale judgment.

## Skill Selection Priority

1. **Essential** - Directly related to task type
2. **Quality** - Testing and quality assurance
3. **Process** - Workflow and documentation
4. **Supplementary** - Additional constraints or evidence directly tied to the task

## Metacognitive Question Design

Generate only questions whose answers can change intent classification, scale, selected skills, a hard constraint, or verification. Return no question when repository evidence already resolves those decisions. For every question, record the decision it controls.

| Task Type | Question Focus |
|-----------|----------------|
| Implementation | Design validity, edge cases, performance |
| Fix | Root cause (5 Whys), impact scope, regression testing |
| Refactoring | Current problems, target state, phased plan |
| Design | Requirement clarity, future extensibility, trade-offs |
| Documentation | Audience, source of truth, approval/consumer contract |
| Investigation | Claim to resolve, evidence boundary, stopping condition |
| Migration | Compatibility window, data/contract transition, rollback |
| Operations | Target environment, authorization boundary, recovery evidence |
| Security | Trust boundary, protected asset, threat/acceptance source |
| Skill | Triggering intent, standalone context, output consumer |

## Warning Patterns

Detect and flag these patterns:

| Pattern | Warning | Mitigation |
|---------|---------|------------|
| One step contains multiple independently verifiable outcomes | Transition and rollback risk | Split at observable verification boundaries |
| A behavior change has no test or named runnable verification | Regression evidence is missing | Add the cheapest check that observes the changed contract |
| A proposed fix has no observed causal link to the failure | Root cause remains inferred | Record reproduction evidence and the first causal boundary before selecting the fix |
| Medium/Large implementation lacks its scale-required planning artifact | Scope and dependency contract is missing | Create the required artifact before implementation routing |
