import { Page, APIRequestContext, expect } from '@playwright/test';

export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8081/api';
export const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';

export interface TestUser {
  username: string;
  email: string;
  password: string;
}

export function generateUniqueUser(): TestUser {
  const timestamp = Date.now().toString().slice(-6);
  return {
    username: `user_${timestamp}`,
    email: `user_${timestamp}@test.com`,
    password: 'Test123!',
  };
}

export async function registerUserViaAPI(
  request: APIRequestContext,
  user: TestUser
): Promise<boolean> {
  const response = await request.post(`${API_BASE_URL}/user/register`, {
    data: {
      username: user.username,
      email: user.email,
      password: user.password,
    },
  });
  return response.ok();
}

export async function loginUserViaAPI(
  request: APIRequestContext,
  user: TestUser
): Promise<boolean> {
  const response = await request.post(`${API_BASE_URL}/auth/login`, {
    data: {
      username: user.username,
      password: user.password,
    },
  });
  return response.ok();
}

export async function navigateToPage(page: Page, path: string): Promise<void> {
  await page.goto(`${FRONTEND_BASE_URL}${path}`);
}

export async function fillLoginForm(
  page: Page,
  username: string,
  password: string
): Promise<void> {
  await page.fill('input[id="username"]', username);
  await page.fill('input[id="password"]', password);
}

export async function fillRegisterForm(
  page: Page,
  user: TestUser
): Promise<void> {
  await page.fill('input[id="email"]', user.email);
  await page.fill('input[id="username"]', user.username);
  await page.fill('input[id="password"]', user.password);
}

export async function fillPasswordResetRequestForm(
  page: Page,
  email: string
): Promise<void> {
  await page.fill('input[id="email"]', email);
}

export async function isLoggedIn(page: Page): Promise<boolean> {
  const logoutLink = page.locator('nav a:text("Logout")');
  return await logoutLink.isVisible();
}

export async function waitForNavigationAndCheckURL(
  page: Page,
  expectedPath: string
): Promise<void> {
  await page.waitForURL(`**${expectedPath}`);
  expect(page.url()).toContain(expectedPath);
}
