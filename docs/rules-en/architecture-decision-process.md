# Architecture Decision Process

## Purpose

This document defines the architecture decision process for this project and provides guidelines for making consistent technical decisions.

## Cases Requiring ADR Creation

**Mandatory**: Type system changes, data flow changes, architecture changes, changes to 5+ files, external dependency addition
**Recommended**: Decisions related to performance, security, and extensibility

## ADR Creation Process

1. **Problem Analysis**: Identify issues and impact scope
2. **Option Consideration**: Compare multiple proposals and analyze trade-offs
3. **ADR Creation**: Document in `ADR-[4-digit number]-[title].md` format
4. **Review and Approval**: AI creates draft → "Accepted" with user approval
5. **Implementation**: Begin implementation following ADR

**Implementation Considerations**:
- Follow ADR implementation guidelines
- Update ADR if significant deviations occur
- Record problems discovered during implementation

### 6. Retrospective and Updates

**Implementation**:
- Evaluate post-implementation results
- Record unexpected impacts
- Update ADR as necessary

## ADR Status

**Proposed** → **Accepted** → **Deprecated/Superseded**

## Distinction Between ADR and Design Doc

**ADR**: Why - Decision rationale and trade-offs
**Design Doc**: How - Implementation details and test strategy

## Rules for AI Usage

- Propose ADR creation for changes to 5+ files
- Always check existing ADRs before implementation
- Post-creation of ADR allowed in emergencies (production failures, security vulnerabilities)

## Referenced Methodologies and Principles
- **ADR Methodology**: Michael Nygard "Documenting Architecture Decisions" (2011)
- **Design Doc Culture**: Google Engineering Practices Documentation
- **Trade-off Analysis**: Software Architecture in Practice (Bass, Clements, Kazman)