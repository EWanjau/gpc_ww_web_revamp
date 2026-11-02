import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/wp-json/wp/v2/pages?**', async (route) => {
    const slug = new URL(route.request().url()).searchParams.get('slug');
    if (slug === 'home') {
      await route.fulfill({ json: [{
        title: { rendered: 'Home' }, excerpt: { rendered: '' },
        content: { rendered: '<h3>Our Services</h3><p>We meet every Sunday: 10:30 am - 12:30 pm</p><h3>Visit Us</h3><p>We are located along Wambaa Road.</p><h3>About Us</h3><p>We aim to proclaim Christ and Him crucified.</p><h3>Join Us In Ministry</h3><p>We want to be providers of God’s love and care to others through service. Every one of us is called to serve one another.</p><h3>Call Us</h3><p>P.O BOX 1913, 10200 Kikuyu Kenya <a href="tel:+254741254528">+254 741 254528</a> <a href="mailto:info@gpcwaiyakiway.org">info@gpcwaiyakiway.org</a></p>' },
      }] });
    } else if (slug === 'contact-us') {
      await route.fulfill({ json: [{ content: { rendered: '<h2>Locate Us</h2><h2>At Muthiga, off Waiyakiway, between Zawadi School and Lofty Creek Christian School</h2><p><a href="tel:+254741254528">+254 741 254528</a></p><p><a href="mailto:info@gpcwaiyakiway.org">info@gpcwaiyakiway.org</a></p>' } }] });
    } else if (slug === 'missional-communities') {
      await route.fulfill({ json: [{ content: { rendered: '<h2>Missional Communities</h2><p>A Missional Community is a family of believers in GPC Waiyaki Way intentionally living out as followers of Christ and making followers of Christ in everyday life.</p>' } }] });
    } else {
      await route.fulfill({ json: [] });
    }
  });
  await page.route('**/wp-json/wp/v2/missional-community?**', async (route) => route.fulfill({ json: [
    'Limuru', 'Online', 'Ginduri', 'Kinoo Makutano', 'Wambaa', 'Swahili', 'Sunday', '87', 'Muhuri Rd', 'Kinoo', 'Muthiga', 'Kihumo', 'Regen',
  ].map((name) => ({ title: { rendered: `${name} MC` }, acf: [] })) }));
});

test('visitor can find Plan a visit from homepage and shared navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /a place to belong/i })).toBeVisible();
  await page.getByRole('link', { name: /plan a visit/i }).first().click();
  await expect(page).toHaveURL(/#plan-a-visit$/);
  await expect(page.getByRole('heading', { name: /we’d love to meet you/i })).toBeVisible();
});

test('visitor sees updated visit, contact, serving and community details from published WordPress content', async ({ page }) => {
  await page.route('**/wp-json/wp/v2/pages?slug=home**', async (route) => route.fulfill({ json: [{
    title: { rendered: 'Home' }, excerpt: { rendered: '' },
    content: { rendered: '<h3>Our Services</h3><p>We meet every Sunday: 9:15 am - 11:15 am</p><h3>Visit Us</h3><p>We are located at Cedar Lane, near the library.</p><h3>About Us</h3><p>Published About copy: rooted in Cedar Lane.</p><h3>Join Us In Ministry</h3><p>Serve with the welcome team.</p><h3>Call Us</h3><p>P.O BOX 80, Nairobi +254 700 111222 visitors@example.org</p>' },
  }] }));
  await page.route('**/wp-json/wp/v2/pages?slug=contact-us**', async (route) => route.fulfill({ json: [{
    content: { rendered: '<h2>Locate Us</h2><p>At Cedar Lane, near the library</p><p>+254 700 111222</p><p>visitors@example.org</p>' },
  }] }));
  await page.route('**/wp-json/wp/v2/pages?slug=missional-communities**', async (route) => route.fulfill({ json: [{
    content: { rendered: '<h2>Missional Communities</h2><p>We gather to learn, pray and serve our neighbours.</p><p>We meet weekly.</p><div data-elementor-type="loop-item"><h3>Cedar Park MC</h3><div class="elementor-widget-dyncontel-acf" data-settings="{&quot;acf_field_list&quot;:&quot;meeting_day&quot;}"><div class="dynamic-content-for-elementor-acf">Friday evenings</div></div><div class="elementor-widget-dyncontel-acf" data-settings="{&quot;acf_field_list&quot;:&quot;leader&quot;}"><div class="dynamic-content-for-elementor-acf">Jordan Lee</div></div></div>' },
  }] }));
  await page.route('**/wp-json/wp/v2/missional-community?**', async (route) => route.fulfill({ json: [
    { title: { rendered: 'Cedar Park MC' }, acf: [] },
  ] }));
  await page.goto('/');
  const visit = page.locator('#plan-a-visit');
  await expect(visit).toContainText('9:15 am - 11:15 am');
  await expect(visit).toContainText('Cedar Lane, near the library');
  await expect(visit.getByRole('link', { name: /get directions/i })).toHaveAttribute('href', /Cedar%20Lane/);
  await expect(page.locator('#contact')).toContainText('visitors@example.org');
  await expect(page.locator('#contact').getByRole('link', { name: 'visitors@example.org' })).toHaveAttribute('href', 'mailto:visitors@example.org');
  await expect(page.locator('#serving')).toContainText('Serve with the welcome team.');
  await expect(page.locator('#about')).toContainText('Published About copy: rooted in Cedar Lane.');
  await expect(page.locator('.hero-intro')).toContainText('Published About copy: rooted in Cedar Lane.');
  await expect(page.locator('#missional-communities')).toContainText('We gather to learn, pray and serve our neighbours.');
  await expect(page.locator('#community-list')).toContainText('Cedar Park');
  await expect(page.locator('#community-list')).toContainText('Friday evenings');
  await expect(page.locator('#community-list')).toContainText('Jordan Lee');
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
  await expect(communities.getByRole('link', { name: /ask about connecting/i })).toHaveAttribute('href', /mailto:info@gpcwaiyakiway\.org\?subject=Help%20me%20find%20a%20Missional%20Community/);
});

test('visitor can plan a Sunday visit with verified details and working actions', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /plan a visit/i }).first().click();
  const visit = page.locator('#plan-a-visit');
  await expect(visit).toContainText(/10:30 am\s*-\s*12:30 pm/);
  await expect(visit).toContainText('Muthiga');
  await expect(visit).toContainText(/between Zawadi School and Lofty Creek Christian School/i);
  await expect(visit.getByRole('link', { name: /get directions/i })).toHaveAttribute('href', /google\.com\/maps/);
  await expect(visit).toContainText(/10:30 am\s*-\s*12:30 pm/);
  await expect(visit).toContainText(/Muthiga, off Waiyakiway, between Zawadi School and Lofty Creek Christian School/i);
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

test('visitor can browse cached sermon thumbnails and open the video on YouTube', async ({ page }) => {
  await page.route('**/wp-json/wp/v2/pages?slug=sermons&_fields=content', async (route) => {
    await route.fulfill({ json: [{ content: { rendered: `
      <div class="video-card" data-video-title="Sunday: Hope in Christ">
        <a href="https://www.youtube.com/watch?v=abc123XYZ00"><img src="https://i.ytimg.com/vi/abc123XYZ00/hqdefault.jpg" alt="" onerror="window.compromised=true"></a>
      </div>
      <div data-video-title="A second message"><a href="https://www.youtube.com/watch?v=Zyx987Qwe65"><img src="https://i1.ytimg.com/vi/Zyx987Qwe65/mqdefault.jpg"></a></div>
      <div data-video-title="Ignore other destinations"><a href="https://example.com/watch?v=bad"><img src="https://example.com/image.jpg"></a></div>
      <script>window.compromised = true</script>
    ` } }] });
  });
  await page.goto('/');
  await page.getByRole('button', { name: /toggle navigation/i }).click();
  await page.getByRole('link', { name: /^sermons$/i }).click();
  await expect(page).toHaveURL(/#sermons$/);
  await expect(page.getByRole('heading', { name: 'Sermons' })).toBeVisible();
  const card = page.getByRole('article').filter({ hasText: 'Sunday: Hope in Christ' });
  await expect(card.getByRole('img', { name: 'Sunday: Hope in Christ' })).toHaveAttribute('src', 'https://i.ytimg.com/vi/abc123XYZ00/hqdefault.jpg');
  const outbound = card.getByRole('link', { name: 'Sunday: Hope in Christ' });
  await expect(outbound).toHaveAttribute('href', 'https://www.youtube.com/watch?v=abc123XYZ00');
  await expect(outbound).toHaveAttribute('target', '_blank');
  await expect(page.getByRole('article')).toHaveCount(2);
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('script:not([type="module"])')).toHaveCount(0);
  await expect(page.locator('img[onerror]')).toHaveCount(0);
});
