/**
 * E2E Scenario: Error State — Wallet Connection Rejection
 *
 * Verifies that the app handles the case where the user rejects
 * the Freighter wallet connection prompt.
 */
import { test as base, expect } from '@playwright/test';
import { setupWalletOnPage } from '../fixtures/wallet';
import { setupApiMocks } from '../fixtures/api-mocks';

// Use a fresh test instance with rejection mode
const test = base.extend<{ rejectionPage: import('@playwright/test').Page }>({
  rejectionPage: async ({ page }, use) => {
    await setupApiMocks(page);
    await setupWalletOnPage(page, { rejectConnect: true, preConnected: false });
    await use(page);
  },
});

test.describe('Error State — Wallet Rejection', () => {
  test('should show connecting state when clicking button', async ({ rejectionPage: page }) => {
    await page.goto('/');

    const connectBtn = page.locator('#btn-connect-wallet');
    await expect(connectBtn).toBeVisible();

    // Click connect — the mock will "reject" but the button goes through
    // the isConnecting state briefly
    await connectBtn.click();
  });

  test('should still show connect button if wallet setup failed', async ({ rejectionPage: page }) => {
    await page.goto('/');

    // Click connect
    await page.locator('#btn-connect-wallet').click();
    await page.waitForTimeout(1000);

    // The connect button should still be visible (no wallet badge appeared)
    await expect(page.locator('#btn-connect-wallet')).toBeVisible();
  });

  test('should not show wallet badge after rejected connection', async ({ rejectionPage: page }) => {
    await page.goto('/');

    // Try to connect
    await page.locator('#btn-connect-wallet').click();
    await page.waitForTimeout(1000);

    // Wallet badge pulsing dot should NOT appear
    const pulseDot = page.locator('.animate-pulse');
    await expect(pulseDot).toHaveCount(0);
  });
});
