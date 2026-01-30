import { test, expect, Page } from '@playwright/test';

/**
 * NovaPulse Authentication E2E Tests
 * Tests for login, register, logout, and protected routes
 */

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
  });

  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login');
      
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
    });

    test('should show validation errors for empty form submission', async ({ page }) => {
      await page.goto('/login');
      
      await page.getByRole('button', { name: /sign in|login/i }).click();
      
      // Should show validation error
      await expect(page.getByText(/email|required/i)).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      
      await page.fill('input[type="email"], input[name="email"]', 'wrong@example.com');
      await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
      await page.getByRole('button', { name: /sign in|login/i }).click();
      
      // Should show error message
      await expect(page.getByText(/invalid|unauthorized|incorrect/i)).toBeVisible({ timeout: 10000 });
    });

    test('should redirect to dashboard on successful login', async ({ page }) => {
      await page.goto('/login');
      
      // Use test credentials (adjust as needed for your test environment)
      await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
      await page.fill('input[type="password"], input[name="password"]', 'Password123!');
      await page.getByRole('button', { name: /sign in|login/i }).click();
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/dashboard|home/, { timeout: 10000 });
    });

    test('should have link to registration page', async ({ page }) => {
      await page.goto('/login');
      
      const registerLink = page.getByRole('link', { name: /sign up|register|create account/i });
      await expect(registerLink).toBeVisible();
      await registerLink.click();
      
      await expect(page).toHaveURL(/register|signup/);
    });
  });

  test.describe('Registration Page', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto('/register');
      
      await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"], input[type="password"]')).toBeVisible();
      await expect(page.getByRole('button', { name: /sign up|register|create/i })).toBeVisible();
    });

    test('should show validation errors for invalid email', async ({ page }) => {
      await page.goto('/register');
      
      await page.fill('input[name="email"], input[type="email"]', 'invalidemail');
      await page.fill('input[name="password"], input[type="password"]', 'Password123!');
      await page.getByRole('button', { name: /sign up|register|create/i }).click();
      
      await expect(page.getByText(/valid email|invalid email/i)).toBeVisible();
    });

    test('should show validation errors for weak password', async ({ page }) => {
      await page.goto('/register');
      
      await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
      await page.fill('input[name="password"], input[type="password"]', '123');
      await page.getByRole('button', { name: /sign up|register|create/i }).click();
      
      await expect(page.getByText(/password|characters|weak/i)).toBeVisible();
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL(/login/, { timeout: 10000 });
    });

    test('should redirect to login when accessing protected pages', async ({ page }) => {
      const protectedRoutes = ['/dashboard', '/users', '/projects', '/settings'];
      
      for (const route of protectedRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL(/login/, { timeout: 5000 });
      }
    });
  });

  test.describe('Logout', () => {
    test('should logout user and redirect to login', async ({ page }) => {
      // First, login
      await page.goto('/login');
      await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
      await page.fill('input[type="password"], input[name="password"]', 'Password123!');
      await page.getByRole('button', { name: /sign in|login/i }).click();
      
      // Wait for dashboard
      await expect(page).toHaveURL(/dashboard|home/, { timeout: 10000 });
      
      // Find and click logout
      const userMenu = page.locator('[data-testid="user-menu"], [aria-label="User menu"]').first();
      if (await userMenu.isVisible()) {
        await userMenu.click();
      }
      
      const logoutButton = page.getByRole('button', { name: /logout|sign out/i }).first();
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
      }
      
      // Should redirect to login
      await expect(page).toHaveURL(/login/, { timeout: 10000 });
    });
  });
});

test.describe('Accessibility', () => {
  test('login page should have proper labels', async ({ page }) => {
    await page.goto('/login');
    
    // Check for proper form labels
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    
    // Check that inputs have associated labels or aria-labels
    const emailHasLabel = await emailInput.evaluate((el) => {
      const id = el.id;
      const ariaLabel = el.getAttribute('aria-label');
      const hasLabel = id ? document.querySelector(`label[for="${id}"]`) !== null : false;
      return hasLabel || !!ariaLabel;
    });
    
    expect(emailHasLabel).toBe(true);
  });

  test('form should be keyboard navigable', async ({ page }) => {
    await page.goto('/login');
    
    // Tab through form elements
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'A']).toContain(firstFocused);
    
    await page.keyboard.press('Tab');
    const secondFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'A']).toContain(secondFocused);
  });
});

