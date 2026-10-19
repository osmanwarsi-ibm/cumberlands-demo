/**
 * Authentication E2E tests - login through the form
 */
import { test, expect } from './_pipeline_guard';
import { BACKEND_URL } from './_test_config';

test.describe('Authentication', () => {
  test('should login through form with valid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Wait for the login form to load
    await expect(page.locator('h1').filter({ hasText: /sign in/i })).toBeVisible();
    
    // Select a user (p.nair should be selected by default, but we'll select explicitly)
    const userRadio = page.locator('input[type="radio"][value="p.nair"]');
    await userRadio.check();
    
    // Click the sign in button
    await page.click('button[type="submit"]');
    
    // Should redirect away from login
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });
    
    // Should see intake page content
    await expect(page).toHaveURL(/\/intake/);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should reject login with invalid username', async ({ page, apiGuard }) => {
    // Allow 401 for this test
    apiGuard.allow(401, '/auth/login');
    
    // This test doesn't apply since the UI only allows selecting valid pilot users
    // The API itself will reject invalid users, which we test via API
    const response = await page.request.post(`${BACKEND_URL}/api/auth/login`, {
      data: { username: 'invalid.user' }
    });
    
    expect(response.status()).toBe(401);
  });
});
