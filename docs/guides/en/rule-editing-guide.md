# Rule Editing Guide

This guide explains the core concepts and best practices for writing effective rules that maximize LLM execution accuracy, based on how LLMs work.

## Project Philosophy and the Importance of Rule Files

This boilerplate is designed based on the concepts of "Agentic Coding" and "Context Engineering":
- **Agentic Coding**: LLMs autonomously making decisions and carrying out implementation tasks
- **Context Engineering**: Building mechanisms to provide appropriate context at the right time for LLMs to make proper decisions

For details, see [this article](https://dev.to/shinpr/zero-context-exhaustion-building-production-ready-ai-coding-teams-with-claude-code-sub-agents-31b).

Proper rule management and [sub-agents](https://docs.anthropic.com/en/docs/claude-code/sub-agents) are crucial keys to realizing these concepts.

Rule files are written to maximize LLM execution accuracy as described below.

Sub-agents have dedicated contexts separate from the main agent. They are designed to load only the necessary rule files to fulfill specific responsibilities.
When the main agent executes tasks, it uses "metacognition" (reflecting on and analyzing its own reasoning process) to understand task context, select necessary rules from the rule file collection, and execute tasks.
This approach maximizes execution accuracy by retrieving the right rules at the right time without excess or deficiency.

While it's impossible to completely control LLM output, it is possible to maximize execution accuracy by establishing proper systems.
Conversely, LLM execution accuracy can easily degrade depending on rule file content.

With the premise that complete control is impossible, executing tasks, reflecting on issues that arise, and feeding back into the system enables maintaining and improving execution accuracy.
When using this in actual projects and results don't match expectations, consider improving rule files.

## Determining Where to Document Rules

### File Roles and Scope

| File | Scope | When Applied | Example Content |
|------|-------|--------------|-----------------|
| **CLAUDE.md** | All tasks | Always | Approval required before Edit/Write, stop at 5+ file changes |
| **Rule files** | Specific technical domains | When using that technology | Use specific types, error handling required, functions under 30 lines |
| **Guidelines** | Specific workflows | When performing that workflow | Sub-agent selection strategies |
| **Design Docs** | Specific features | When developing that feature | Feature requirements, API specifications, security constraints |

### Decision Flow

```
When is this rule needed?
├─ Always → CLAUDE.md
├─ Only for specific feature development → Design Doc
├─ When using specific technology → Rule files
└─ When performing specific workflow → Guidelines
```

## 9 Rule Principles for Maximizing LLM Execution Accuracy

Here are 9 rule creation principles based on LLM characteristics and this boilerplate's design philosophy.
While we provide a `/refine-rule` custom slash command to assist with rule modifications, we ultimately recommend interactive rule editing through dialogue rather than commands, as LLMs tend to have difficulty reaching issues without comparing output with thinking after generation.

### 1. Achieve Maximum Accuracy with Minimum Description (Context Pressure vs. Execution Accuracy)

Context is a precious resource. Avoid redundant explanations and include only essential information.
However, it's not just about being short - it must be the minimum description that doesn't cause decision hesitation.

```markdown
❌ Redundant description (22 words)
Please make sure to record all errors in the log when they occur

✅ Concise description (9 words)
All errors must be logged

❌ Over-abbreviated description (6 words)
Record all errors
```

Aim for concise expressions that keep the same meaning. But don't shorten so much that ambiguity is introduced.

### 2. Completely Unify Notation

Always use the same terms for the same concepts. Notation inconsistencies hinder LLM understanding.

```markdown
# Term Definitions (Unified across project)
- API response/return value → Unified as `response`
- User/customer → Unified as `user`
- Error/abnormality → Unified as `error` (exception/failure may be used depending on context)
```

### 3. Thoroughly Eliminate Duplication

Repeating the same content across multiple files wastes context capacity. Consolidate in one place.

```markdown
❌ Same content in multiple locations
# docs/rules/base.md
Standard error format: { success: false, error: string, code: number }

# docs/rules/api.md
Error responses follow standard error format `{ success: false, error: string, code: number }`

✅ Consolidated in one location
# docs/rules/base.md
Standard error format: { success: false, error: string, code: number }
```

Check for duplication between files and eliminate contradictions and redundancy.
Eliminating duplication also reduces maintenance costs by preventing notation inconsistencies from update omissions.

### 4. Appropriately Aggregate Responsibilities

Consolidating related content in one file maintains single responsibility and prevents unnecessary context mixing in tasks.

```markdown
# Authentication consolidated in one file
docs/rules/auth.md
├── JWT Specification
├── Authentication Flow
├── Error Handling
└── Security Requirements

# ❌ Dispersed responsibilities
docs/rules/auth.md
├── JWT Specification
├── Error Handling
└── Security Requirements
docs/rules/flow.md
├── User Registration Flow
└── Authentication Flow
```

However, if a file becomes too large, reading costs increase, so aim for logical division or rule selection around 250 lines (approximately 1,500 tokens).

### 5. Set Measurable Decision Criteria

Ambiguous instructions cause interpretation inconsistencies. Clarify criteria with numbers and specific conditions.

```markdown
✅ Measurable criteria
- Function lines: 30 or less
- Cyclomatic complexity: 10 or less
- Response time: Within 200ms at p95
- Test coverage: 80% or more

❌ Ambiguous criteria
- Readable code
- Fast processing
- Sufficient tests
```

Note that LLMs cannot understand time, so descriptions like "break down tasks to complete within 30 minutes" are not effective.

### 6. Show NG Patterns as Recommendations with Background

Showing recommended patterns with reasons is more effective than listing prohibitions.

```markdown
✅ Description in recommended format
【State Management】
Recommended: Use Zustand or Context API
Reason: Global variables are difficult to test and state tracking is complex
NG Example: window.globalState = { ... }

❌ List of prohibitions
- Don't use global variables
- Don't save values to window object
```

If prohibitions are needed, present them as background context rather than the main rule.

### 7. Verbalize Implicit Assumptions

Even things obvious to human developers must be explicitly stated for LLMs to understand.

```markdown
## Prerequisites
- Execution environment: Node.js 20.x on AWS Lambda
- Maximum execution time: 15 minutes (Lambda limit)
- Memory limit: 3GB
- Concurrent executions: 1000 (account limit)
- Timezone: All UTC
- Character encoding: UTF-8 only
```

Use the `/project-inject` command at project start or when project assumptions change to document project context as rules.

### 8. Arrange Descriptions by Importance

LLMs pay more attention to information at the beginning. Place most important rules first, exceptional cases last.

```markdown
# API Rules

## Critical Principles (Must follow)
1. All APIs require JWT authentication
2. Rate limit: 100 requests/minute
3. Timeout: 30 seconds

## Standard Specifications
- Methods: Follow REST principles
- Body: JSON format
- Character encoding: UTF-8

## Exceptional Cases (Only for special situations)
- multipart/form-data allowed only for file uploads
- WebSocket connections only at /ws endpoint
```

### 9. Clarify Scope Boundaries

Explicitly stating what is and isn't covered prevents unnecessary processing and misunderstandings.

```markdown
## Scope of This Rule

### Covered
- REST APIs in general
- GraphQL endpoints
- WebSocket communication

### Not Covered
- Static file delivery
- Health check endpoint (/health)
- Metrics endpoint (/metrics)
```

## Reference: Efficient Rule Writing

Rule files under `docs/rules` are created with these principles in mind.
Each is written with no duplication, single responsibility, and minimal description, serving as references when adding or creating new rules.

### Correspondence Between Rule Files and Applied Principles

| Rule File | Main Content | Examples of Applied Principles |
|-----------|-------------|--------------------------------|
| **typescript.md** | TypeScript code creation/modification/refactoring, modern type features | **Principle 2**: Unified notation (consistent terms like "any type completely prohibited")<br>**Principle 5**: Measurable criteria (20 fields max, 3 nesting levels max) |
| **typescript-testing.md** | Test creation, quality checks, development steps | **Principle 5**: Measurable criteria (coverage 70% or more)<br>**Principle 8**: Arrangement by importance (quality requirements at the top) |
| **ai-development-guide.md** | Technical decision criteria, anti-pattern detection, best practices | **Principle 6**: Show NG patterns in recommended format (anti-pattern collection)<br>**Principle 3**: Eliminate duplication (Rule of Three for consolidation decisions) |
| **technical-spec.md** | Technical design, environment setup, documentation process | **Principle 4**: Aggregate responsibilities (technical design in one file)<br>**Principle 7**: Verbalize implicit assumptions (security rules documented) |
| **project-context.md** | Project-specific information, implementation principles | **Principle 7**: Verbalize implicit assumptions (project characteristics documented)<br>**Principle 1**: Maximum accuracy with minimum description (concise bullet format) |
| **documentation-criteria.md** | Scale determination, document creation criteria | **Principle 5**: Measurable criteria (creation decision matrix)<br>**Principle 9**: Clarify scope boundaries (clearly state what's included/excluded) |
| **implementation-approach.md** | Implementation strategy selection, task breakdown, large-scale change planning | **Principle 8**: Arrangement by importance (Phase-ordered structure)<br>**Principle 6**: Show NG patterns in recommended format (risk analysis) |

All 9 principles are practiced across these files, serving as practical references for rule creation.

## Troubleshooting

### Problem: Rules are too long and overload the context window

**Solutions**
1. Find and remove duplications
2. Minimize examples
3. Utilize reference format
4. Move low-priority rules to separate files

### Problem: Inconsistent generation results

**Solutions**
1. Unify terms and notation
2. Quantify decision criteria
3. Clarify priorities
4. Eliminate contradicting rules

### Problem: Important rules are not followed

**Solutions**
1. Move to file beginning
2. Add 【Required】【Important】 tags
3. Add one specific example
4. Convert negative form to positive form

## Summary

Well-written rules stabilize LLM output. By following the 9 principles and continuously refining your rules, you can maximize LLM capabilities. Build the optimal rule set for your project through regular implementation review and improvement.