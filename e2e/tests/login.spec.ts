import { test, expect } from '@playwright/test';
import { generateUniqueUser, fillLoginForm, FRONTEND_BASE_URL, TestUser, API_BASE_URL } from './helpers/test-helpers';

test.describe('Login Flow', () => {
  let testUser: TestUser;

  test.beforeEach(async () => {
    testUser = generateUniqueUser();
  });

  test('should navigate to login page and display login form', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/login`);

    await expect(page.locator('input[id="username"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.getByText('Login')).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/login`);

    await page.click('button[type="submit"]');

    await expect(page.getByText('Required')).toHaveCount(2);
  });

  test('should show validation errors for short username', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/login`);

    await page.fill('input[id="username"]', 'ab');
    await page.fill('input[id="password"]', testUser.password);
    
    await page.click('button[type="submit"]');

    const usernameError = page.locator('.field').filter({ hasText: 'Username' }).locator('.error, .Error');
    await expect(usernameError).toBeVisible();
  });

  test('should show validation errors for short password', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/login`);

    await page.fill('input[id="username"]', testUser.username);
    await page.fill('input[id="password"]', '123');
    
    await page.click('button[type="submit"]');

    const passwordError = page.locator('.field').filter({ hasText: 'Password' }).locator('.error, .Error');
    await expect(passwordError).toBeVisible();
  });

  test('should show error for non-existent user', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/login`);

    await fillLoginForm(page, testUser.username, testUser.password);
    await page.click('button[type="submit"]');

    await page.waitForSelector('.Error, .error', { timeout: 10000 });
    
    const errorMessage = page.locator('.Error, .error');
    await expect(errorMessage).toBeVisible();
  });

  test('should show error for unverified user login', async ({ page, request }) => {
    const response = await request.post(`${API_BASE_URL}/user/register`, {
      data: {
        username: testUser.username,
        email: testUser.email,
        password: testUser.password,
      },
    });
    expect(response.ok()).toBeTruthy();

    await page.goto(`${FRONTEND_BASE_URL}/login`);
    await fillLoginForm(page, testUser.username, testUser.password);
    await page.click('button[type="submit"]');

    await page.waitForSelector('.Error, .error', { timeout: 10000 });
    
    const errorMessage = page.locator('.Error, .error');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/verify|verif/i);
  });

  test('should have forgot password link on login page', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/login`);

    const forgotPasswordLink = page.locator('a:text("Forgot your password?")');
    await expect(forgotPasswordLink).toBeVisible();
  });

  test('should navigate to forgot password page when clicking link', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/login`);

    await page.click('a:text("Forgot your password?")');

    await page.waitForURL('**/login/forgot');
    expect(page.url()).toContain('/login/forgot');
  });

  test('should have sign up link on login page', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/login`);

    const signUpLink = page.locator('a:text("Sign Up")');
    await expect(signUpLink).toBeVisible();
  });

  test('should navigate to register page when clicking sign up link', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/login`);

    await page.click('a:text("Sign Up")');

    await page.waitForURL('**/register');
    expect(page.url()).toContain('/register');
  });

  test('should display navigation links on login page', async ({ page }) => {
    await page.goto(`${FRONTEND_BASE_URL}/login`);

    const homeLink = page.locator('nav a:text("Home")');
    await expect(homeLink).toBeVisible();

    const loginLink = page.locator('nav a:text("Login")');
    await expect(loginLink).toBeVisible();

    const registerLink = page.locator('nav a:text("Register")');
    await expect(registerLink).toBeVisible();
  });
});
