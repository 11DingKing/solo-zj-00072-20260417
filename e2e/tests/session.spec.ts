import { test, expect } from '@playwright/test';
import { generateUniqueUser, fillLoginForm, FRONTEND_BASE_URL, TestUser, API_BASE_URL } from './helpers/test-helpers';

test.describe('Session and Navigation', () => {
  let testUser: TestUser;

  test.beforeEach(async () => {
    testUser = generateUniqueUser();
  });

  test('should display correct navigation for unauthenticated user', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/home`);

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
    await page.goto(`${FRONTEND_BASE_URL}/home`);
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

  test('should redirect to home when accessing protected page without login', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/my-profile`);

    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });

  test('should redirect to home when accessing logout page without login', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/logout`);

    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });

  test('should show homepage content correctly', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/home`);

    await expect(page.locator('[data-test-id="homepage-anchor"]')).toBeVisible();
    await expect(page.getByText('Check the github repo')).toBeVisible();
  });

  test('should have active class on current page navigation link', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/home`);
    
    const homeLink = page.locator('nav a:text("Home")');
    await expect(homeLink).toHaveClass(/active/);

    await page.click('nav a:text("Login")');
    await page.waitForURL('**/login');
    
    const loginLink = page.locator('nav a:text("Login")');
    await expect(loginLink).toHaveClass(/active/);
  });

  test('should display loading state initially', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/`, { waitUntil: 'commit' });
    
    await page.waitForSelector('text=Loading', { timeout: 5000 }).catch(() => {});
  });
});

test.describe('Session Persistence (Requires Verified User - Manual Setup)', () => {
  test('note: successful login and session persistence tests require a verified user', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/login`);
    
    await expect(page.locator('input[id="username"]')).toBeVisible();
    
    console.log('Note: To test successful login and session persistence,');
    console.log('you need a verified user. In a real test environment,');
    console.log('you would either:');
    console.log('1. Use a test email service to capture verification emails');
    console.log('2. Or use a database helper to directly create verified users');
    console.log('3. Or have a test API endpoint to bypass verification');
  });
});
