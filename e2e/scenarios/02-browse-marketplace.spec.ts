/**
 * E2E Scenario: Browse Loan Marketplace
 *
 * Verifies that an investor can view the loan marketplace with
 * active livestock-backed loans displayed in a table.
 */
import { test, expect } from '../fixtures/e2e-fixtures';

test.describe('Loan Marketplace', () => {
  test('should display the loan marketplace with Active loans', async ({ e2ePage: page }) => {
    await page.goto('/investor');

    // Page title
    await expect(page.locator('h1')).toContainText('Loan Marketplace');

    // Loan table should be visible
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Table headers
    const headers = table.locator('thead th');
    await expect(headers).toContainText(['Animal', 'Breed', 'Appraised Value', 'Loan Amount', 'LTV', 'Status', 'Action']);
  });

  test('should show ACTIVE loans with Fund Loan button', async ({ e2ePage: page }) => {
    await page.goto('/investor');

    // There should be rows in the table
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(4); // 4 mock loans

    // First row: Nguni cattle, active, should have "Fund Loan" button
    const firstRow = rows.nth(0);
    await expect(firstRow).toContainText('Nguni');
    await expect(firstRow).toContainText('cattle');
    await expect(firstRow).toContainText('ACTIVE');

    const fundBtn = firstRow.locator('button');
    await expect(fundBtn).toContainText('Fund Loan');
  });

  test('should show REPAID and LIQUIDATED loans without Fund button', async ({ e2ePage: page }) => {
    await page.goto('/investor');

    const rows = page.locator('tbody tr');

    // REPAID row (index 2)
    const repaidRow = rows.nth(2);
    await expect(repaidRow).toContainText('REPAID');
    await expect(repaidRow.locator('button')).toHaveCount(0);

    // LIQUIDATED row (index 3)
    const liquidatedRow = rows.nth(3);
    await expect(liquidatedRow).toContainText('LIQUIDATED');
    await expect(liquidatedRow.locator('button')).toHaveCount(0);
  });

  test('should display appraised values in USDC format', async ({ e2ePage: page }) => {
    await page.goto('/investor');

    // Check that values are formatted with $ and decimal places
    const valueCells = page.locator('tbody tr td:nth-child(3)');
    await expect(valueCells.nth(0)).toContainText('$150.00');
    await expect(valueCells.nth(1)).toContainText('$50.00');
  });

  test.describe('visual regression', () => {
    test('investor marketplace page', async ({ e2ePage: page }) => {
      await page.goto('/investor');
      await page.waitForSelector('table tbody tr');
      await expect(page).toHaveScreenshot('investor-marketplace.png');
    });
  });
});
