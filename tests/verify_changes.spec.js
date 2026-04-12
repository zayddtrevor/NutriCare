import { test, expect } from '@playwright/test';

test.describe('Teacher Management and Nutrition Banner', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    // Navigate to the management page (Student & Teacher)
    await page.goto('http://localhost:5173/');

    // Perform login
    await page.fill('input[type="email"]', 'admin@nutricare.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // Wait for login transition (it has a 2s + 0.9s delay)
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('blocking deletion of active teacher', async ({ page }) => {
    await page.goto('http://localhost:5173/management?tab=teachers');
    // Find an active teacher row. In mock data, "Juan Dela Cruz" is active.
    const activeTeacherRow = page.locator('tr').filter({ hasText: 'Juan Dela Cruz' });
    await expect(activeTeacherRow).toBeVisible({ timeout: 10000 });
    await expect(activeTeacherRow.locator('.status-badge')).toHaveText('Active');

    // Click the delete button for this teacher
    await activeTeacherRow.locator('button.delete').click();

    // Verify AlertModal appears with the correct message
    const alertModal = page.locator('.modal-root');
    await expect(alertModal).toBeVisible();
    await expect(alertModal.locator('.alert-modal-title')).toHaveText('Action Blocked');
    await expect(alertModal.locator('.alert-modal-message')).toContainText('The account you selected is still active. Please deactivate the account first and wait 30 days before proceeding with deletion.');

    // Close the modal (OK button)
    await alertModal.locator('button').filter({ hasText: 'OK' }).click();
    await expect(alertModal).not.toBeVisible();
  });

  test('deactivating and then deleting a teacher', async ({ page }) => {
    await page.goto('http://localhost:5173/management?tab=teachers');
    // Find an active teacher row "Maria Santos"
    const teacherRow = page.locator('tr').filter({ hasText: 'Maria Santos' });
    await expect(teacherRow).toBeVisible({ timeout: 10000 });
    await expect(teacherRow.locator('.status-badge')).toHaveText('Active');

    // Click deactivate button
    await teacherRow.locator('button.toggle.deactivate').click();

    // Verify status changes to Inactive
    await expect(teacherRow.locator('.status-badge')).toHaveText('Inactive');

    // Now try to delete
    await teacherRow.locator('button.delete').click();

    // Verify confirmation modal appears
    const confirmModal = page.locator('.modal-root');
    await expect(confirmModal).toBeVisible();
    await expect(confirmModal.locator('.alert-modal-title')).toHaveText('Confirm Deletion');

    // Confirm deletion
    await confirmModal.locator('button').filter({ hasText: 'Confirm' }).click();

    // Verify the teacher row is gone
    await expect(teacherRow).not.toBeVisible();
  });

  test('verify feeding nutrition banner resizing', async ({ page }) => {
    await page.goto('http://localhost:5173/feeding');
    await page.waitForSelector('.meal-banner.card-fullwidth', { timeout: 10000 });

    // Take screenshot for visual verification
    await page.screenshot({ path: 'tests/screenshots/feeding_nutrition_banner.png' });

    const banner = page.locator('.meal-banner.card-fullwidth');
    const padding = await banner.evaluate(el => window.getComputedStyle(el).padding);
    expect(padding).toBe('24px'); // 1.5rem = 24px

    const mealName = page.locator('.meal-name');
    const fontSize = await mealName.evaluate(el => window.getComputedStyle(el).fontSize);
    expect(fontSize).toBe('24px'); // 1.5rem = 24px
  });
});
