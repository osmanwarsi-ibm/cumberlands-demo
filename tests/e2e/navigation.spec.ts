/**
 * Navigation E2E tests - visit all routes
 */
import { test, expect } from './_pipeline_guard';
import { BACKEND_URL } from './_test_config';

// Helper to login via API with specific username
async function loginViaApi(page: any, request: any, username: string = 'p.nair') {
  const response = await request.post(`${BACKEND_URL}/api/auth/login`, {
    data: { username }
  });
  const data = await response.json();
  
  // Set localStorage before navigating to avoid navigation destroying context
  await page.addInitScript((token, user) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }, data.access_token, data.user);
}

test.describe('Navigation', () => {
  test('should visit intake page', async ({ page, request }) => {
    await loginViaApi(page, request);
    await page.goto('/intake');
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should visit batch list page', async ({ page, request }) => {
    await loginViaApi(page, request);
    await page.goto('/batches');
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should visit cost queue page', async ({ page, request }) => {
    await loginViaApi(page, request, 'd.whitfield'); // PRICE_BOOK_ANALYST
    await page.goto('/cost-queue');
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should visit quantity queue page', async ({ page, request }) => {
    await loginViaApi(page, request, 'm.ortiz'); // INVENTORY_CONTROL_ANALYST
    await page.goto('/quantity-queue');
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should visit AP queue page', async ({ page, request }) => {
    await loginViaApi(page, request);
    await page.goto('/ap-queue');
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should visit audit trace page', async ({ page, request }) => {
    await loginViaApi(page, request);
    await page.goto('/audit');
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should visit vendor follow-up page', async ({ page, request }) => {
    await loginViaApi(page, request);
    await page.goto('/vendor-follow-up');
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});
