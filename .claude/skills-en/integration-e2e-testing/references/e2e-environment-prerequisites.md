# Service-Integration E2E Environment Prerequisites

These prerequisites apply only to the `service-integration-e2e` lane. That lane requires a running local application stack and real or service-level stubbed data state. The `fixture-e2e` lane uses a real browser with a mocked backend or deterministic fixture loader and does not require a live service or real database.

## Seed Data Strategy

Prepare test data through an API fixture or database seeding so the test journey begins at the behavior under verification:

```typescript
// fixtures/seed.fixture.ts
import { test as base } from '@playwright/test'

export const test = base.extend<{ seededData: SeedResult }>({
  seededData: async ({ request }, use) => {
    // Arrange: Create test data via API before test
    // Example: adjust to the project's actual seeding mechanism
    const result = await request.post('/api/test/seed', {
      data: { scenario: 'e2e-user-with-subscription' }
    })
    const seedData = await result.json()

    await use(seedData)

    // Cleanup: Remove test data after test
    await request.delete(`/api/test/seed/${seedData.id}`)
  },
})
```

**Principles**:
- Use the application's existing seeding mechanism if present; create new seed endpoints only when no alternative exists
- Seed data setup belongs to test fixtures, not to a separate manual step
- Each test must be self-contained: create its own data, clean up after
- Use API endpoints or direct DB access for seeding — not UI flows

## Authentication Fixture

Implement auth fixtures that match the application's actual login flow:

```typescript
// fixtures/auth.fixture.ts
export const test = base.extend<{ playerPage: Page }>({
  playerPage: async ({ page, request }, use) => {
    // Use the application's existing auth endpoint — not admin backdoors
    // Example: adjust the URL and payload to match the project's actual login flow
    await request.post('/api/login', {
      data: { loginId: E2E_LOGIN_ID, password: E2E_PASSWORD }
    })
    // Transfer session to browser context
    await page.goto('/')
    await use(page)
  },
})
```

**Principles**:
- Use the application's existing authentication flow; auth fixtures must follow the same path that real users use
- Load test credentials from the configured test environment or secret fixture
- If the auth flow requires specific user records, seed them in the fixture

## Environment Checklist

Before service-integration-e2e tests can pass, verify:
- [ ] Application is running and accessible at `baseURL`
- [ ] Database has required seed data (test users, subscriptions, content)
- [ ] Authentication flow works with test credentials
- [ ] Environment variables are set (`E2E_*` prefixed)
- [ ] External services are either available or mocked via `page.route()`

When the work plan includes dedicated environment setup tasks (Phase 0), follow those tasks. When no setup tasks exist in the plan, address missing prerequisites as part of the E2E test implementation task itself.
