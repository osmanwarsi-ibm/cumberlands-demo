/**
 * Queue pages E2E tests
 */
import { test, expect } from './_pipeline_guard';
import { BACKEND_URL } from './_test_config';

// Helper to login via API and set token with specific username
async function loginAndSetToken(page: any, request: any, username: string = 'p.nair') {
  const response = await request.post(`${BACKEND_URL}/api/auth/login`, {
    data: { username }
  });
  const data = await response.json();
  
  // Navigate to a page first if not already there
  if (page.url() === 'about:blank') {
    await page.goto('/login');
  }
  
  // Set localStorage using evaluate
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }, { token: data.access_token, user: data.user });
  
  return data.access_token;
}

test.describe('Queue Pages', () => {
  test('should view cost queue and open a case', async ({ page, request }) => {
    await loginAndSetToken(page, request, 'd.whitfield'); // PRICE_BOOK_ANALYST
    await page.goto('/cost-queue');
    
    // Should see cost queue page
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Wait for queue items to load and find the first Review button
    const reviewButton = page.locator('button').filter({ hasText: /review/i }).first();
    await expect(reviewButton).toBeVisible({ timeout: 15000 });
    await reviewButton.click();
    
    // Should navigate to case detail page
    await expect(page).toHaveURL(/\/cost-case\//);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should view quantity queue and open a case', async ({ page, request }) => {
    await loginAndSetToken(page, request, 'm.ortiz'); // INVENTORY_CONTROL_ANALYST
    await page.goto('/quantity-queue');
    
    // Should see quantity queue page
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Wait for queue items to load and find the first Review button
    const reviewButton = page.locator('button').filter({ hasText: /review/i }).first();
    await expect(reviewButton).toBeVisible({ timeout: 15000 });
    await reviewButton.click();
    
    // Should navigate to case detail page
    await expect(page).toHaveURL(/\/quantity-case\//);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should view AP queue', async ({ page, request }) => {
    await loginAndSetToken(page, request);
    await page.goto('/ap-queue');
    
    // Should see AP queue page
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should navigate to cost case detail via API', async ({ page, request }) => {
    const loginResponse = await request.post(`${BACKEND_URL}/api/auth/login`, {
      data: { username: 'd.whitfield' }
    });
    const loginData = await loginResponse.json();
    
    // Fetch cost queue items from API
    const queueResponse = await request.get(`${BACKEND_URL}/api/queues/cost_review`, {
      headers: {
        'Authorization': `Bearer ${loginData.access_token}`
      }
    });
    
    const queueData = await queueResponse.json();
    
    if (queueData.items && queueData.items.length > 0) {
      const caseId = queueData.items[0].case_id;
      
      // Set auth and navigate
      await loginAndSetToken(page, request, 'd.whitfield');
      await page.goto(`/cost-case/${caseId}`);
      
      // Should see case detail content
      await expect(page.locator('h1, h2').first()).toBeVisible();
    }
  });

  test('should navigate to quantity case detail via API', async ({ page, request }) => {
    const loginResponse = await request.post(`${BACKEND_URL}/api/auth/login`, {
      data: { username: 'm.ortiz' }
    });
    const loginData = await loginResponse.json();
    
    // Fetch quantity queue items from API
    const queueResponse = await request.get(`${BACKEND_URL}/api/queues/quantity_review`, {
      headers: {
        'Authorization': `Bearer ${loginData.access_token}`
      }
    });
    
    const queueData = await queueResponse.json();
    
    if (queueData.items && queueData.items.length > 0) {
      const caseId = queueData.items[0].case_id;
      
      // Set auth and navigate
      await loginAndSetToken(page, request, 'm.ortiz');
      await page.goto(`/quantity-case/${caseId}`);
      
      // Should see case detail content
      await expect(page.locator('h1, h2').first()).toBeVisible();
    }
  });
});
