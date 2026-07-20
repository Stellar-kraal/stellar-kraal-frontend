import { test as base, type Page } from '@playwright/test';
import { setupWalletOnPage } from './wallet';
import { setupApiMocks, setupErrorApiMocks } from './api-mocks';

/**
 * Extended test fixture providing:
 *  - `e2ePage` – a page with Freighter wallet + backend API mocked
 *  - `connectWallet` – helper to simulate wallet connection via button click
 *  - `mockError` – switch API mocks to error mode for negative tests
 */
export type E2EFixtures = {
  e2ePage: Page;
  connectWallet: () => Promise<void>;
  mockError: (type: 'insufficient-balance' | 'server-error' | 'unauthorized') => Promise<void>;
};

export const test = base.extend<E2EFixtures>({
  e2ePage: async ({ page }, use) => {
    await setupApiMocks(page);
    await setupWalletOnPage(page);
    await use(page);
  },

  connectWallet: async ({ page }, use) => {
    await use(async () => {
      // Click the connect button — the mock Freighter will handle the rest
      const btn = page.locator('#btn-connect-wallet');
      await btn.click();
      // Wait for the wallet UI to appear (truncated public key in green)
      // The wallet badge is a div with font-mono and text-green-400 classes
      await page.waitForSelector('div.font-mono.text-green-400', { timeout: 15_000 });
      // Verify the truncated key text is visible
      const badge = page.locator('div.font-mono.text-green-400');
      await badge.waitFor({ state: 'visible', timeout: 5_000 });
    });
  },

  mockError: async ({ page }, use) => {
    await use(async (type) => {
      await setupErrorApiMocks(page, type);
    });
  },
});

export { expect } from '@playwright/test';
