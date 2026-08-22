/**
 * E2E Scenario: Mobile Wallet QR Connect
 *
 * Verifies the "Connect Mobile Wallet" modal (WalletConnect QR + SEP-0007
 * fallback) introduced for mobile wallet support, and checks it against
 * WCAG 2.1 AA via axe-core per the issue's acceptance criteria.
 *
 * Full WalletConnect pairing (scanning with a real wallet) and SEP-0007
 * callback delivery are inherently manual — they require a second device
 * or a live relay — so this suite covers what's automatable: the modal's
 * UI, its graceful fallback when WalletConnect isn't configured, and
 * accessibility.
 */
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../fixtures/e2e-fixtures';

test.describe('Mobile Wallet QR Connect', () => {
  test('opens the modal from the navbar and shows the WalletConnect / SEP-0007 tabs', async ({ e2ePage: page }) => {
    await page.goto('/farmer');

    await page.locator('#btn-connect-mobile-wallet').click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Connect Mobile Wallet');
    await expect(page.locator('#tab-walletconnect')).toBeVisible();
    await expect(page.locator('#tab-sep7')).toBeVisible();
  });

  test('falls back to a clear message on the WalletConnect tab when no project id is configured', async ({ e2ePage: page }) => {
    await page.goto('/farmer');
    await page.locator('#btn-connect-mobile-wallet').click();
    // The modal defaults to the SEP-0007 tab when WalletConnect isn't
    // configured, so switch to it explicitly to see the fallback message.
    await page.locator('#tab-walletconnect').click();

    // No NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is set in the test environment.
    await expect(page.locator('[role="dialog"] [role="alert"]')).toContainText(
      'WalletConnect is not configured',
    );
  });

  test('SEP-0007 tab explains the deep-link flow', async ({ e2ePage: page }) => {
    await page.goto('/farmer');
    await page.locator('#btn-connect-mobile-wallet').click();
    await page.locator('#tab-sep7').click();

    await expect(page.locator('[role="dialog"]')).toContainText('SEP-0007');
    await expect(page.locator('a[href*="sep-0007"]')).toBeVisible();
  });

  test('closes on Escape and via the close button', async ({ e2ePage: page }) => {
    await page.goto('/farmer');

    await page.locator('#btn-connect-mobile-wallet').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);

    await page.locator('#btn-connect-mobile-wallet').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.locator('#btn-close-mobile-wallet-modal').click();
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  });

  test('has no automatically detectable WCAG 2.1 AA violations', async ({ e2ePage: page }) => {
    await page.goto('/farmer');
    await page.locator('#btn-connect-mobile-wallet').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
