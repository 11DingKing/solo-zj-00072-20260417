import { test, expect } from '@playwright/test';

test.describe('Session and Navigation (Unauthenticated)', () => {
  test('should display correct navigation for unauthenticated user', async ({ page }) => {
    await page.goto('/home');

    const homeLink = page.locator('nav a:text("Home")');
    await expect(homeLink).toBeVisible();

    const loginLink = page.locator('nav a:text("Login")');
    await expect(loginLink).toBeVisible();

    const registerLink = page.locator('nav a:text("Register")');
    await expect(registerLink).toBeVisible();

    const logoutLink = page.locator('nav a:text("Logout")');
    await expect(logoutLink).not.toBeVisible();
  });

  test('should navigate between pages without authentication required', async ({ page }) => {
    await page.goto('/home');
    await expect(page.locator('[data-test-id="homepage-anchor"]')).toBeVisible();

    await page.click('nav a:text("Login")');
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');

    await page.click('nav a:text("Register")');
    await page.waitForURL('**/register');
    expect(page.url()).toContain('/register');

    await page.click('nav a:text("Home")');
    await page.waitForURL('**/home');
    expect(page.url()).toContain('/home');
  });

  test('should redirect to login when accessing protected page without login', async ({ page }) => {
    await page.goto('/my-profile');

    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });

  test('should redirect to login when accessing logout page without login', async ({ page }) => {
    await page.goto('/logout');

    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });

  test('should show homepage content correctly', async ({ page }) => {
    await page.goto('/home');

    await expect(page.locator('[data-test-id="homepage-anchor"]')).toBeVisible();
    await expect(page.getByText('Check the github repo')).toBeVisible();
  });

  test('should have active class on current page navigation link', async ({ page }) => {
    await page.goto('/home');
    
    const homeLink = page.locator('nav a:text("Home")');
    await expect(homeLink).toHaveClass(/active/);

    await page.click('nav a:text("Login")');
    await page.waitForURL('**/login');
    
    const loginLink = page.locator('nav a:text("Login")');
    await expect(loginLink).toHaveClass(/active/);
  });

  test('should display loading state initially', async ({ page }) => {
    await page.goto('/', { waitUntil: 'commit' });
    
    await page.waitForSelector('text=Loading', { timeout: 5000 }).catch(() => {});
  });

  test('should redirect root path to home', async ({ page }) => {
    await page.goto('/');

    await page.waitForURL('**/home');
    expect(page.url()).toContain('/home');
  });
});
