/**
 * E2E Scenario: Register Animal (Farmer Flow)
 *
 * Verifies that a farmer can register a new animal through the modal form
 * and see it appear in their kraal.
 */
import { test, expect } from '../fixtures/e2e-fixtures';

test.describe('Animal Registration (Farmer Flow)', () => {
  test('should show empty kraal state when no animals exist', async ({ e2ePage: page }) => {
    // Override the API mock to return empty array for this test
    await page.route('**/api/livestock/my-kraal', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/farmer');

    // Should show the empty state
    await expect(page.locator('h1')).toContainText('My Kraal');
    await expect(page.locator('text=No animals registered yet')).toBeVisible();
  });

  test('should open registration modal and display form fields', async ({ e2ePage: page }) => {
    await page.goto('/farmer');

    // Click "Register Animal" button
    await page.locator('#btn-register-animal').click();

    // Modal should appear
    const modal = page.locator('.fixed.inset-0');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h2')).toContainText('Register Animal');

    // Form fields should be present
    await expect(page.locator('#select-species')).toBeVisible();
    await expect(page.locator('#input-breed')).toBeVisible();
    await expect(page.locator('#input-weight')).toBeVisible();
    await expect(page.locator('#input-age')).toBeVisible();
    await expect(page.locator('#select-health')).toBeVisible();
    await expect(page.locator('#input-rfid')).toBeVisible();

    // Submit and cancel buttons
    await expect(page.locator('#btn-submit-register')).toBeVisible();
    await expect(page.locator('#btn-cancel-register')).toBeVisible();
  });

  test('should register an animal and show success toast', async ({ e2ePage: page }) => {
    await page.goto('/farmer');

    // Open modal
    await page.locator('#btn-register-animal').click();
    await page.waitForSelector('#input-breed');

    // Fill form
    await page.locator('#select-species').selectOption('cattle');
    await page.locator('#input-breed').fill('Nguni');
    await page.locator('#input-weight').fill('450');
    await page.locator('#input-age').fill('36');
    await page.locator('#select-health').selectOption('HEALTHY');
    await page.locator('#input-rfid').fill('ZA-E2E-2026');

    // Submit
    await page.locator('#btn-submit-register').click();

    // Should see success toast
    await expect(page.locator('text=Animal registered')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=Appraised at')).toBeVisible();
  });

  test('should cancel registration modal without submitting', async ({ e2ePage: page }) => {
    await page.goto('/farmer');

    // Open modal
    await page.locator('#btn-register-animal').click();
    await page.waitForSelector('#btn-cancel-register');

    // Click cancel
    await page.locator('#btn-cancel-register').click();

    // Modal should close
    await expect(page.locator('.fixed.inset-0')).not.toBeVisible();
  });

  test.describe('visual regression', () => {
    test('farmer dashboard with animals', async ({ e2ePage: page }) => {
      await page.goto('/farmer');
      await page.waitForSelector('article'); // AnimalCard
      await expect(page).toHaveScreenshot('farmer-kraal.png');
    });

    test('registration modal', async ({ e2ePage: page }) => {
      await page.goto('/farmer');
      await page.locator('#btn-register-animal').click();
      await page.waitForSelector('#input-breed');
      await expect(page).toHaveScreenshot('register-animal-modal.png');
    });
  });
});
