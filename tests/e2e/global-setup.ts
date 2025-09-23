import { chromium, type FullConfig } from '@playwright/test';

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL as string | undefined || process.env.STAGING_URL || 'http://localhost:3000';
  const email = process.env.PLAYWRIGHT_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.PLAYWRIGHT_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'password';

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Attempt sign-in via UI and save storage state for subsequent tests
  await page.goto(`${baseURL}/signin`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/admin');

  await context.storageState({ path: 'playwright/.auth/admin.json' });
  await browser.close();
}