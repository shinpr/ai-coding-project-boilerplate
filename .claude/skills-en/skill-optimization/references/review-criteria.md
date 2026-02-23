# Skill Review Criteria

Criteria for evaluating existing or generated skill content quality.

## Review Flow

### Step 1: Pattern Scan

**Input**: Skill content (SKILL.md frontmatter + body)

**Process**:
1. Scan for each BP pattern (BP-001 through BP-008)
2. Record: pattern ID, severity, location, original text
3. Evaluate against 9 editing principles
4. Count total lines, estimate size category

**Output**: Issue list with severity, location, and original text per finding.

### Step 2: Evaluate and Grade

**Input**: Issue list + skill content

**Process**:
1. Count P1 and P2 issues
2. Count principles passed (pass/partial/fail)
3. Check cross-skill overlap
4. **Balance assessment**:
   - Over-optimization: Excessive constraints for simple topic
   - Lost expertise: Domain knowledge compressed away in structured content
   - Clarity trade-off: Structure obscures main point
   - Description quality: Frontmatter description follows guidelines
5. Assign grade

**Output**: Quality report with grade, issues, and action items.

## Grading

| Grade | Criteria | Recommendation |
|-------|----------|----------------|
| A | 0 P1, 0 P2 issues, 8+ principles pass | Ready for use |
| B | 0 P1, ≤2 P2 issues, 6+ principles pass | Acceptable with noted improvements |
| C | Any P1 OR >2 P2 OR <6 principles pass | Revision required |

## Review Mode Differences

| Aspect | creation | modification |
|--------|----------|-------------|
| Scope | All content, comprehensive | Changed sections + regression check |
| BP scan | All 8 patterns | Focus on patterns relevant to changes |
| Cross-skill check | Full overlap scan | Verify changes didn't introduce overlap |
| Extra check | — | Report issues outside change scope separately |
