---
name: frontend-technical-spec
description: Defines React environment, component architecture, state/data flow, build verification, and frontend non-functional criteria from repository evidence. Use when configuring or designing a React frontend, its build, or its runtime boundaries.
---

# Technical Design Rules (Frontend)

## Prerequisite Detection

Inspect `package.json`, the lockfile, TypeScript/build configuration, CI definitions, and representative components before applying a tool- or framework-specific rule. Treat React, Vite, Next.js, a state library, form library, or script as available only when repository evidence names it. Label surrounding-pattern conclusions as inferred. When a missing decision changes rendering architecture, compatibility, security, or verification, stop and name the exact evidence or user decision required.

## Basic Technology Stack Policy
These rules apply when repository configuration confirms a TypeScript-based React application. Select architecture by mapping current requirements and constraints to component responsibilities, state ownership, server/client boundaries, and observable verification points.

## Environment Variable Management and Security

### Environment Variable Management
- **Use the build tool's client-exposure mechanism**: Browser code can read only values explicitly exposed by the configured bundler/framework; server-only environment access remains outside client bundles
- Centrally manage environment variables through configuration layer
- Parse exposed values at one typed configuration boundary before application use
- Give a value a default only when requirements define valid behavior for absence; otherwise fail startup/build validation with the variable name and expected format

```typescript
// Build tool environment variables (public values only; client-exposed vars need the VITE_ prefix)
const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  appName: import.meta.env.VITE_APP_NAME || 'My App'
}

// Does not work in frontend
const apiUrl = process.env.API_URL
```

### Security (Client-side Constraints)
- **CRITICAL**: All frontend code is public and visible in browser
- **Keep secrets server-side**: Client-exposed configuration contains public values only; a backend or trusted service owns API keys, tokens, and credentials
- Keep local `.env` files outside version control and provide non-secret example files for required variable names
- Log and return only fields approved for the current trust boundary; redact passwords, tokens, and personal data

**Correct Approach for Secrets**:
```typescript
// Security risk: API key exposed in browser
const apiKey = import.meta.env.VITE_API_KEY
const response = await fetch(`https://api.example.com/data?key=${apiKey}`)

// Correct: Backend manages secrets, frontend accesses via proxy
const response = await fetch('/api/data') // Backend handles API key authentication
```

## Architecture Design

### Frontend Architecture Patterns

**React Component Architecture**:
- **Function Components**: Mandatory; class components allowed solely for Error Boundaries (no hook equivalent)
- **Custom Hooks**: For logic reuse and dependency injection
- **Component Hierarchy**: Atoms -> Molecules -> Organisms -> Templates -> Pages
- **Props-driven**: Components receive all necessary data via props
- **Co-location**: Place tests, styles, and related files alongside components

Select a component/state pattern using these rules:
- Keep state local when one component subtree owns every read and write
- Use Context when multiple descendants require the same low-frequency state and the provider boundary is explicit
- Use a server-state library only when the configured dependency exists and caching, deduplication, background refresh, or request lifecycle state is required
- Introduce an additional state-management dependency only when current requirements cannot be covered by local state, reducer state, existing Context, or the repository's established state mechanism

**State Management Patterns**:
- **Local State**: `useState` for component-specific state
- **Context API**: For sharing state across component tree (theme, auth, etc.)
- **Custom Hooks**: Encapsulate state logic and side effects
- **Server State**: React Query or SWR for API data caching

## Unified Data Flow Principles

### Client-side Data Flow
Maintain consistent data flow throughout the React application:

- **Single Source of Truth**: Each piece of state has one authoritative source
  - UI state: Component state or Context
  - Server data: API responses cached in React Query/SWR
  - Form data: Controlled components with React Hook Form

- **Unidirectional Flow**: Data flows top-down via props
  ```
  API Response -> State -> Props -> Render -> UI
  User Input -> Event Handler -> State Update -> Re-render
  ```

- **Immutable Updates**: Use immutable patterns for state updates
  ```typescript
  // Immutable state update
  setUsers(prev => [...prev, newUser])

  // Invalid mutable state update
  users.push(newUser)
  setUsers(users)
  ```

### Type Safety in Data Flow
- **Frontend -> Backend**: Props/State (Type Guaranteed) -> API Request (Serialization)
- **Backend -> Frontend**: API Response (`unknown`) -> Type Guard -> State (Type Guaranteed)

```typescript
// Type-safe data flow
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`)
  const data: unknown = await response.json()

  if (!isUser(data)) {
    throw new Error('Invalid user data')
  }

  return data // Type guaranteed as User
}
```

## Build and Testing
Select the package manager from the `packageManager` field, lockfile, or CI command in that order. Execute only scripts present in the selected manifest.

### Build Commands
- Auto-detect and execute the following from package.json scripts:
  - Development server
  - Production build
  - Type check (no emit)

### Testing Commands
- `test` - Run tests
- `test:safe` - Safe test execution (with auto cleanup)
- `cleanup:processes` - Cleanup Vitest processes

### Quality Check Requirements
Quality checks are mandatory upon implementation completion:

**Phase 1-3: Basic Checks**
- `check` - Biome (lint + format)
- `build` - TypeScript build

**Transition evidence**: every configured lint/format/type/build check exits successfully. A missing required script blocks the next phase until an equivalent repository command is identified.

**Phase 4-5: Tests and Final Confirmation**
- `test` - Test execution
- `check:all` - Overall integrated check

**Completion evidence**: configured tests pass, the production build succeeds, and the integrated check remains clean after test fixes. Record an environment-dependent test as blocked with its exact prerequisite.

### Test Focus
- Give foundational, high-reuse units such as shared components, custom hooks, and utilities direct tests for their observable contracts. Verify higher-composition surfaces such as organisms and pages through integration or E2E tests when that boundary best exposes the relevant failure.

### Non-functional Requirements
- **Browser Compatibility**: Use the repository's Browserslist/build target or a named product requirement; record the source and test the affected browser-specific behavior
- **Rendering Performance**: Use the browser matrix and performance thresholds defined by project requirements, CI, or performance configuration. When none exists, report measured conditions as diagnostic evidence without inventing a pass threshold
