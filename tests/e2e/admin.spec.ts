import { test, expect } from '@playwright/test';

// NOTE: For E2E you will need a seeded user and perhaps test data.
// These are example flows; adjust selectors/fixtures to your actual app state.

test('signin flow', async ({ page }) => {
  await page.goto('/signin');
  await expect(page.getByRole('button', { name: /sign in/i })).toBeDisabled();
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('password');
  await expect(page.getByRole('button', { name: /sign in/i })).toBeEnabled();
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/admin');
});

test('create and delete store', async ({ page }) => {
  // assume already signed in as SUPER_ADMIN
  await page.goto('/admin/stores');

  // Fill create store form (rendered client-side)
  await page.getByLabel('Name').fill('E2E Store');
  await page.getByLabel('Owner Email').fill('owner@example.com');
  await page.getByRole('button', { name: /create/i }).click();

  // Verify store appears (simplified)
  await expect(page.getByText('E2E Store')).toBeVisible();

  // Delete via modal
  await page.getByRole('button', { name: /^delete$/i }).click();
  await page.getByLabel('Store name').fill('E2E Store');
  await page.getByRole('button', { name: /^delete$/i }).click();

  // Verify removed (simplified; adjust to your list behavior)
  await expect(page.getByText('E2E Store')).toHaveCount(0);
});

test('update account updates sidebar name', async ({ page }) => {
  // assume logged in; navigate to account
  await page.goto('/admin/account');
  const nameInput = page.getByLabel('Name');
  await nameInput.fill('New Name');
  await page.getByRole('button', { name: /update/i }).click();

  // Navigate to another page to trigger re-render
  await page.goto('/admin/stores');
  // Sidebar should contain "New Name" (adjust selector as needed)
  await expect(page.getByText('New Name')).toBeVisible();
});
