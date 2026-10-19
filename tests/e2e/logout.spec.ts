/**
 * Logout E2E test
 */
import { test, expect } from './_pipeline_guard';
import { BACKEND_URL } from './_test_config';

test.describe('Logout', () => {
  test('should logout and clear session', async ({ page, request }) => {
    // Login first
    const response = await request.post(`${BACKEND_URL}/api/auth/login`, {
      data: { username: 'p.nair' }
    });
    const data = await response.json();
    
    // Set auth before navigating
    await page.addInitScript((token, user) => {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }, data.access_token, data.user);
    
    await page.goto('/intake');
    
    // Should be logged in
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Find and click logout button - assert it exists
    const logoutButton = page.locator('button').filter({ hasText: /logout|sign out/i }).first();
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();
    
    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
  });
});
