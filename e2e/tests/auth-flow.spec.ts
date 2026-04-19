import { test, expect } from '@playwright/test';
import { generateUniqueUser, fillLoginForm, fillRegisterForm, API_BASE_URL, TestUser } from './helpers/test-helpers';
import { connectToDB, disconnectFromDB, verifyUserByEmail, createVerifiedUser, deleteUserByEmail } from './helpers/db-helpers';

test.describe('Complete Authentication Flow (with DB Helper)', () => {
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

  test('should register user via API, verify via DB, and login successfully', async ({ page, request }) => {
    const registerResponse = await request.post(`${API_BASE_URL}/user/register`, {
      data: {
        username: testUser.username,
        email: testUser.email,
        password: testUser.password,
      },
    });
    expect(registerResponse.ok()).toBeTruthy();

    const verified = await verifyUserByEmail(testUser.email);
    expect(verified).toBeTruthy();

    await page.goto('/login');

    await fillLoginForm(page, testUser.username, testUser.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/home');
    expect(page.url()).toContain('/home');

    const logoutLink = page.locator('nav a:text("Logout")');
    await expect(logoutLink).toBeVisible();

    const profileLink = page.locator('nav a', { hasText: testUser.username });
    await expect(profileLink).toBeVisible();
  });

  test('should create verified user via DB and login successfully', async ({ page }) => {
    await createVerifiedUser({
      username: testUser.username,
      email: testUser.email,
      password: testUser.password,
    });

    await page.goto('/login');

    await fillLoginForm(page, testUser.username, testUser.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/home');
    expect(page.url()).toContain('/home');

    const logoutLink = page.locator('nav a:text("Logout")');
    await expect(logoutLink).toBeVisible();
  });

  test('should maintain login state across page navigation', async ({ page }) => {
    await createVerifiedUser({
      username: testUser.username,
      email: testUser.email,
      password: testUser.password,
    });

    await page.goto('/login');
    await fillLoginForm(page, testUser.username, testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home');

    await page.goto('/home');
    const logoutLink1 = page.locator('nav a:text("Logout")');
    await expect(logoutLink1).toBeVisible();

    await page.click('nav a:text("Home")');
    const logoutLink2 = page.locator('nav a:text("Logout")');
    await expect(logoutLink2).toBeVisible();
  });

  test('should access protected profile page after login', async ({ page }) => {
    await createVerifiedUser({
      username: testUser.username,
      email: testUser.email,
      password: testUser.password,
    });

    await page.goto('/login');
    await fillLoginForm(page, testUser.username, testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home');

    await page.click('nav a', { hasText: testUser.username });

    await page.waitForURL('**/my-profile');
    expect(page.url()).toContain('/my-profile');

    await expect(page.getByText(`Hey ${testUser.username}`)).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    await createVerifiedUser({
      username: testUser.username,
      email: testUser.email,
      password: testUser.password,
    });

    await page.goto('/login');
    await fillLoginForm(page, testUser.username, testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home');

    const logoutLink = page.locator('nav a:text("Logout")');
    await expect(logoutLink).toBeVisible();

    await page.click('nav a:text("Logout")');

    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');

    const loginLink = page.locator('nav a:text("Login")');
    await expect(loginLink).toBeVisible();

    const logoutLinkAfter = page.locator('nav a:text("Logout")');
    await expect(logoutLinkAfter).not.toBeVisible();
  });

  test('should show error when login with wrong password', async ({ page }) => {
    await createVerifiedUser({
      username: testUser.username,
      email: testUser.email,
      password: testUser.password,
    });

    await page.goto('/login');
    await fillLoginForm(page, testUser.username, 'wrongpassword');
    await page.click('button[type="submit"]');

    await page.waitForSelector('.Error, .error', { timeout: 10000 });
    
    const errorMessage = page.locator('.Error, .error');
    await expect(errorMessage).toBeVisible();
  });

  test('should maintain login state after page refresh', async ({ page }) => {
    await createVerifiedUser({
      username: testUser.username,
      email: testUser.email,
      password: testUser.password,
    });

    await page.goto('/login');
    await fillLoginForm(page, testUser.username, testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home');

    const logoutLinkBefore = page.locator('nav a:text("Logout")');
    await expect(logoutLinkBefore).toBeVisible();

    await page.reload();

    const logoutLinkAfter = page.locator('nav a:text("Logout")');
    await expect(logoutLinkAfter).toBeVisible();

    const profileLink = page.locator('nav a', { hasText: testUser.username });
    await expect(profileLink).toBeVisible();
  });

  test('should redirect to login after logout when accessing protected page', async ({ page }) => {
    await createVerifiedUser({
      username: testUser.username,
      email: testUser.email,
      password: testUser.password,
    });

    await page.goto('/login');
    await fillLoginForm(page, testUser.username, testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home');

    await page.click('nav a:text("Logout")');
    await page.waitForURL('**/login');

    await page.goto('/my-profile');

    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });
});

test.describe('Registration and Verification Flow', () => {
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

  test('should complete registration via UI and show verification message', async ({ page }) => {
    await page.goto('/register');

    await fillRegisterForm(page, testUser);
    await page.click('button[type="submit"]');

    await page.waitForSelector('text=verification email', { timeout: 10000 });
    
    await expect(page.getByText('A verification email has been sent.')).toBeVisible();
    await expect(page.getByText(testUser.email)).toBeVisible();
  });

  test('should not allow login before verification', async ({ page }) => {
    await page.goto('/register');
    await fillRegisterForm(page, testUser);
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=verification email', { timeout: 10000 });

    await page.goto('/login');
    await fillLoginForm(page, testUser.username, testUser.password);
    await page.click('button[type="submit"]');

    await page.waitForSelector('.Error, .error', { timeout: 10000 });
    
    const errorMessage = page.locator('.Error, .error');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/verify|verif/i);
  });

  test('should allow login after verification via DB', async ({ page }) => {
    await page.goto('/register');
    await fillRegisterForm(page, testUser);
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=verification email', { timeout: 10000 });

    const verified = await verifyUserByEmail(testUser.email);
    expect(verified).toBeTruthy();

    await page.goto('/login');
    await fillLoginForm(page, testUser.username, testUser.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/home');
    expect(page.url()).toContain('/home');

    const logoutLink = page.locator('nav a:text("Logout")');
    await expect(logoutLink).toBeVisible();
  });
});
