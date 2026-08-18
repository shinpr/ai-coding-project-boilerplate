# Skill Review Criteria

Criteria for evaluating existing or generated skill content quality.

## Review Flow

### Step 1: Pattern Scan

1. Scan BP-001 through BP-009.
2. Record a stable finding ID, rule ID, severity, location, original text, observable effect, and suggested fix for each unresolved issue.
3. Evaluate all 10 editing principles.
4. Count lines and estimate the size category.

On re-review, preserve the ID of the same issue. Join prior resolutions by finding ID. Record an evidence-backed decline in `acceptedDeclines` when the proposed change adds scope, duplicates proof, or has no observable effect. An accepted decline contributes zero to findings, grade counts, failed principles, and required actions. Return the issue again only when new evidence shows that the result remains incorrect or unverifiable. The caller resolves each `user_decision` before re-review.

**Analysis gate**: Proceed when all 9 patterns are covered, every unresolved issue has evidence and a stable ID, preservation requirements are explicit, and no unknown blocks faithful review.

### Step 2: Progressive Disclosure Evaluation

| Tier | Target | Verification |
|------|--------|-------------|
| Tier 1 | description | Passes the description quality checklist in `creation-guide.md` |
| Tier 2 | SKILL.md body | Under 500 lines, target 250; first-screen test, standard section order, and conditional guards pass; each section above the target passes the necessity test |
| Tier 3 | References/scripts | Compression precedes splitting; references contain necessary conditional detail, remain one level deep, and have no nested reference chains |

Each failed tier references at least one existing BP or principle finding. Tier 1 fails when the description lacks the selection evidence needed to activate the skill for its intended requests; that failure forces grade C. Map a missing or incorrect activation scope or caller trigger to principle-9, and absent non-baseline distinguishing value to principle-1. Tier 2 and Tier 3 have no independent grade effect and contribute through their referenced findings, principle results, or balance checks. Record other checklist deviations only when they have an observable selection effect.

For pure skills, verify standalone execution. Duplication across independently loaded pure skills is valid when each copy is required; record only semantic conflicts or in-skill duplication. Cross-skill references are valid for orchestration and skill-selection roles.

### Step 3: Evaluate and Grade

1. Keep unresolved issues in `findings` and evidence-backed declines in `acceptedDeclines`.
2. Count P1 and P2 findings.
3. Count only principles with `pass` status.
4. Check cross-skill overlap using the standalone-execution rule above.
5. Evaluate:
   - Over-optimization: excessive constraints or generated obligations; content above 250 lines without completed compression
   - Work generation: findings or possibilities become unsupported artifacts, tests, gates, or decisions
   - Lost expertise: domain knowledge is removed by restructuring
   - Clarity trade-off: structure obscures the main point
   - Description quality: frontmatter description follows trigger guidance
6. Assign the grade.

**Output**: A quality report containing:
- BP-001 through BP-009 coverage
- unresolved `findings` and evidence-backed `acceptedDeclines`
- preservation requirements and unresolved inputs
- Progressive Disclosure and 10-principle results
- six balance checks: intent preservation, decision sufficiency, information density, constraint necessity, work proportionality, and traceability
- final grade

**Balance gate**: Each balance check records pass or blocked with evidence. A blocked check references a finding and prevents grade A.

## Grading

| Grade | Criteria | Recommendation |
|-------|----------|----------------|
| A | 0 P1, 0 P2 findings, 9+ principles pass, Tier 1 pass | Ready for use |
| B | 0 P1, at most 2 P2 findings, 7+ principles pass, Tier 1 pass | Acceptable with noted improvements |
| C | Any P1, more than 2 P2 findings, fewer than 7 principles pass, or Tier 1 fail | Revision required |

## Review Mode Differences

| Aspect | creation | modification |
|--------|----------|-------------|
| Scope | All content, comprehensive | Changed sections plus regression check |
| BP scan | All 9 patterns | Patterns relevant to the changes |
| Cross-skill check | Full overlap scan | Verify changes introduced no conflict or unnecessary duplication |
| Extra check | — | Report issues outside change scope separately |
