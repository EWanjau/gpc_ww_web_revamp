import { expect, test } from '@playwright/test';

test('visitor can find Plan a visit from homepage and shared navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /a place to belong/i })).toBeVisible();
  await page.getByRole('link', { name: /plan a visit/i }).first().click();
  await expect(page).toHaveURL(/#plan-a-visit$/);
  await expect(page.getByRole('heading', { name: /we’d love to meet you/i })).toBeVisible();
});

test('visitor can find a Missional Community through shared navigation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /find your community/i }).click();
  await expect(page).toHaveURL(/#missional-communities$/);
  await expect(page.getByRole('heading', { name: /faith is better together/i })).toBeVisible();
});
