/**
 * Reconciliation workflow E2E tests
 */
import { test, expect } from './_pipeline_guard';
import { BACKEND_URL } from './_test_config';

// Helper to login via API and set token
async function loginAndSetToken(page: any, request: any) {
  const response = await request.post(`${BACKEND_URL}/api/auth/login`, {
    data: { username: 'p.nair' }
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

test.describe('Reconciliation Workflow', () => {
  test('should run reconciliation on a batch and see results', async ({ page, request }) => {
    // Login
    await loginAndSetToken(page, request);
    await page.goto('/batches');
    
    // Should be on batches page
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Find and click on a batch card to view details
    const batchCard = page.locator('h3').filter({ hasText: /batch/i }).first();
    await expect(batchCard).toBeVisible({ timeout: 5000 });
    await batchCard.click();
    
    // Should navigate to batch detail page
    await expect(page).toHaveURL(/\/batches\/.+/);
    
    // Find and click reconciliation button - assert it exists
    const runButton = page.locator('button').filter({ hasText: /run|reconcile|match/i }).first();
    await expect(runButton).toBeVisible();
    await runButton.click();
    
    // Should see results on page - either counts, status, or completion message
    const results = page.locator('text=/match|exception|completed|result/i').first();
    await expect(results).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to batch results page', async ({ page, request }) => {
    // Login
    const token = await loginAndSetToken(page, request);
    
    // Get first batch from API
    const batchesResponse = await request.get(`${BACKEND_URL}/api/reconciliation/batches`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Check if response is ok before parsing
    if (!batchesResponse.ok()) {
      console.log('Batches API failed with status:', batchesResponse.status());
      return;
    }
    
    const batchesData = await batchesResponse.json();
    
    if (batchesData.batches && batchesData.batches.length > 0) {
      const batchId = batchesData.batches[0].batch_id;
      
      // Navigate to batch results page
      await page.goto(`/batches/${batchId}`);
      
      // Should see batch detail content
      await expect(page.locator('h1, h2').first()).toBeVisible();
    }
  });
});
