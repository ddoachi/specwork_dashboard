import { test, expect } from '@playwright/test';

test.describe('Specwork Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard page
    await page.goto('http://localhost:3003/dashboard');
  });

  test('should display the dashboard header', async ({ page }) => {
    // Check if the header is visible
    await expect(page.locator('h1')).toContainText('Specwork Dashboard');
    await expect(page.locator('text=Manage specifications and track project progress')).toBeVisible();
  });

  test('should display stats cards', async ({ page }) => {
    // Wait for stats cards to load
    await page.waitForSelector('[data-testid="stats-card"]', { timeout: 10000 });
    
    // Check if all four stats cards are visible
    const statsCards = page.locator('[data-testid="stats-card"]');
    await expect(statsCards).toHaveCount(4);
    
    // Check for specific card titles
    await expect(page.locator('text=Epics')).toBeVisible();
    await expect(page.locator('text=Features')).toBeVisible();
    await expect(page.locator('text=Tasks')).toBeVisible();
    await expect(page.locator('text=Progress')).toBeVisible();
  });

  test('should have refresh and sync buttons', async ({ page }) => {
    // Check for refresh button
    const refreshButton = page.locator('button:has-text("Refresh")');
    await expect(refreshButton).toBeVisible();
    
    // Check for sync specs button
    const syncButton = page.locator('button:has-text("Sync Specs")');
    await expect(syncButton).toBeVisible();
  });

  test('should display epic progress section', async ({ page }) => {
    // Check if epic progress section exists
    await expect(page.locator('text=Epic Progress')).toBeVisible();
  });

  test('should display recent activity section', async ({ page }) => {
    // Check if recent activity section exists
    await expect(page.locator('text=Recent Activity')).toBeVisible();
  });

  test('should display spec tree view', async ({ page }) => {
    // Check if spec tree view section exists
    await expect(page.locator('text=Specification Hierarchy')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls and make them fail
    await page.route('**/api/dashboard/stats', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.reload();
    
    // Check if error message is displayed
    await expect(page.locator('text=Error loading data')).toBeVisible();
    await expect(page.locator('button:has-text("Try again")')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if the dashboard is still functional
    await expect(page.locator('h1')).toContainText('Specwork Dashboard');
    
    // Stats cards should stack on mobile
    const statsCards = page.locator('[data-testid="stats-card"]');
    await expect(statsCards).toHaveCount(4);
  });

  test('sync button should trigger loading state', async ({ page }) => {
    // Click sync button
    const syncButton = page.locator('button:has-text("Sync Specs")');
    
    // Mock the sync API to delay response
    await page.route('**/api/specs/sync', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true })
        });
      }, 1000);
    });
    
    await syncButton.click();
    
    // Check if loading state is shown
    await expect(page.locator('button:has-text("Sync Specs") svg.animate-spin')).toBeVisible();
  });

  test('should expand and collapse tree nodes', async ({ page }) => {
    // Wait for tree view to load
    await page.waitForSelector('[data-testid="tree-node"]', { timeout: 10000 });
    
    // Find an expandable node and click it
    const expandableNode = page.locator('[data-testid="tree-node-toggle"]').first();
    
    if (await expandableNode.isVisible()) {
      await expandableNode.click();
      
      // Check if children are visible
      await expect(page.locator('[data-testid="tree-node-children"]').first()).toBeVisible();
      
      // Click again to collapse
      await expandableNode.click();
      
      // Check if children are hidden
      await expect(page.locator('[data-testid="tree-node-children"]').first()).not.toBeVisible();
    }
  });
});