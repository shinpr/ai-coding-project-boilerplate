---
description: Investigate problem, verify findings, and derive solutions
---

**Explicit User Instruction**: The user explicitly instructs and authorizes every subagent call named in this recipe. Execute each applicable call when its prerequisites are met.

Execute the `llm-friendly-context` skill (using Skill tool) before writing Agent prompts, handoffs, or generated artifacts.

**Command Context**: Diagnosis flow to identify failure points and present solutions

Target problem: $ARGUMENTS

**Role**: Orchestrator

**Execution Method**:
- Investigation → performed by investigator
- Verification → performed by verifier
- Solution derivation → performed by solver

Orchestrator invokes sub-agents and passes structured JSON between them.

**Execution Gate**: Each step below establishes evidence required by the next decision. Complete Steps 0-6 in order, including every required investigation and verification retry. Advance only through the current step's stated quality or coverage condition; invoke solver only after coverage is closed.

## Step 0: Frame the Problem (Before investigator invocation)

From the reported problem and repository evidence, record the phenomenon, the conditions under which it occurs, and any preceding change the report or repository evidence establishes together with its affected area and the components both share. Carry anything that stays unresolved into the investigator prompt as an investigation target rather than asking the user.

## Diagnosis Flow Overview

```
Problem → investigator → verifier → solver ─┐
                 ↑                          │
                 └── coverage insufficient ─┘
                      (max 2 iterations)

coverage sufficient → Report
```

**Context Separation**: Pass only structured JSON output to each step. Each step starts fresh with the JSON data only.

## Execution Steps

### Step 1: Investigation (investigator)

Invoke investigator using Agent tool:
- `subagent_type`: "investigator"
- `description`: "Collect problem information"
- `prompt`: |
    Comprehensively collect information related to the following phenomenon.

    Phenomenon: [Problem reported by user]
    Occurrence conditions: [Step 0 conditions]
    Preceding change: [Step 0 change, affected area, and shared components, or the unresolved items as investigation targets]

**Expected output**: pathMap (execution paths per symptom), failurePoints (faults found at each node), impactAnalysis per failure point, unexplored areas, investigation limitations

### Step 2: Investigation Quality Check

Review investigation output:

**Quality Check** (verify JSON output contains the following):
- [ ] `pathMap` exists with at least one symptom, and each symptom has at least one path with nodes listed
- [ ] Each failure point has: `location`, `upstreamDependency`, `symptomExplained`, `causalChain` (reaching a stop condition), `checkStatus`, `evidence` with a `source` citing a specific file or location
- [ ] Each failure point has `comparisonAnalysis` (normalImplementation found or explicitly null)
- [ ] `causeCategory` for each failure point is one of: typo / logic_error / missing_constraint / design_gap / external_factor
- [ ] All nodes on mapped paths have been checked (no path was abandoned after finding the first fault)

**If quality insufficient**: Re-run investigator specifying missing items explicitly:
- `prompt`: |
    Re-investigate with focus on the following gaps:
    - Missing: [list specific missing items from quality check]

    Previous investigation results (for context, do not re-investigate covered areas):
    [Previous investigation JSON]

Proceed to verifier once quality is satisfied.

### Step 3: Verification (verifier)

Invoke verifier using Agent tool:
- `subagent_type`: "verifier"
- `description`: "Verify investigation results"
- `prompt`: "Verify the following investigation results. Investigation results: [Investigation JSON output]"

**Expected output**: Coverage check (missing paths, unchecked nodes), Devil's Advocate evaluation per failure point, failure point evaluation with finalStatus, coverage assessment

**Coverage Criteria**:
- **sufficient**: Main paths traced, all critical nodes checked, each failure point individually evaluated
- **partial**: Main paths traced, some nodes unchecked or some failure points at blocked/not_reached
- **insufficient**: Significant paths untraced, or critical nodes not investigated

### Step 4: Coverage Gate

Check verifier's `coverageAssessment`:

- **sufficient** → Proceed to Step 5 (solver)
- **partial or insufficient** → Return to Step 1 with unchecked areas identified by verifier as investigation targets
  - Maximum 2 additional investigation iterations
  - After 2 iterations without reaching sufficient, present user with options:
    - Continue additional investigation
    - Proceed to solver at current coverage level (user accepts risk of incomplete diagnosis)

### Step 5: Solution Derivation (solver)

**Prerequisite**: coverageAssessment=sufficient (or explicit user approval to proceed with partial/insufficient)

Ownership, contract, and technical design corrections are ordinary solution candidates when they preserve the confirmed outcome, desired-future requirements, and non-goals; detecting a design gap does not create a user decision. If evidence shows those value boundaries cannot all remain true, or a proposed remedy requires authorization for an irreversible external action, report that exact boundary with the solution evidence instead of inventing a choice.

Invoke solver using Agent tool:
- `subagent_type`: "solver"
- `description`: "Derive solutions"
- `prompt`: |
    Derive solutions based on the following verified failure points.

    Confirmed failure points: [verifier's conclusion.confirmedFailurePoints]
    Refuted failure points: [verifier's conclusion.refutedFailurePoints]
    Failure point relationships: [verifier's conclusion.failurePointRelationships]
    Impact analysis: [investigator's impactAnalysis]
    Coverage assessment: [sufficient/partial/insufficient]

**Expected output**: Materially distinct feasible solutions derived from the verified cause set, tradeoff analysis, recommendation and implementation steps, residual risks

### Step 6: Final Report Creation

**Prerequisite**: solver completed (Step 5)

After diagnosis completion, report to user in the following format:

```
## Diagnosis Result Summary

### Identified Failure Points
[Confirmed failure points from verification results]
- Per failure point: location, symptom explained, finalStatus

### Verification Process
- Path coverage: [Paths traced and nodes checked]
- Additional investigation iterations: [0/1/2]
- Coverage assessment: [sufficient/partial/insufficient]

### Recommended Solution
[Solution derivation recommendation]

Rationale: [Selection rationale]

### Implementation Steps
1. [Step 1]
2. [Step 2]
...

### Alternatives
[Alternative description]

### Residual Risks
[solver's residualRisks]

### Post-Resolution Verification Items
- [Verification item 1]
- [Verification item 2]
```

## Completion Criteria

- [ ] Executed investigator and obtained pathMap, failurePoints, and impactAnalysis
- [ ] Performed investigation quality check and re-ran if insufficient
- [ ] Executed verifier and obtained coverage assessment
- [ ] Executed solver
- [ ] Achieved coverageAssessment=sufficient (or obtained user approval after 2 additional iterations)
- [ ] Presented final report to user
