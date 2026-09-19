import { test, expect } from '@playwright/test';

const SITE_URL = 'https://kemal.crunchy.my.id/';
const PAGE_TITLE = 'Muhamad Kemal Faza — Software Engineer & Informatics Student';

test.describe('SEO surface', () => {
  test('publishes crawlable identity metadata', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(PAGE_TITLE);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /Muhamad Kemal Faza.*Software Engineer.*Diponegoro University/,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', SITE_URL);
    await expect(page.locator('h1')).toContainText('Muhamad Kemal Faza');
    await expect(page.locator('h1')).toContainText('Building systems.');
  });

  test('publishes complete social metadata', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', SITE_URL);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `${SITE_URL}og-image.png`);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', `${SITE_URL}og-image.png`);

    const socialImage = await page.request.get('/og-image.png');
    expect(socialImage.ok()).toBe(true);
    expect(socialImage.headers()['content-type']).toContain('image/png');
  });

  test('publishes Person and WebSite structured data', async ({ page }) => {
    await page.goto('/');

    const structuredData = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
    const graph = structuredData['@graph'];

    expect(graph).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          '@type': 'Person',
          name: 'Muhamad Kemal Faza',
          jobTitle: 'Software Engineer',
          url: SITE_URL,
        }),
        expect.objectContaining({
          '@type': 'WebSite',
          url: SITE_URL,
        }),
      ]),
    );
  });

  test('serves an explicit robots policy and sitemap', async ({ request }) => {
    const [robots, sitemap] = await Promise.all([request.get('/robots.txt'), request.get('/sitemap.xml')]);

    expect(robots.ok()).toBe(true);
    expect(await robots.text()).toContain(`Sitemap: ${SITE_URL}sitemap.xml`);
    expect(sitemap.ok()).toBe(true);
    expect(await sitemap.text()).toContain(`<loc>${SITE_URL}</loc>`);
  });
});
