# Architecture Decision Process

## Purpose

This document defines the architecture decision process for this project and provides guidelines for making consistent technical decisions.

## Cases Requiring Architecture Decisions

### Mandatory Cases

The following changes require **pre-implementation** ADR creation and review:

1. **Type System Changes**
   - Introduction of new type hierarchies
   - Deletion or consolidation of existing major type definitions
   - Changes in type responsibilities or roles

2. **Data Flow Changes**
   - Changes in data storage locations
   - Major changes in processing flows
   - Changes in data passing methods between components

3. **Architecture-Level Changes**
   - Addition of new layers or modules
   - Changes in existing layer responsibilities
   - Relocation of key components

4. **Large-Scale Changes**
   - Changes affecting 5+ files
   - Changes spanning multiple components

5. **External Dependencies**
   - Introduction of new libraries or frameworks
   - Removal or replacement of existing external dependencies
   - Changes in external API integration methods

### Recommended Cases

ADR creation is also recommended for:

- Performance-critical implementation changes
- Security-related design changes
- Decisions significantly affecting future extensibility

## Process Flow

### 1. Problem Identification and Analysis

**Implementation**:
- Clarify problems to be solved
- Organize current issues and constraints
- Identify impact scope

**Deliverable**:
- Problem definition document (context section of ADR)

### 2. Option Consideration

**Implementation**:
- Identify multiple solutions
- Analyze pros and cons of each option
- Clarify trade-offs

**Deliverable**:
- Option comparison table

### 3. ADR Creation

**Implementation**:
- Create ADR using `docs/adr/template-en.md`
- Clearly describe decisions and rationale
- Include implementation guidelines

**Naming Convention**:
- File name: `ADR-[number]-[short-title].md`
- Example: `ADR-0001-deepresearch-data-flow-unification.md`

**Number Assignment Rules**:
- 4-digit sequential format (0001, 0002, 0003...)
- Use maximum existing ADR number + 1
- Number reuse is prohibited (don't reuse numbers of deleted ADRs)

### 4. Review and Approval

**Review Perspectives**:
- Validity of problem definition
- Comprehensiveness of options
- Rationality of decisions
- Implementation feasibility
- Consistency with overall project

**Approval Process**:
1. AI (LLM) creates ADR draft
2. Present to user for review request
3. Modify as needed
4. Update status to "Accepted" after user approval

**Role Definition**:
- **ADR Creator**: AI (Claude and other LLMs)
- **Approver**: User (Project Owner)
- In this project, all ADRs require user approval

### 5. Implementation

**Implementation Considerations**:
- Follow ADR implementation guidelines
- Update ADR if major deviations occur
- Record problems discovered during implementation

### 6. Retrospective and Updates

**Implementation**:
- Evaluate results after implementation
- Record unexpected impacts
- Update ADR as necessary

## ADR Status Management

### Status Types and Transitions

**Status List**:
- **Proposed**: Under proposal (initial state)
- **Accepted**: Approved (ready for implementation)
- **Deprecated**: Deprecated (new method recommended)
- **Superseded**: Replaced (overwritten by new ADR)

**Status Transition Rules**:
1. **Proposed → Accepted**: When review and approval completed
2. **Accepted → Deprecated**: When better method found but existing implementation remains
3. **Accepted → Superseded**: When completely replaced by new ADR
4. **Deprecated → Superseded**: When completely replaced from deprecated state

### ADR Updates and Version Management

**Cases Requiring Updates**:
- When important changes occur during implementation
- When unexpected impacts are discovered after implementation
- When better solutions are found

**Version Management Method**:
- Include update history section within ADR file
- For major changes, create new ADR and mark old ADR as Superseded
- For minor changes, update existing ADR and record update content

## Distinction from Design Documents

### ADR (Architecture Decision Record)

- **Purpose**: Record why the decision was made
- **Content**: Decisions, rationale, trade-offs
- **Timing**: During important technical decisions
- **Audience**: Future developers, decision makers

### Design Document

- **Purpose**: Record how to implement
- **Content**: Detailed design, implementation plan, test strategy
- **Timing**: Before implementing complex features
- **Audience**: Implementation staff, reviewers

## Best Practices

### 1. Early Documentation

- Create drafts from discussion stage
- Document options before making decisions

### 2. Concise and Clear Description

- Maintain technical accuracy while being understandable
- Utilize concrete examples and code samples

### 3. Continuous Updates

- Reflect learnings after implementation
- Update outdated ADRs to "Superseded"

### 4. Team-Wide Sharing

- Notify everyone of important decisions
- Hold regular ADR review meetings

## Special Rules for AI (Claude) Usage

When AI makes code changes, the following rules apply:

1. **Thorough Pre-Confirmation**
   - Propose ADR creation before implementation when 5+ file changes are expected
   - Always confirm with user when changing type definitions or data flows

2. **Checking Existing ADRs**
   - Always read relevant ADRs before changing related features
   - Report when no ADRs exist

3. **Staged Approach**
   - Divide large changes into small steps
   - Clearly explain impact of each step

## Emergency Exception Process

### Cases Requiring Emergency Response

In the following situations, the normal ADR process can be simplified:

1. **Critical production environment failures**
2. **Emergency security vulnerability fixes**
3. **Problems with data loss risk**

### Emergency Process

1. **Immediate Response**: Prioritize problem resolution
2. **Brief Record Creation**: Briefly record response content and reasons
3. **Post-Emergency ADR Creation**: Create formal ADR within 48 hours
4. **Retrospective**: Review and improve emergency response

### Emergency Response Criteria

- Business impact level: High/Critical
- Response urgency: Requires response within 24 hours
- Alternative measures: Temporary workarounds are insufficient