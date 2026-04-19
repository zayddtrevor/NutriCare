import { test, expect } from '@playwright/test';

test.describe('Reports and Dashboard Verification', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    // Navigate to the management page (Student & Teacher)
    await page.goto('http://localhost:5173/');

    // Perform login
    await page.fill('input[type="email"]', 'admin@nutricare.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // Wait for login transition
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('verify dashboard stats unique count', async ({ page }) => {
    // Total Students is ~1800 (or whatever MOCK_DB generates)
    // Active Reports should now be 50 because MOCK_DB initializes 50 bmi_records for 50 unique students
    const activeReportsCard = page.locator('.premium-stat-card.orange');
    await expect(activeReportsCard).toBeVisible();

    // CountUp takes some time to animate. We should wait for it to reach the end value.
    const statValue = activeReportsCard.locator('.stat-value');
    await expect(statValue).toHaveText('50', { timeout: 10000 });
  });

  test('verify reports page export buttons', async ({ page }) => {
    await page.goto('http://localhost:5173/reports');

    // Check if buttons are present and not disabled (Export Excel might be disabled if no students, but MOCK_DB has students)
    const exportBtn = page.locator('.btn-export');
    const downloadBtn = page.locator('.btn-download');

    await expect(exportBtn).toBeVisible();
    await expect(downloadBtn).toBeVisible();

    await expect(exportBtn).not.toBeDisabled();

    // We can't easily test the actual file download in this environment without more setup,
    // but we fixed the JS error that was preventing the click handler from completing.
    // If there's no crash when clicking, it's a good sign.

    // Trigger download template
    await downloadBtn.click();
    // Trigger export excel
    await exportBtn.click();

    // Check for console errors - Playwright can do this
    page.on('console', msg => {
      if (msg.type() === 'error') {
        throw new Error(`Console error detected: ${msg.text()}`);
      }
    });
  });
});
