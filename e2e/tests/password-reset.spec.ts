import { test, expect } from '@playwright/test';
import { generateUniqueUser, fillPasswordResetRequestForm, TestUser, API_BASE_URL } from './helpers/test-helpers';

const EMAIL_FIELD_INDEX = 0;

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

    const errorElements = page.locator('.field .error');
    await expect(errorElements).toHaveCount(1);
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/login/forgot');

    await page.fill('input[id="email"]', 'invalid-email');
    await page.click('button[type="submit"]');

    const emailError = page.locator('.field').nth(EMAIL_FIELD_INDEX).locator('.error');
    await expect(emailError).toBeVisible();
  });

  test('should show validation errors for short email', async ({ page }) => {
    await page.goto('/login/forgot');

    await page.fill('input[id="email"]', 'a@b');
    await page.click('button[type="submit"]');

    const emailError = page.locator('.field').nth(EMAIL_FIELD_INDEX).locator('.error');
    await expect(emailError).toBeVisible();
  });

  test('should show error for non-existent email', async ({ page }) => {
    await page.goto('/login/forgot');

    await fillPasswordResetRequestForm(page, testUser.email);
    
    await page.click('button[type="submit"]');

    const errorMessage = page.locator('.error');
    await expect(errorMessage).toBeVisible({ timeout: 15000 });
  });

  test('should submit password reset request for existing user and show success message', async ({ page }) => {
    await page.goto('/register');
    
    await page.locator('input[name="email"]').fill(testUser.email);
    await page.locator('input[name="username"]').fill(testUser.username);
    await page.locator('input[name="password"]').fill(testUser.password);
    
    await page.click('button[type="submit"]');
    
    await expect(page.getByText(/verification email/i)).toBeVisible({ timeout: 15000 });

    await page.goto('/login/forgot');
    await fillPasswordResetRequestForm(page, testUser.email);
    
    await page.click('button[type="submit"]');

    await expect(page.getByText(/reset link/i)).toBeVisible({ timeout: 15000 });
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
