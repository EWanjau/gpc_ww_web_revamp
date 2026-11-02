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
  await page.getByRole('link', { name: /find a missional community/i }).click();
  await expect(page).toHaveURL(/#community-list$/);
  const communities = page.locator('#community-list');
  await expect(communities.getByRole('heading', { name: 'Choose a place to connect.' })).toBeVisible();
  for (const name of ['Limuru', 'Online', 'Ginduri', 'Kinoo Makutano', 'Wambaa', 'Swahili', 'Sunday', '87 Junction', 'Muhuri Road', 'Kinoo', 'Muthiga', 'Kihumo', 'Regen']) {
    await expect(communities.getByRole('heading', { name: new RegExp(`^${name}$`, 'i') })).toBeVisible();
  }
  await expect(communities).toContainText('Wednesday, 7:15–8:15 pm');
  await expect(communities).toContainText('Anthony Kamau');
  await expect(communities.getByRole('link', { name: /ask about connecting/i })).toHaveAttribute('href', /mailto:info@gpcwaiyakiway\.org\?subject=Help%20me%20find%20a%20Missional%20Community/);
});

test('visitor can plan a Sunday visit with verified details and working actions', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /plan a visit/i }).first().click();
  const visit = page.locator('#plan-a-visit');
  await expect(visit).toContainText('10:30 am – 12:30 pm');
  await expect(visit).toContainText('Muthiga');
  await expect(visit).toContainText(/between Zawadi School and Lofty Creek Christian School/i);
  await expect(visit.getByRole('link', { name: /get directions/i })).toHaveAttribute('href', /google\.com\/maps/);
  await expect(visit).toContainText(/gathering of confessing Christians/i);
});

test('visitor can contact the church by phone or email', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /toggle navigation/i }).click();
  await page.getByRole('link', { name: /contact/i }).first().click();
  const contact = page.locator('#contact');
  await expect(contact).toContainText('+254 741 254528');
  await expect(contact.getByRole('link', { name: '+254 741 254528' })).toHaveAttribute('href', 'tel:+254741254528');
  await expect(contact.getByRole('link', { name: 'info@gpcwaiyakiway.org' })).toHaveAttribute('href', 'mailto:info@gpcwaiyakiway.org');
});

test('visitor can find a serving next step from shared navigation and homepage', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /serving/i }).first().click();
  const serving = page.locator('#serving');
  await expect(serving).toContainText(/serve one another|serving/i);
  await expect(serving.getByRole('link', { name: /ask about serving/i })).toHaveAttribute('href', /mailto:info@gpcwaiyakiway\.org/);
});

test('mobile visitor can open shared navigation and reach contact', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /toggle navigation/i }).click();
  await page.getByRole('navigation', { name: /main navigation/i }).getByRole('link', { name: /contact/i }).click();
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.locator('#contact')).toBeVisible();
});
