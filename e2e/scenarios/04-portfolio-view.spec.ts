/**
 * E2E Scenario: Portfolio View (Farmer Kraal)
 *
 * Verifies that a farmer can see their registered livestock portfolio
 * with detailed information for each animal.
 */
import { test, expect } from '../fixtures/e2e-fixtures';

test.describe('Portfolio View', () => {
  test('should display all registered animals in the kraal grid', async ({ e2ePage: page }) => {
    await page.goto('/farmer');

    // Wait for animal cards to render
    const cards = page.locator('article');
    await expect(cards).toHaveCount(4); // 4 mock livestock items
  });

  test('should show animal details: breed, weight, age, value', async ({ e2ePage: page }) => {
    await page.goto('/farmer');

    const firstCard = page.locator('article').first();

    // Breed and animal type
    await expect(firstCard).toContainText('Nguni');
    await expect(firstCard).toContainText('cattle');

    // Weight and age
    await expect(firstCard).toContainText('450 kg');
    await expect(firstCard).toContainText('36 months');

    // Appraised value
    await expect(firstCard).toContainText('$150.00');
    await expect(firstCard).toContainText('USDC');
  });

  test('should show correct verification status badges', async ({ e2ePage: page }) => {
    await page.goto('/farmer');

    const cards = page.locator('article');

    // First card: VERIFIED status (cattle/Nguni)
    await expect(cards.nth(0)).toContainText('VERIFIED');

    // Third card: PENDING status (cattle/Hereford)
    await expect(cards.nth(2)).toContainText('PENDING');

    // Fourth card: LOCKED status (sheep/Dorper)
    await expect(cards.nth(3)).toContainText('LOCKED');
  });

  test('should show TX hash for animals with on-chain records', async ({ e2ePage: page }) => {
    await page.goto('/farmer');

    const firstCard = page.locator('article').first();
    await expect(firstCard).toContainText('TX:');
  });

  test('should display proper emoji for each animal type', async ({ e2ePage: page }) => {
    await page.goto('/farmer');

    const cards = page.locator('article');

    // Cattle → 🐄
    await expect(cards.nth(0)).toContainText('🐄');
    // Goat → 🐐
    await expect(cards.nth(1)).toContainText('🐐');
  });
});
