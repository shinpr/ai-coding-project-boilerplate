# E2E Test Implementation with Playwright

Inspect the repository's browser-test configuration, scripts, fixtures, neighboring tests, and CI routing. Preserve the existing harness, imports, locator conventions, setup lifecycle, file naming, and test location.

When no browser harness exists, use integration-e2e-testing to determine whether browser-level proof is necessary. If it is, select the lowest-surface sufficient harness from repository and applicable external evidence; if it is not, use the cheaper observable boundary. Report an unavailable execution environment as a proof limitation rather than a user decision.

## Lane Selection

E2E tests in this workflow split into two lanes:

| Lane | Backend setup | Use these patterns |
|------|---------------|-------------------|
| **fixture-e2e** | Mocked via `page.route()` or fixture loaders; no live services | Test Structure Rules, Locator Strategy, What to Assert, the **Fixture-Based Backend** section below |
| **service-integration-e2e** | Live local stack with real services | All sections above PLUS **E2E Environment Prerequisites**, a real auth fixture against the application's login flow, and seeded test data |

The skeleton's `@lane:` annotation declares which lane the test belongs to. Choose implementation patterns to match.

## Test Framework
- **Playwright Test**: `@playwright/test`
- Test imports: `import { test, expect } from '@playwright/test'`

## Test Structure

### Directory Layout and Naming

Everything lives under `tests/e2e/`: test files at its root, page objects in `pages/` (shared across lanes), fixtures in `fixtures/`, and static fixture data for fixture-e2e in `data/`.

- fixture-e2e files: `{FeatureName}.fixture-e2e.test.ts`
- service-integration-e2e files: `{FeatureName}.service-e2e.test.ts`
- Page objects: `{PageName}.page.ts`
- Fixtures: `{Purpose}.fixture.ts`
- Static fixture data: `{scenario}.fixture.json`

## Test Structure Rules

- Extract a page object per the Rule of Three: keep interactions inline on first use, consider extracting on the second, and extract on the third substantially shared interaction. Extract earlier only when the shared interaction is itself complex (multi-step, waits on intermediate state) or when a representative page object for that page already exists — then follow it.
- Put shared setup that every test in a file needs — authentication in particular — in a fixture rather than repeating the steps per test, so a test body contains only the behavior it verifies.

## What to Assert

Assert the state the user can observe after the journey, not the steps taken to get there:

- **Navigation** — the URL or the landmark that identifies the destination, not both as separate proofs of the same transition.
- **Rendered outcome** — the specific content the journey was supposed to produce, identified by role and accessible name. A visibility check on a container proves the container rendered, not that it holds the right thing.
- **Absence** — when the expectation is that something is gone or was never shown, assert absence explicitly rather than asserting that something else is present.
- **Persisted effect** — when a requirement or contract states that the change survives a reload or a fresh navigation, assert it there too, since an in-page update can pass while persistence fails. Transient state with no such contract — filter selections, modal open/close, wizard progress — is asserted in place; adding a reload assertion there would test a guarantee the feature never made.

## Fixture-Based Backend (fixture-e2e)

fixture-e2e tests run a real browser against deterministic fixtures — no live backend, no DB, no external services. Fake the network either by intercepting every backend call the journey makes with `page.route()` and fulfilling it from a committed fixture, or by loading that fixture through a route helper or an app-level test mode. Intercept every call the journey reaches, not only the first — an unintercepted route silently hits the real network and makes the test environment-dependent.

**Principles for fixture-e2e**:
- Backend is faked, not running. No `npm run start:backend` required to execute these tests
- Fixtures are versioned in the repo (`tests/e2e/data/`) so tests are deterministic across machines
- When the journey requires an authenticated state but does not verify real authentication, establish auth with a deterministic test cookie or fixture-mode session
- These tests run in CI without provisioning external infrastructure

## E2E Environment Prerequisites (service-integration-e2e only)

service-integration-e2e tests require a running application with real data state. Unlike fixture-e2e, environment setup is part of test implementation scope.

Before service-integration-e2e tests can pass, verify:
- [ ] Application is running and accessible at `baseURL`
- [ ] Database has required seed data (test users, required records)
- [ ] Authentication flow works with test credentials against the real auth flow
- [ ] Environment variables are set (`E2E_*` prefixed)
- [ ] External services are either available or stubbed

Address a missing prerequisite as part of the test implementation task itself, or move the verification to fixture-e2e when the behavior under test does not require the live environment.

## Locator Strategy

Prefer accessible locators in this order:
1. `page.getByRole()` — targets the accessibility role and user-visible name
2. `page.getByLabel()` — form elements
3. `page.getByText()` — visible text
4. `page.getByTestId()` — last resort; record in the test why no perceivable attribute identifies the element

Selecting by CSS id or class couples the test to markup rather than to what the user perceives; use a locator from the list above instead.

## Viewport Testing

When the UI Spec defines responsive behavior, assert it at each viewport the UI Spec names — both the element that appears and the element that is absent at that size, since a breakpoint bug usually shows as both surfaces rendering at once.

## Test Isolation

- Each test starts from a clean browser context
- No shared state between tests
- Use `beforeEach` for common setup (auth, navigation)
- Prefer `page.goto()` over in-test navigation for setup steps

## Skeleton Comment Format

E2E test skeletons follow the same annotation format as integration tests, with a required `@lane:` annotation declaring the lane (see Lane Selection above):

```typescript
// AC: [Original acceptance criteria text]
// Behavior: [User action] → [System response] → [Observable result]
// @lane: fixture-e2e | service-integration-e2e
// @dependency: full-ui (mocked backend) | full-system
// Proof obligation: [boundary and observable state this test must prove]
test('AC1: [Description]', async ({ page }) => {
  // Arrange: [Setup description]
  // Act: [Action description]
  // Assert: [Verification description]
})
```

**`@dependency` selection by lane**:
- `fixture-e2e` → `@dependency: full-ui (mocked backend)` (no live services; intercept network via `page.route()` or fixture loaders)
- `service-integration-e2e` → `@dependency: full-system` (running local stack required)
