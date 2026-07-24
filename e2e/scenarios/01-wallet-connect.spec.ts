/**
 * E2E Scenario: Wallet Connect
 *
 * Verifies that a user can connect their Freighter wallet from the landing page
 * and see their public key displayed in the navbar.
 */
import { test, expect } from '../fixtures/e2e-fixtures';

test.describe('Wallet Connect Flow', () => {
  test('should show "Connect Freighter" button when wallet is disconnected', async ({ e2ePage: page }) => {
    await page.goto('/');

    // Landing page hero should be visible
    await expect(page.locator('h1')).toContainText('Unlock capital');

    // The wallet button should show "Connect Freighter"
    const connectBtn = page.locator('#btn-connect-wallet');
    await expect(connectBtn).toBeVisible();
    await expect(connectBtn).toContainText('Connect Freighter');
  });

  test('should connect wallet and display truncated public key', async ({ e2ePage: page, connectWallet }) => {
    await page.goto('/');

    // Connect
    await connectWallet();

    // After connection, the button should be replaced by a wallet badge
    // showing the truncated public key (e.g. GBZXM7...X7Z5)
    const walletBadge = page.locator('.text-green-400.animate-pulse');
    await expect(walletBadge).toBeVisible();

    // The parent container should show truncated key
    const walletDisplay = page.locator('.text-green-400.font-mono');
    await expect(walletDisplay).toContainText('GBZXM7');
    await expect(walletDisplay).toContainText('X7Z5');
  });

  test('should persist wallet connection when navigating between pages', async ({ e2ePage: page, connectWallet }) => {
    // Connect on the landing page
    await page.goto('/');
    await connectWallet();

    // Navigate to farmer page
    await page.locator('#cta-farmer').click();
    await page.waitForURL('/farmer');

    // Wallet badge should still be visible
    const walletBadge = page.locator('.text-green-400.animate-pulse');
    await expect(walletBadge).toBeVisible();

    // Navigate to investor page
    await page.goto('/investor');
    await page.waitForURL('/investor');

    // Wallet badge should still be visible
    await expect(walletBadge).toBeVisible();
  });

  test.describe('visual regression', () => {
    test('landing page with wallet connected', async ({ e2ePage: page, connectWallet }) => {
      await page.goto('/');
      await connectWallet();
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot('landing-wallet-connected.png', {
        mask: [page.locator('.animate-pulse')],
      });
    });
  });
});
