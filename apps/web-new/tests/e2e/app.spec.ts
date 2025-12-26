import { test, expect } from '@playwright/test';

test('homepage loads successfully', async ({ page }) => {
  await page.goto('/');

  // Basic smoke test - just verify the page loads
  await expect(page).toHaveTitle(/Vite/);
});
