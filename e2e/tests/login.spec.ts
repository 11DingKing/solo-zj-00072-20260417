import { test, expect } from '@playwright/test';
import { generateUniqueUser, fillLoginForm, fillRegisterForm, TestUser, API_BASE_URL } from './helpers/test-helpers';
import { connectToDB, disconnectFromDB, deleteUserByEmail } from './helpers/db-helpers';

const USERNAME_FIELD_INDEX = 0;
const PASSWORD_FIELD_INDEX = 1;

test.describe('Login Flow', () => {
  let testUser: TestUser;

  test.beforeAll(async () => {
    await connectToDB();
  });

  test.beforeEach(async () => {
    testUser = generateUniqueUser();
  });

  test.afterEach(async () => {
    await deleteUserByEmail(testUser.email);
  });

  test.afterAll(async () => {
    await disconnectFromDB();
  });

  test('should navigate to login page and display login form', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('input[id="username"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.goto('/login');

    await page.click('button[type="submit"]');

    const errorElements = page.locator('.field .error');
    await expect(errorElements).toHaveCount(2);
  });

  test('should show validation errors for short username', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[id="username"]', 'ab');
    await page.fill('input[id="password"]', testUser.password);
    
    await page.click('button[type="submit"]');

    const usernameError = page.locator('.field').nth(USERNAME_FIELD_INDEX).locator('.error');
    await expect(usernameError).toBeVisible();
  });

  test('should show validation errors for short password', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[id="username"]', testUser.username);
    await page.fill('input[id="password"]', '123');
    
    await page.click('button[type="submit"]');

    const passwordError = page.locator('.field').nth(PASSWORD_FIELD_INDEX).locator('.error');
    await expect(passwordError).toBeVisible();
  });

  test('should show error for non-existent user', async ({ page }) => {
    await page.goto('/login');

    await fillLoginForm(page, testUser.username, testUser.password);
    
    await page.click('button[type="submit"]');

    const errorMessage = page.locator('.error');
    await expect(errorMessage).toBeVisible({ timeout: 15000 });
  });

  test('should login successfully after registration', async ({ page }) => {
    await page.goto('/register');
    
    await fillRegisterForm(page, testUser);
    
    await page.click('button[type="submit"]');
    
    await expect(page.getByText(/verification email/i)).toBeVisible({ timeout: 15000 });

    await page.goto('/login');
    await fillLoginForm(page, testUser.username, testUser.password);
    
    await page.click('button[type="submit"]');

    await page.waitForURL('**/home');
    expect(page.url()).toContain('/home');
  });

  test('should have forgot password link on login page', async ({ page }) => {
    await page.goto('/login');

    const forgotPasswordLink = page.locator('a:text("Forgot your password?")');
    await expect(forgotPasswordLink).toBeVisible();
  });

  test('should navigate to forgot password page when clicking link', async ({ page }) => {
    await page.goto('/login');

    await page.click('a:text("Forgot your password?")');

    await page.waitForURL('**/login/forgot');
    expect(page.url()).toContain('/login/forgot');
  });

  test('should have sign up link on login page', async ({ page }) => {
    await page.goto('/login');

    const signUpLink = page.locator('a:text("Sign Up")');
    await expect(signUpLink).toBeVisible();
  });

  test('should navigate to register page when clicking sign up link', async ({ page }) => {
    await page.goto('/login');

    await page.click('a:text("Sign Up")');

    await page.waitForURL('**/register');
    expect(page.url()).toContain('/register');
  });

  test('should display navigation links on login page', async ({ page }) => {
    await page.goto('/login');

    const homeLink = page.locator('nav a:text("Home")');
    await expect(homeLink).toBeVisible();

    const loginLink = page.locator('nav a:text("Login")');
    await expect(loginLink).toBeVisible();

    const registerLink = page.locator('nav a:text("Register")');
    await expect(registerLink).toBeVisible();
  });
});
