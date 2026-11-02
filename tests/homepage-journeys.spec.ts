import { expect, test } from '@playwright/test';

test('visitor can find Plan a visit from homepage and shared navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /a place to belong/i })).toBeVisible();
  await page.getByRole('link', { name: /plan a visit/i }).first().click();
  await expect(page).toHaveURL(/#plan-a-visit$/);
  await expect(page.getByRole('heading', { name: /we’d love to meet you/i })).toBeVisible();
});

test('visitor can find a Missional Community through shared navigation', async ({ page }) => {
  await page.route('**/wp-json/wp/v2/missional-community?**', async (route) => {
    await route.fulfill({ json: [
      ...['Limuru', 'Online', 'Ginduri', 'Kinoo Makutano', 'Wambaa', 'Swahili', 'Sunday', '87 Junction', 'Muhuri Road', 'Kinoo', 'Muthiga', 'Kihumo', 'Regen'].map((name) => ({ title: { rendered: `${name} MC` } })),
    ] });
  });
  await page.goto('/');
  await page.getByRole('link', { name: /find your community/i }).click();
  await expect(page).toHaveURL(/#missional-communities$/);
  await expect(page.getByRole('heading', { name: /faith is better together/i })).toBeVisible();
  await page.getByRole('link', { name: /find a missional community/i }).click();
  await expect(page).toHaveURL(/#community-list$/);
  const communities = page.locator('#community-list');
  await expect(communities.getByRole('heading', { name: 'Choose a place to connect.' })).toBeVisible();
  await expect(communities.getByRole('heading', { name: '87 Junction' })).toBeVisible();
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

test('visitor can browse WordPress articles and read an article with its date and author', async ({ page }) => {
  await page.route('**/wp-json/wp/v2/posts?**', async (route) => {
    await route.fulfill({ json: [
      {
        id: 41, date: '2025-03-08T09:30:00', slug: 'hope-in-the-waiting',
        title: { rendered: 'Hope in the Waiting' },
        excerpt: { rendered: '<p>A reflection on <em>patient hope</em>.</p>' },
        content: { rendered: '<p>When life is uncertain, <strong>Jesus remains faithful.</strong></p><p>We can encourage one another.</p><p>&lt;img src=x onerror=&quot;window.compromised = true&quot;&gt;</p><script>window.compromised = true</script><img src=x onerror="window.compromised = true">' },
        author: 7, _embedded: { author: [{ name: 'editor' }] },
      },
    ] });
  });
  await page.goto('/');
  await page.getByRole('button', { name: /toggle navigation/i }).click();
  await page.getByRole('navigation', { name: /main navigation/i }).getByRole('link', { name: /^articles$/i }).click();
  await expect(page).toHaveURL(/#articles$/);
  await expect(page.getByRole('heading', { name: 'Articles' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hope in the Waiting' })).toBeVisible();
  await expect(page.getByText('March 8, 2025')).toBeVisible();
  await page.getByRole('link', { name: /read article: hope in the waiting/i }).click();
  await expect(page).toHaveURL(/#article\/hope-in-the-waiting$/);
  await expect(page.getByRole('heading', { name: 'Hope in the Waiting' })).toBeVisible();
  await expect(page.locator('main')).toContainText('Jesus remains faithful.');
  await expect(page.locator('main')).toContainText('By editor');
  await expect(page.locator('.article-body')).toContainText('<img src=x onerror="window.compromised = true">');
  await expect(page.locator('.article-body script')).toHaveCount(0);
  await expect(page.locator('.article-body img[onerror]')).toHaveCount(0);
  await page.getByRole('link', { name: /back to articles/i }).click();
  await expect(page).toHaveURL(/#articles$/);
});

test('visitor can browse WordPress newsletters and read and download an available PDF', async ({ page }) => {
  await page.route('**/wp-json/wp/v2/newsletter?**', async (route) => {
    await route.fulfill({ json: [{
      id: 61, date: '2025-04-06T10:00:00', slug: 'april-news', title: { rendered: 'April Newsletter' },
      content: { rendered: '<p>Church family news for April.</p><p><a href="https://gpcwaiyakiway.org/wp-content/uploads/2025/04/april.pdf">Read the April PDF</a></p>' },
    }, {
      id: 62, date: '2025-03-01T10:00:00', slug: 'march-news', title: { rendered: 'March Newsletter' },
      content: { rendered: '<p>Church family news for March.</p>' },
    }] });
  });
  await page.goto('/');
  await page.getByRole('button', { name: /toggle navigation/i }).click();
  await page.getByRole('navigation', { name: /main navigation/i }).getByRole('link', { name: /^newsletters$/i }).click();
  await expect(page).toHaveURL(/#newsletters$/);
  await expect(page.getByRole('heading', { name: 'Newsletters' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'April Newsletter' })).toBeVisible();
  await expect(page.getByText('April 6, 2025')).toBeVisible();
  await page.getByRole('link', { name: /read newsletter: april newsletter/i }).click();
  await expect(page).toHaveURL(/#newsletter\/april-news$/);
  await expect(page.getByRole('heading', { name: 'April Newsletter' })).toBeVisible();
  const pdf = page.getByTitle('April Newsletter PDF');
  await expect(pdf).toHaveAttribute('src', 'https://gpcwaiyakiway.org/wp-content/uploads/2025/04/april.pdf');
  await expect(page.getByRole('link', { name: /open or download the newsletter pdf/i })).toHaveAttribute('href', 'https://gpcwaiyakiway.org/wp-content/uploads/2025/04/april.pdf');
  await page.getByRole('link', { name: /back to newsletters/i }).click();
  await page.getByRole('link', { name: /read newsletter: march newsletter/i }).click();
  await expect(page.getByText(/no pdf file is available for this newsletter/i)).toBeVisible();
  await expect(page.getByTitle('March Newsletter PDF')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /open or download the newsletter pdf/i })).toHaveCount(0);
});
