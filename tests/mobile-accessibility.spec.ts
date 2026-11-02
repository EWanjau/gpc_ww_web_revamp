import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/wp-json/wp/v2/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/missional-community')) {
      await route.fulfill({ json: [{ title: { rendered: 'Limuru MC' } }, { title: { rendered: 'Online MC' } }] });
    } else if (url.pathname.endsWith('/posts')) {
      await route.fulfill({ json: [{
        id: 1, date: '2025-03-08T09:30:00', slug: 'hope-in-the-waiting',
        title: { rendered: 'Hope in the Waiting' }, excerpt: { rendered: '<p>Patient hope.</p>' },
        content: { rendered: '<p>Jesus remains faithful.</p>' },
        _embedded: { author: [{ name: 'GracePoint editor' }] },
      }] });
    } else if (url.pathname.endsWith('/newsletter')) {
      await route.fulfill({ json: [{
        id: 2, date: '2025-04-06T10:00:00', slug: 'april-news', title: { rendered: 'April Newsletter' },
        content: { rendered: '<p>Church family news.</p>' },
      }] });
    } else if (url.pathname.endsWith('/pages') && url.searchParams.get('slug') === 'sermons') {
      await route.fulfill({ json: [{ content: { rendered: '<div data-video-title="Hope in Christ"><a href="https://www.youtube.com/watch?v=abc123XYZ00"><img src="https://i.ytimg.com/vi/abc123XYZ00/hqdefault.jpg"></a></div>' } }] });
    } else {
      await route.fulfill({ json: [{ title: { rendered: 'A place to belong, grow and serve' }, excerpt: { rendered: 'A church family.' } }] });
    }
  });
});

test('mobile navigation is keyboard operable and closes after choosing a launch page', async ({ page }) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Toggle navigation' });
  const navigation = page.getByRole('navigation', { name: 'Main navigation' });

  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(navigation).toBeVisible();
  await navigation.getByRole('link', { name: 'Newsletters' }).focus();
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(/#newsletters$/);
  await expect(page.getByRole('heading', { name: 'Newsletters' })).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(navigation).toBeHidden();
});

test('mobile launch pages keep actions in the viewport and avoid horizontal overflow', async ({ page }) => {
  for (const [hash, action] of [
    ['', /plan a visit/i],
    ['#plan-a-visit', /get directions/i],
    ['#missional-communities', /find a missional community/i],
    ['#community-list', /ask about connecting/i],
    ['#serving', /ask about serving/i],
    ['#contact', /info@gpcwaiyakiway\.org/i],
  ] as const) {
    await page.goto(`/${hash}`);
    const actionLink = page.getByRole('link', { name: action }).first();
    await expect(actionLink).toBeVisible();
    const box = await actionLink.boundingBox();
    const viewport = page.viewportSize();
    expect(box, `Expected ${String(action)} to have a visible box at ${hash || '/'}`).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport!.width);
  }
});

const launchRoutes = [
  { route: '/', name: 'home' },
  { route: '/#plan-a-visit', name: 'visit' },
  { route: '/#missional-communities', name: 'Missional Communities' },
  { route: '/#community-list', name: 'community list' },
  { route: '/#about', name: 'about' },
  { route: '/#serving', name: 'serving' },
  { route: '/#contact', name: 'contact' },
  { route: '/#articles', name: 'Articles' },
  { route: '/#article/hope-in-the-waiting', name: 'article detail' },
  { route: '/#newsletters', name: 'Newsletters' },
  { route: '/#newsletter/april-news', name: 'newsletter detail' },
  { route: '/#sermons', name: 'Sermons' },
];

for (const { route, name } of launchRoutes) {
  test(`mobile ${name} page exposes no axe accessibility violations`, async ({ page }) => {
    await page.goto(route);
    if (route.includes('#articles')) await expect(page.getByRole('heading', { name: 'Articles' })).toBeVisible();
    if (route.includes('#article/')) await expect(page.getByRole('heading', { name: 'Hope in the Waiting' })).toBeVisible();
    if (route.includes('#newsletters')) await expect(page.getByRole('heading', { name: 'Newsletters' })).toBeVisible();
    if (route.includes('#newsletter/')) await expect(page.getByRole('heading', { name: 'April Newsletter' })).toBeVisible();
    if (route.includes('#sermons')) await expect(page.getByRole('heading', { name: 'Sermons' })).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
    expect(
      results.violations.map((violation) => ({
        id: violation.id,
        nodes: violation.nodes.map((node) => ({ target: node.target, message: node.any[0]?.message })),
      })),
      `${name}: ${results.violations.map((violation) => `${violation.id}: ${violation.help}`).join('\n')}`,
    ).toEqual([]);
  });
}
