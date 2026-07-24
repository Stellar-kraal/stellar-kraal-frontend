/**
 * E2E Scenario: Fund Loan (Investor Flow)
 *
 * Verifies that an investor can fund an active livestock-backed loan
 * and see a confirmation toast.
 */
import { test, expect } from '../fixtures/e2e-fixtures';

test.describe('Fund Loan (Investor Flow)', () => {
  test('should show fund loan button for ACTIVE loans', async ({ e2ePage: page }) => {
    await page.goto('/investor');

    // First ACTIVE loan should have a fund button (id: btn-fund-LOAN-001)
    const fundBtn = page.locator('#btn-fund-LOAN-001');
    await expect(fundBtn).toBeVisible();
    await expect(fundBtn).toContainText('Fund Loan');
  });

  test('should show toast when fund loan is clicked', async ({ e2ePage: page }) => {
    await page.goto('/investor');

    // Click fund on the first active loan
    await page.locator('#btn-fund-LOAN-001').click();

    // Toast appears with the fund flow message
    const toast = page.locator('text=Fund flow');
    await expect(toast).toBeVisible({ timeout: 5_000 });
  });
});
