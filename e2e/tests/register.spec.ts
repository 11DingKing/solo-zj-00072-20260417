import { test, expect } from '@playwright/test';
import { generateUniqueUser, fillRegisterForm, TestUser } from './helpers/test-helpers';

test.describe('Registration Flow', () => {
  let testUser: TestUser;

  test.beforeEach(async () => {
    testUser = generateUniqueUser();
  });

  test('should navigate to register page and display registration form', async ({ page }) => {
    await page.goto('/register');

    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="username"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.getByText('Signup')).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.goto('/register');

    await page.click('button[type="submit"]');

    await expect(page.getByText('Required')).toHaveCount(3);
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[id="email"]', 'invalid-email');
    await page.fill('input[id="username"]', testUser.username);
    await page.fill('input[id="password"]', testUser.password);
    
    await page.click('button[type="submit"]');

    const emailError = page.locator('.field').filter({ hasText: 'Email' }).locator('.error, .Error');
    await expect(emailError).toBeVisible();
  });

  test('should show validation errors for short username', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[id="email"]', testUser.email);
    await page.fill('input[id="username"]', 'ab');
    await page.fill('input[id="password"]', testUser.password);
    
    await page.click('button[type="submit"]');

    const usernameError = page.locator('.field').filter({ hasText: 'Username' }).locator('.error, .Error');
    await expect(usernameError).toBeVisible();
  });

  test('should show validation errors for short password', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[id="email"]', testUser.email);
    await page.fill('input[id="username"]', testUser.username);
    await page.fill('input[id="password"]', '123');
    
    await page.click('button[type="submit"]');

    const passwordError = page.locator('.field').filter({ hasText: 'Password' }).locator('.error, .Error');
    await expect(passwordError).toBeVisible();
  });

  test('should submit registration form and show verification email message', async ({ page }) => {
    await page.goto('/register');

    await fillRegisterForm(page, testUser);

    await page.click('button[type="submit"]');

    await page.waitForSelector('text=verification email', { timeout: 10000 });
    
    await expect(page.getByText('A verification email has been sent.')).toBeVisible();
    await expect(page.getByText(testUser.email)).toBeVisible();
  });

  test('should show error when username is already taken', async ({ page }) => {
    const firstUser = generateUniqueUser();
    
    await page.goto('/register');
    await fillRegisterForm(page, firstUser);
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=verification email', { timeout: 10000 });

    const secondUser = generateUniqueUser();
    secondUser.username = firstUser.username;

    await page.goto('/register');
    await fillRegisterForm(page, secondUser);
    await page.click('button[type="submit"]');

    await page.waitForSelector('.Error, .error', { timeout: 10000 });
    
    const errorMessage = page.locator('.Error, .error');
    await expect(errorMessage).toBeVisible();
  });

  test('should show error when email is already registered', async ({ page }) => {
    const firstUser = generateUniqueUser();
    
    await page.goto('/register');
    await fillRegisterForm(page, firstUser);
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=verification email', { timeout: 10000 });

    const secondUser = generateUniqueUser();
    secondUser.email = firstUser.email;

    await page.goto('/register');
    await fillRegisterForm(page, secondUser);
    await page.click('button[type="submit"]');

    await page.waitForSelector('.Error, .error', { timeout: 10000 });
    
    const errorMessage = page.locator('.Error, .error');
    await expect(errorMessage).toBeVisible();
  });

  test('should have link to login page from register page', async ({ page }) => {
    await page.goto('/register');

    const homeLink = page.locator('nav a:text("Home")');
    await expect(homeLink).toBeVisible();

    const loginLink = page.locator('nav a:text("Login")');
    await expect(loginLink).toBeVisible();
  });
});
