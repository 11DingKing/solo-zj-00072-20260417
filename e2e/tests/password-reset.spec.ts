import { test, expect } from '@playwright/test';
import { generateUniqueUser, fillPasswordResetRequestForm, TestUser, API_BASE_URL } from './helpers/test-helpers';

test.describe('Password Reset Request Flow', () => {
  let testUser: TestUser;

  test.beforeEach(async () => {
    testUser = generateUniqueUser();
  });

  test('should navigate to password reset request page and display form', async ({ page }) => {
    await page.goto('/login/forgot');

    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.getByText('Send reset link')).toBeVisible();
  });

  test('should show validation errors for empty email submission', async ({ page }) => {
    await page.goto('/login/forgot');

    await page.click('button[type="submit"]');

    await expect(page.getByText('Required')).toBeVisible();
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/login/forgot');

    await page.fill('input[id="email"]', 'invalid-email');
    await page.click('button[type="submit"]');

    const emailError = page.locator('.field').filter({ hasText: 'Email' }).locator('.error, .Error');
    await expect(emailError).toBeVisible();
  });

  test('should show validation errors for short email', async ({ page }) => {
    await page.goto('/login/forgot');

    await page.fill('input[id="email"]', 'a@b');
    await page.click('button[type="submit"]');

    const emailError = page.locator('.field').filter({ hasText: 'Email' }).locator('.error, .Error');
    await expect(emailError).toBeVisible();
  });

  test('should show error for non-existent email', async ({ page }) => {
    await page.goto('/login/forgot');

    await fillPasswordResetRequestForm(page, testUser.email);
    await page.click('button[type="submit"]');

    await page.waitForSelector('.Error, .error', { timeout: 10000 });
    
    const errorMessage = page.locator('.Error, .error');
    await expect(errorMessage).toBeVisible();
  });

  test('should submit password reset request for existing user and show success message', async ({ page, request }) => {
    const response = await request.post(`${API_BASE_URL}/user/register`, {
      data: {
        username: testUser.username,
        email: testUser.email,
        password: testUser.password,
      },
    });
    expect(response.ok()).toBeTruthy();

    await page.goto('/login/forgot');
    await fillPasswordResetRequestForm(page, testUser.email);
    await page.click('button[type="submit"]');

    await page.waitForSelector('text=reset link', { timeout: 10000 });
    
    await expect(page.getByText('A reset link has been sent to your email')).toBeVisible();
  });

  test('should display navigation links on password reset page', async ({ page }) => {
    await page.goto('/login/forgot');

    const homeLink = page.locator('nav a:text("Home")');
    await expect(homeLink).toBeVisible();

    const loginLink = page.locator('nav a:text("Login")');
    await expect(loginLink).toBeVisible();

    const registerLink = page.locator('nav a:text("Register")');
    await expect(registerLink).toBeVisible();
  });

  test('should navigate back to login page from navigation', async ({ page }) => {
    await page.goto('/login/forgot');

    await page.click('nav a:text("Login")');

    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });
});
