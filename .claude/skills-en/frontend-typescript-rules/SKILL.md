---
name: frontend-typescript-rules
description: Applies React/TypeScript type safety, component design, and state management rules. Use when implementing React components.
---

# TypeScript Development Rules (Frontend)

Frontend-specific React/TypeScript rules for implementation: thresholds, boundary type safety, component/state design, error handling, and project conventions.

## Prerequisite Detection

Inspect TypeScript, bundler/framework, lint/format, path-alias, React compiler, and representative component configuration before applying a project convention. Treat a convention as observed when configuration or an established repository pattern supports it; label a conclusion from limited examples as inferred. When conflicting patterns affect public behavior, compatibility, or component boundaries, stop and name the required source or decision.

## Anti-patterns and Thresholds
Signals that trigger a design change:
- Prop drilling through 3+ levels → lift to Context or state management
- Component over 300 lines → split
- Props count over 10 → split the component (3-7 is the working range)
- Optional props over 50% → introduce defaults or Context
- Props nesting deeper than 2 levels → flatten
- The same `as` assertion appearing 3+ times → revisit the type design

## Type Safety at Boundaries
Receive untrusted or unavailable types as `unknown` and narrow them with a type guard. Use `as` only when a runtime/framework invariant proves the asserted type and record that invariant in a nearby comment. Existing generated or third-party declarations that contain `any` are boundary inputs to wrap, not justification for spreading `any` into application contracts.

Inside the app, React Props/State are type-guaranteed — no `unknown` needed. At every external boundary, receive as `unknown` and narrow with a type guard before use: API responses, `localStorage`/`sessionStorage`, URL parameters, parsed JSON. Controlled-component form input stays type-safe through React synthetic events.

```typescript
const raw: unknown = await (await fetch(url)).json()
if (!isUser(raw)) throw new ValidationError('invalid user')
const user = raw // narrowed to User
```

## Component and State Design
- **Function components only.** Class components are allowed solely for Error Boundaries (no hook equivalent exists)
- **Type Props explicitly** with a named type and destructure: `function UserCard({ user, onSelect }: UserCardProps)`. Type props directly on the function so the props contract stays explicit
- **Props-driven:** pass dependencies as props when one explicit parent owns them. Use Context or established global state when multiple non-adjacent descendants share the value and prop forwarding would add intermediate components with no ownership role
- **Custom hooks** are the unit of logic reuse and dependency injection (inject collaborators through the hook for testability)
- **Function parameters:** 0-2 positional; for 3+ take a single options object
- **State shape:** type state explicitly; for multi-field state with discrete transitions, use `useReducer` with a discriminated-union action type rather than many `useState` calls
- **Server/Client boundary** (RSC frameworks only — e.g. Next.js App Router): default to server components for data fetching/rendering and isolate interactivity behind a `"use client"` boundary at the smallest scope that needs it; keep browser-only APIs (`window`, `localStorage`, event handlers) inside client components, since calling them in a server component breaks the render. N/A for client-only SPAs (e.g. Vite) — skip when the project has no server-component runtime

## Error Handling
- Give every error one explicit outcome: convert it to a typed expected failure, handle it at the owning UI boundary, or propagate it with its diagnostic context. Log at the layer that owns observability so the same failure is not logged repeatedly
- **Fail fast:** on an invalid state, throw rather than returning a silent fallback
- Represent expected failures as values with a `Result` type; reserve `throw` for unexpected/unrecoverable cases
- Use purpose-specific error classes extending a base `AppError` carrying a `code` (e.g. ValidationError, ApiError, NotFoundError)
- **Layer responsibilities:** the API layer converts transport errors into domain errors; hooks propagate `AppError` upward; an Error Boundary catches render-time errors and shows fallback UI
- **Effect race/cleanup:** guard `useEffect` data fetches against out-of-order responses and post-unmount state updates — abort or ignore stale results (`AbortController` or a mounted flag), or use a server-state library (React Query/SWR) that cancels and dedupes. `try-catch` alone does not cover this
- Log only diagnostic fields approved for the current trust boundary; redact credentials, tokens, payment data, and other sensitive values before logging

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

class AppError extends Error {
  constructor(message: string, readonly code: string, readonly statusCode = 500) {
    super(message); this.name = this.constructor.name
  }
}
```

Error Boundary — the one place a class component is required:
```typescript
class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() { return this.state.hasError ? this.props.fallback : this.props.children }
}
```

## Project Conventions
- **Environment variables:** read client-side env through the configured bundler's exposed accessor. Match the observed bundler: Vite `import.meta.env.VITE_*`, Next.js public `process.env.NEXT_PUBLIC_*`, CRA `process.env.REACT_APP_*`. Frontend bundles contain public configuration; secret values remain behind a server-side boundary
- **Bundle & performance:** monitor bundle size with the `build` script against the project's budget; code-split with `React.lazy` + `Suspense`; structure state to minimize re-renders. Memoization: when React Compiler is enabled, rely on it; reach for manual `React.memo`/`useMemo`/`useCallback` only as a profiler- or identity-justified escape hatch (a measured bottleneck, or stable reference identity for third-party APIs / effect dependencies)
- **Naming:** components/types `PascalCase`; variables/functions `camelCase`; hooks `use`-prefixed; constants `SCREAMING_SNAKE_CASE`
- **Imports:** follow the alias and import-order rules observed in `tsconfig`, lint configuration, and representative files. Use `src/` absolute paths only when the configured alias supports them
- **Formatting:** follow the repository's configured formatter; when Biome is present, semicolons and style come from its project configuration
