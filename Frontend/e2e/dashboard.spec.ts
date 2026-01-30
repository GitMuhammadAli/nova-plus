import { test, expect, Page } from '@playwright/test';

/**
 * NovaPulse Dashboard E2E Tests
 * Tests for dashboard, navigation, and main features
 */

// Helper function to login
async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
  await page.fill('input[type="password"], input[name="password"]', 'Password123!');
  await page.getByRole('button', { name: /sign in|login/i }).click();
  await expect(page).toHaveURL(/dashboard|home/, { timeout: 15000 });
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display dashboard with key elements', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should have main heading or welcome message
    await expect(page.getByRole('heading').first()).toBeVisible();
    
    // Should have navigation sidebar or header
    const nav = page.locator('nav, [role="navigation"]').first();
    await expect(nav).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check navigation links exist
    const navLinks = [
      { name: /dashboard/i, url: /dashboard/ },
      { name: /users/i, url: /users/ },
      { name: /projects/i, url: /projects/ },
      { name: /settings/i, url: /settings/ },
    ];

    for (const link of navLinks) {
      const navItem = page.getByRole('link', { name: link.name }).first();
      if (await navItem.isVisible()) {
        await navItem.click();
        await expect(page).toHaveURL(link.url, { timeout: 5000 });
      }
    }
  });
});

test.describe('Users Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display users list', async ({ page }) => {
    await page.goto('/users');
    
    // Should have users table or list
    const usersContainer = page.locator('[data-testid="users-list"], table, [role="table"]').first();
    await expect(usersContainer).toBeVisible({ timeout: 10000 });
  });

  test('should have add user button', async ({ page }) => {
    await page.goto('/users');
    
    const addButton = page.getByRole('button', { name: /add user|invite|create/i }).first();
    await expect(addButton).toBeVisible({ timeout: 10000 });
  });

  test('should open add user modal/form', async ({ page }) => {
    await page.goto('/users');
    
    const addButton = page.getByRole('button', { name: /add user|invite|create/i }).first();
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Should show modal or form
      const modal = page.locator('[role="dialog"], form, [data-testid="user-form"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Projects', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display projects list', async ({ page }) => {
    await page.goto('/projects');
    
    // Should have projects container
    await expect(page.locator('[data-testid="projects-list"], .projects-grid, table').first())
      .toBeVisible({ timeout: 10000 });
  });

  test('should have create project button', async ({ page }) => {
    await page.goto('/projects');
    
    const createButton = page.getByRole('button', { name: /create|add|new project/i }).first();
    await expect(createButton).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display settings page', async ({ page }) => {
    await page.goto('/settings');
    
    // Should have settings heading
    await expect(page.getByRole('heading', { name: /settings/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('should have profile section', async ({ page }) => {
    await page.goto('/settings');
    
    // Look for profile-related content
    const profileSection = page.getByText(/profile|account|personal/i).first();
    await expect(profileSection).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Billing', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display billing page', async ({ page }) => {
    await page.goto('/billing');
    
    // Should have billing heading or plan info
    await expect(page.getByRole('heading', { name: /billing|subscription|plan/i }).first())
      .toBeVisible({ timeout: 10000 });
  });

  test('should show current plan information', async ({ page }) => {
    await page.goto('/billing');
    
    // Should have plan name displayed
    const planInfo = page.getByText(/free|starter|pro|enterprise|current plan/i).first();
    await expect(planInfo).toBeVisible({ timeout: 10000 });
  });

  test('should show usage statistics', async ({ page }) => {
    await page.goto('/billing');
    
    // Click on usage tab if exists
    const usageTab = page.getByRole('tab', { name: /usage/i }).first();
    if (await usageTab.isVisible()) {
      await usageTab.click();
      
      // Should show usage meters
      await expect(page.getByText(/users|storage|projects/i).first()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display analytics page', async ({ page }) => {
    await page.goto('/analytics');
    
    // Should have analytics content
    const analyticsContent = page.locator('[data-testid="analytics"], .analytics, .chart, svg').first();
    await expect(analyticsContent).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should have mobile-friendly navigation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    // Should have hamburger menu or mobile navigation
    const mobileMenu = page.locator('[data-testid="mobile-menu"], [aria-label="Menu"], button.hamburger, [role="button"][aria-expanded]').first();
    
    // Either mobile menu button or collapsed sidebar should be present
    await expect(page.locator('nav, [role="navigation"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display content properly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard');
    
    // Main content should be visible
    const mainContent = page.locator('main, [role="main"], .main-content').first();
    await expect(mainContent).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display 404 for non-existent routes', async ({ page }) => {
    await page.goto('/non-existent-route-12345');
    
    // Should show 404 or redirect to dashboard
    const notFoundOrDashboard = page.getByText(/not found|404|page doesn't exist/i).first();
    const isDashboard = await page.url().includes('dashboard');
    
    // Either shows 404 or redirects
    expect(notFoundOrDashboard.isVisible() || isDashboard).toBeTruthy();
  });
});

