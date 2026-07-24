# E2E Testing Guide

This guide explains how to run, write, and maintain the Playwright end-to-end test suite for StellarKraal.

## Overview

The E2E suite covers the full user lifecycle through the browser:

- **Wallet Connect** — Connect/disconnect Freighter wallet
- **Marketplace** — Browse livestock-backed loan listings
- **Animal Registration** — Farmer registers livestock as collateral
- **Portfolio View** — Farmer views their kraal with registered animals
- **Loan Funding** — Investor funds an active loan
- **Error States** — Wallet rejection, API errors, empty states
- **Logout / Disconnect** — Wallet disconnect and reconnect flow

All backend APIs are **mocked at the Playwright level** using route interception. No real backend, Soroban sandbox, or Freighter extension is needed. The Freighter browser extension is also mocked via `page.addInitScript()`.

## Prerequisites

- Node.js 20+
- npm
- A running Next.js dev server (or Docker)

## Running Tests Locally

### 1. Quick start (no Docker)

```bash
# Terminal 1: Start the frontend
cd frontend
npm install
npm run dev

# Terminal 2: Run E2E tests
cd frontend
npx playwright test
```

### 2. Run with visible browser

```bash
npx playwright test --headed
```

### 3. Run a specific test file

```bash
npx playwright test e2e/scenarios/01-wallet-connect.spec.ts
```

### 4. Run with UI mode (interactive)

```bash
npx playwright test --ui
```

### 5. Debug mode

```bash
npx playwright test --debug
```

### 6. Run with Docker Compose

```bash
docker compose up --build --abort-on-container-exit --exit-code-from e2e-runner
```

## Test Structure

```
e2e/
├── fixtures/
│   ├── wallet.ts          # Mock Freighter wallet with deterministic keypair
│   ├── test-data.ts       # Mock API response data (livestock, loans)
│   ├── api-mocks.ts       # API route interception handlers
│   └── e2e-fixtures.ts    # Playwright custom fixtures (test, connectWallet, mockError)
├── scenarios/
│   ├── 01-wallet-connect.spec.ts
│   ├── 02-browse-marketplace.spec.ts
│   ├── 03-register-animal.spec.ts
│   ├── 04-portfolio-view.spec.ts
│   ├── 05-fund-loan.spec.ts
│   ├── 06-error-wallet-rejection.spec.ts
│   ├── 07-error-states.spec.ts
│   └── 08-logout-flow.spec.ts
├── snapshots/             # Visual regression baselines (chromium/)
├── global-setup.ts        # Health check + directory prep
└── tsconfig.json          # TypeScript config for tests
```

## Test Fixtures

The extended `test` fixture from `e2e/fixtures/e2e-fixtures.ts` provides:

| Fixture | Description |
|---|---|
| `e2ePage` | A Playwright `Page` with Freighter wallet + backend API already mocked |
| `connectWallet` | Helper that clicks the Connect button and waits for the wallet badge to appear |
| `mockError(type)` | Re-registers API routes to return error responses (useful for negative tests) |

### Example

```typescript
import { test, expect } from '../fixtures/e2e-fixtures';

test('should display loan marketplace', async ({ e2ePage: page }) => {
  await page.goto('/investor');
  await expect(page.locator('h1')).toContainText('Loan Marketplace');
  await expect(page.locator('table')).toBeVisible();
});
```

## Wallet Mock

The Freighter wallet is mocked via `page.addInitScript()` in `e2e/fixtures/wallet.ts`. It provides:

- A fixed public key (`GBZXM7...X7Z5`)
- Mock `isConnected()`, `setAllowed()`, `getAddress()`, `signTransaction()` methods
- Rejection simulation (`rejectConnect`, `rejectSign`)
- Balance simulation for testing insufficient funds

To configure the mock:

```typescript
import { setupWalletOnPage } from '../fixtures/wallet';

// Default: disconnected, will succeed on connect
await setupWalletOnPage(page);

// Pre-connected state
await setupWalletOnPage(page, { preConnected: true });

// Reject connection
await setupWalletOnPage(page, { rejectConnect: true });
```

## API Mocks

All backend API calls are intercepted by `e2e/fixtures/api-mocks.ts`. The mock returns deterministic data from `test-data.ts` including:

- 4 livestock items (cattle, goat, cattle, sheep) with different statuses
- 4 loans (2 ACTIVE, 1 REPAID, 1 LIQUIDATED)
- Auth response with a JWT token

To override a specific route in a test:

```typescript
await page.route('**/api/livestock/my-kraal', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([]), // empty kraal
  });
});
```

## Adding New Scenarios

1. Create a new file in `e2e/scenarios/` following the numbering convention
2. Import the custom fixture:
   ```typescript
   import { test, expect } from '../fixtures/e2e-fixtures';
   ```
3. Use the `e2ePage` fixture which auto-mocks wallet + API:
   ```typescript
   test('my new scenario', async ({ e2ePage: page }) => {
     await page.goto('/my-page');
     // ... assertions
   });
   ```
4. If your scenario needs special mock data, add it to `e2e/fixtures/test-data.ts`
5. If your scenario needs a new API endpoint, add a handler in `e2e/fixtures/api-mocks.ts`
6. Optionally add visual regression snapshots

### Visual Regression Tests

To add a visual regression test:

```typescript
test.describe('visual regression', () => {
  test('my-page-screenshot', async ({ e2ePage: page }) => {
    await page.goto('/my-page');
    await expect(page).toHaveScreenshot('my-page.png');
  });
});
```

To update baseline snapshots:

```bash
npx playwright test --update-snapshots
```

## CI Integration

Tests run against the `docker compose` stack specified in `docker-compose.yml`:

1. **Frontend** — Next.js app served on port 3000
2. **E2E Runner** — Playwright container that runs tests and reports results

The CI workflow (`.github/workflows/e2e.yml`) runs two parallel jobs:

| Job | Description |
|---|---|
| `unit-tests` | Runs Jest + linter |
| `e2e-tests` | Builds the app, starts it, runs Playwright tests |
| `e2e-docker` | Runs full stack via `docker compose` |

## Troubleshooting

| Problem | Solution |
|---|---|
| Tests fail with `net::ERR_CONNECTION_REFUSED` | Ensure the dev server is running on port 3000 |
| Visual regression diffs | Update snapshots with `--update-snapshots` flag |
| Wallet mock not working | Check that `addInitScript` runs before the page loads |
| Empty kraal shown | The default mock returns 4 animals — override the route if you need empty state |
| API mock not matching | Check the route URL path matches exactly what the frontend calls |

## Best Practices

1. **Test user flows, not implementation details** — Focus on what the user sees and does
2. **Use stable selectors** — Prefer `#id` or `data-testid` over CSS class names
3. **Keep tests independent** — Each test should set up its own state
4. **Mock at the network level** — Use `page.route()` for API mocks, not component mocks
5. **Add meaningful assertions** — Check for text content, visibility, and counts
6. **Add visual regression for key pages** — Landing, marketplace, farmer kraal
7. **Use `connectWallet` helper** — Avoid duplicating wallet connect logic
