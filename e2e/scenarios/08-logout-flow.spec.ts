/**
 * E2E Scenario: Logout / Disconnect Flow
 *
 * Verifies that the wallet disconnect and re-connect works as expected.
 * Since Freighter (browser extension) state persists differently than
 * React in-memory state, we test:
 *  - Page refresh resets in-memory connection state
 *  - User can re-connect after disconnection
 */
import { test, expect } from '../fixtures/e2e-fixtures';

test.describe('Logout / Disconnect Flow', () => {
  test('should show wallet connected state after connecting', async ({ e2ePage: page, connectWallet }) => {
    await page.goto('/farmer');
    await connectWallet();

    // Wallet badge should be visible
    const walletBadge = page.locator('text=/^GBZXM7/');
    await expect(walletBadge).toBeVisible();
  });

  test('should return to disconnected state on page refresh', async ({ e2ePage: page, connectWallet }) => {
    await page.goto('/farmer');
    await connectWallet();

    // Verify connected
    await expect(page.locator('text=/^GBZXM7/')).toBeVisible();

    // Refresh page — in-memory state resets, mock starts disconnected
    await page.reload();

    // The "Connect Freighter" button should be visible again
    const connectBtn = page.locator('#btn-connect-wallet');
    await expect(connectBtn).toBeVisible();
    await expect(connectBtn).toContainText('Connect Freighter');
  });

  test('should allow re-connecting after page refresh', async ({ e2ePage: page, connectWallet }) => {
    await page.goto('/farmer');
    await connectWallet();

    // Verify connected
    await expect(page.locator('text=/^GBZXM7/')).toBeVisible();

    // Refresh
    await page.reload();

    // Re-connect
    await page.locator('#btn-connect-wallet').click();

    // Should be connected again
    await expect(page.locator('text=/^GBZXM7/')).toBeVisible({ timeout: 10_000 });
  });

  test('should show landing page CTA buttons prominently when not connected', async ({ e2ePage: page }) => {
    await page.goto('/');

    // Both CTAs should be visible on landing page
    await expect(page.locator('#cta-farmer')).toBeVisible();
    await expect(page.locator('#cta-investor')).toBeVisible();

    // "Connect Freighter" button should be in the nav
    await expect(page.locator('#btn-connect-wallet')).toBeVisible();
  });
});
