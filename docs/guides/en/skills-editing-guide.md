# Skills Editing Guide

This guide covers the concepts and best practices for creating effective skills that maximize LLM execution accuracy, based on how LLMs work.

## Project Philosophy and the Importance of Skills

This boilerplate is designed based on the concepts of "Agentic Coding" and "Context Engineering":
- **Agentic Coding**: LLMs autonomously making decisions and carrying out implementation tasks
- **Context Engineering**: Building mechanisms to provide appropriate context at the right time for LLMs to make proper decisions

For details, see [this article](https://dev.to/shinpr/zero-context-exhaustion-building-production-ready-ai-coding-teams-with-claude-code-sub-agents-31b).

Skills are written to maximize LLM execution accuracy as described below, and work together with [sub-agents](https://docs.anthropic.com/en/docs/claude-code/sub-agents) to achieve this.

Sub-agents have dedicated contexts separate from the main agent, loading only the skills necessary for their specific responsibilities. The main agent uses metacognition to understand task context, select necessary skills, and execute tasks. This approach maximizes execution accuracy by retrieving the right skills at the right time.

While it's impossible to completely control LLM output, it is possible to maximize execution accuracy through proper systems. When results don't match expectations, consider improving your skills.

## Determining Where to Document

### File Roles and Scope

| File | Scope | When Applied | Example Content |
|------|-------|--------------|-----------------|
| **CLAUDE.md** | All tasks | Always | Approval required before Edit/Write, stop at 5+ file changes |
| **Skills** | Specific technical domains | When using that technology | Use specific types, error handling required, functions under 30 lines |
| **Guidelines** | Specific workflows | When performing that workflow | Sub-agent selection strategies |
| **Design Docs** | Specific features | When developing that feature | Feature requirements, API specifications, security constraints |

### Decision Flow

```
When is this information needed?
├─ Always → CLAUDE.md
├─ Only for specific feature development → Design Doc
├─ When using specific technology → Skill
└─ When performing specific workflow → Guideline
```

## Skills Structure and Best Practices

For full details on the Claude Code skills system, see the [official documentation](https://code.claude.com/docs/en/skills).

### SKILL.md Composition

```
my-skill/
├── SKILL.md           # Main instructions (required)
├── references/        # Detailed reference material (on-demand loading)
├── scripts/           # Executable scripts
└── examples/          # Example outputs
```

SKILL.md consists of YAML frontmatter and Markdown content.

```yaml
---
name: skill-name
description: Start with a verb. Use when: specify trigger conditions.
---
# Skill content
```

### Naming Conventions

Use consistent naming patterns. The [official recommendation](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) suggests **gerund form** (verb + -ing) for clarity.

- **Gerund form (recommended)**: `processing-pdfs`, `managing-databases`, `testing-code`
- **Action-oriented (acceptable)**: `process-pdfs`, `analyze-spreadsheets`
- **Avoid vague names**: `helper`, `utils`, `tools`, `documents`

**Constraints**: lowercase letters, numbers, and hyphens only. Maximum 64 characters. Cannot contain "anthropic" or "claude".

### Writing Effective Descriptions

The description is the most critical field — it determines skill selection accuracy. At startup, only metadata (name and description) from all skills is loaded. Claude uses descriptions to decide which skill to activate from potentially 100+ available skills. [Research indicates](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) that well-optimized descriptions can improve activation rates from 20% to over 90%.

**Rules**:

1. **Write in third person**: The description is injected into the system prompt. Inconsistent point-of-view causes discovery problems.
   - Good: "Processes Excel files and generates reports"
   - Avoid: "I can help you process Excel files"
   - Avoid: "You can use this to process Excel files"
2. **Start with a verb**: "Applies TDD process and inspects quality" not "Testing principles"
3. **Use "Use when:" with concrete triggers**: 3-5 triggers using expressions users actually say
4. **Be specific and include key terms**: Include both what the skill does and when to use it
5. **Over 200 characters signals a split**: The skill's responsibility may be too broad

**Constraints**: Maximum 1024 characters. Cannot contain XML tags.

**Good examples**:
```yaml
# Specific, verb-first, with triggers
description: Extracts text and tables from PDF files, fills forms, merges documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.

description: Generates descriptive commit messages by analyzing git diffs. Use when the user asks for help writing commit messages or reviewing staged changes.
```

**Bad examples**:
```yaml
# Too vague — Claude can't determine when to activate
description: Helps with documents
description: Processes data
description: Does stuff with files
```

### Keep File References One Level Deep

Claude may partially read files when they're referenced from other referenced files. Keep all references directly from SKILL.md to ensure complete reads.

```markdown
# Good: One level deep from SKILL.md
See [reference.md](reference.md) for API details
See [examples.md](examples.md) for usage patterns

# Bad: Nested references
# SKILL.md → advanced.md → details.md (Claude may not fully read details.md)
```

### Progressive Disclosure

| Level | When Loaded | Content |
|-------|------------|---------|
| description | Always in context | Metadata only (used for skill selection) |
| SKILL.md body | When skill is invoked | Main instructions |
| Supporting files | On-demand when needed | Detailed references, scripts |

This mechanism maintains token efficiency even with many skills defined. Reference supporting files from SKILL.md with `[reference.md](reference.md)` so Claude loads details only when needed.

### When to Split

- SKILL.md body exceeds **500 lines** → Extract to supporting files ([official recommendation](https://code.claude.com/docs/en/skills))
- Description has **5+ "Use when:" triggers** → Responsibility too broad, split the skill
- Language-specific details → Separate into `references/`

### Common Mistakes

| Mistake | Why It's a Problem | Solution |
|---------|-------------------|----------|
| Writing general practices LLM already knows | Context waste | Only write project-specific judgment criteria |
| Putting always-applicable content in skills | Risk of not loading when needed | Place in CLAUDE.md instead |
| Writing frequently-changing information in skills | Staleness risk | Manage in Design Docs or comments |

## 9 Principles for Maximizing LLM Execution Accuracy

Here are 9 skill creation principles based on LLM characteristics and this boilerplate's design philosophy.
We provide `/create-skill` for creating new skills through interactive dialog, and `/refine-skill` for modifying existing skills with quality review. We ultimately recommend interactive editing through dialogue, as LLMs tend to have difficulty reaching issues without comparing output with thinking after generation.

### 1. Achieve Maximum Accuracy with Minimum Description (Context Pressure vs. Execution Accuracy)

Context is a precious resource. Avoid redundant explanations and include only essential information.
However, it's not just about being short — it must be the minimum description that doesn't cause decision hesitation.

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
# .claude/skills/error-handling/SKILL.md
Standard error format: { success: false, error: string, code: number }

# .claude/skills/api-design/SKILL.md
Error responses follow standard error format `{ success: false, error: string, code: number }`

✅ Consolidated in one location
# .claude/skills/error-handling/SKILL.md
Standard error format: { success: false, error: string, code: number }
```

Check for duplication between files and eliminate contradictions and redundancy.
Eliminating duplication also reduces maintenance costs by preventing notation inconsistencies from update omissions.

### 4. Appropriately Aggregate Responsibilities

Consolidating related content in one skill maintains single responsibility and prevents unnecessary context mixing in tasks.

```markdown
# Authentication consolidated in one skill
.claude/skills/auth/SKILL.md
├── JWT Specification
├── Authentication Flow
├── Error Handling
└── Security Requirements

# ❌ Dispersed responsibilities
.claude/skills/auth/SKILL.md
├── JWT Specification
├── Error Handling
└── Security Requirements
.claude/skills/auth-flow/SKILL.md
├── User Registration Flow
└── Authentication Flow
```

However, if a skill becomes too large, reading costs increase, so aim for logical division around 250 lines (approximately 1,500 tokens).

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

If prohibitions are needed, present them as background context rather than the main instruction.

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

Use the `/project-inject` command at project start or when project assumptions change to document project context as a skill.

### 8. Arrange Descriptions by Importance

LLMs pay more attention to information at the beginning. Place most important items first, exceptional cases last.

```markdown
# API Specifications

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
## Scope of This Skill

### Covered
- REST APIs in general
- GraphQL endpoints
- WebSocket communication

### Not Covered
- Static file delivery
- Health check endpoint (/health)
- Metrics endpoint (/metrics)
```

## Reference: Skills and Applied Principles

Skill files under `.claude/skills/` are created with these principles in mind.
Each is written with no duplication, single responsibility, and minimal description, serving as references when adding or creating new skills.

| Skill | Main Content | Examples of Applied Principles |
|-------|-------------|--------------------------------|
| **typescript-rules** | TypeScript code creation/modification/refactoring, modern type features | **Principle 2**: Unified notation (consistent terms like "any type completely prohibited")<br>**Principle 5**: Measurable criteria (20 fields max, 3 nesting levels max) |
| **typescript-testing** | Test creation, quality checks, development steps | **Principle 5**: Measurable criteria (coverage 70% or more)<br>**Principle 8**: Arrangement by importance (quality requirements at the top) |
| **coding-standards** | Technical decision criteria, anti-pattern detection, best practices | **Principle 6**: Show NG patterns in recommended format (anti-pattern collection)<br>**Principle 3**: Eliminate duplication (Rule of Three for consolidation decisions) |
| **technical-spec** | Technical design, environment setup, documentation process | **Principle 4**: Aggregate responsibilities (technical design in one file)<br>**Principle 7**: Verbalize implicit assumptions (security rules documented) |
| **project-context** | Project-specific prerequisites for AI execution accuracy | **Principle 7**: Verbalize implicit assumptions (project characteristics documented)<br>**Principle 1**: Maximum accuracy with minimum description (concise bullet format) |
| **documentation-criteria** | Scale determination, document creation criteria | **Principle 5**: Measurable criteria (creation decision matrix)<br>**Principle 9**: Clarify scope boundaries (clearly state what's included/excluded) |
| **implementation-approach** | Implementation strategy selection, task breakdown, large-scale change planning | **Principle 8**: Arrangement by importance (Phase-ordered structure)<br>**Principle 6**: Show NG patterns in recommended format (risk analysis) |

All 9 principles are practiced across these skills, serving as practical references for skill creation.

## Troubleshooting

### Problem: Skills are too long and overload the context window

**Solutions**
1. Find and remove duplications
2. Minimize examples
3. Extract to supporting files
4. Move low-priority content to separate skills

### Problem: Inconsistent generation results

**Solutions**
1. Unify terms and notation
2. Quantify decision criteria
3. Clarify priorities
4. Eliminate contradicting skills

### Problem: Important instructions are not followed

**Solutions**
1. Move to file beginning
2. Add 【Required】【Important】 tags
3. Add one specific example
4. Convert negative form to positive form

## Summary

Well-written skills stabilize LLM output. By following the 9 principles and continuously refining your skills, you can maximize LLM capabilities. Build the optimal skill set for your project through regular implementation review and improvement.
