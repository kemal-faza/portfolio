import { test, expect } from '@playwright/test';

/**
 * Behaviour contract for the motion layer on the landing page.
 *
 * These assert user-visible outcomes. The only "implementation" names they
 * rely on are the markup hooks (`data-reveal`, `data-hero`, `data-count`),
 * which are the documented interface between the page and the motion script.
 */

const HERO_HEADLINE = 'Building systems.';
const PROJECT_IDS = ['yodips', 'levelup', 'lastbite', 'dac'];

const opacityOf = (el: Element) => Number(getComputedStyle(el).opacity);

/** Every element the motion layer is allowed to hide before revealing it. */
const ANIMATED = '[data-reveal], [data-hero], [data-reveal-stagger] > *';

test.describe('motion layer', () => {
  test('ships a script to the browser', async ({ page }) => {
    const scripts: string[] = [];
    page.on('response', (r) => {
      if (r.request().resourceType() === 'script') scripts.push(r.url());
    });
    await page.goto('/');
    await page.waitForLoadState('load');
    expect(scripts.length, 'expected Astro to ship at least one script').toBeGreaterThan(0);
  });

  test('below-the-fold content starts hidden, then settles visible once scrolled to', async ({ page }) => {
    await page.goto('/');
    const intro = page.locator('#dac .project-intro');

    // A reveal is only a reveal if it starts hidden. This is the observable
    // contract of the animation, not an internal detail.
    await expect
      .poll(() => intro.evaluate(opacityOf), { timeout: 5000 })
      .toBeLessThan(1);

    await intro.scrollIntoViewIfNeeded();
    await expect
      .poll(() => intro.evaluate(opacityOf), { timeout: 8000 })
      .toBe(1);
  });

  test('every animated element ends fully visible after a full scroll', async ({ page }) => {
    await page.goto('/');
    const total = await page.locator(ANIMATED).count();
    expect(total, 'the motion layer must mark elements to animate').toBeGreaterThan(0);

    await page.evaluate(async () => {
      const step = window.innerHeight * 0.7;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 120));
      }
      window.scrollTo(0, document.body.scrollHeight);
    });

    await expect
      .poll(
        () =>
          page.evaluate(
            (selector) =>
              Array.from(document.querySelectorAll(selector)).filter((el) => Number(getComputedStyle(el).opacity) < 1).length,
            ANIMATED,
          ),
        { timeout: 10_000 },
      )
      .toBe(0);
  });

  test('animated metric counters keep their exact authored values', async ({ page }) => {
    const html = await (await page.request.get('/')).text();
    // Progressive enhancement: the real numbers must survive without JavaScript.
    expect(html).toContain('0.8177');
    expect(html).toContain('0.73969');

    await page.goto('/');
    const values = page.locator('#dac .metrics strong');
    await values.first().scrollIntoViewIfNeeded();
    await expect.poll(() => values.nth(0).textContent(), { timeout: 8000 }).toBe('0.8177');
    await expect.poll(() => values.nth(1).textContent(), { timeout: 8000 }).toBe('0.73969');
  });

  test('project accordions animate open and closed', async ({ page }) => {
    await page.goto('/');
    const details = page.locator('#yodips details');
    const content = details.locator('.expanded-content');

    await expect(details).not.toHaveAttribute('open', '');
    await details.locator('summary').click();
    await expect(details).toHaveAttribute('open', '');
    await expect
      .poll(() => content.evaluate((el) => el.getBoundingClientRect().height), { timeout: 8000 })
      .toBeGreaterThan(0);
    await expect(details.locator('summary')).toHaveAttribute('aria-expanded', 'true');

    await details.locator('summary').click();
    await expect(details).not.toHaveAttribute('open', '');
    await expect(details.locator('summary')).toHaveAttribute('aria-expanded', 'false');
  });

  test('reduced motion: nothing is hidden and nothing is left waiting', async ({ browser }) => {
    const context = await browser.newContext({
      reducedMotion: 'reduce',
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('load');

    const hidden = await page.evaluate(
      (selector) => Array.from(document.querySelectorAll(selector)).filter((el) => Number(getComputedStyle(el).opacity) < 1).length,
      ANIMATED,
    );
    expect(hidden, 'no element may be left invisible when reduced motion is requested').toBe(0);

    const total = await page.locator(ANIMATED).count();
    expect(total, 'the motion layer must have elements to govern').toBeGreaterThan(0);

    await expect(page.getByText(HERO_HEADLINE)).toBeVisible();
    await expect(page.getByText('0.8177')).toBeVisible();
    await context.close();
  });

  test('without JavaScript every section is fully readable', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');

    await expect(page.getByText(HERO_HEADLINE)).toBeVisible();
    await expect(page.getByText('0.8177')).toBeVisible();
    await expect(page.getByText('0.73969')).toBeVisible();
    await expect(page.locator('#dac .project-intro')).toBeVisible();
    for (const id of PROJECT_IDS) {
      await expect(page.locator(`#${id}`), `#${id} must be readable without JavaScript`).toBeVisible();
    }
    await context.close();
  });

  test('content survives the motion module never loading', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await page.route('**/_astro/*.js', (route) => route.abort());
    await page.goto('/');
    await page.waitForTimeout(2000);

    const hidden = await page.evaluate(
      (selector) => Array.from(document.querySelectorAll(selector)).filter((el) => Number(getComputedStyle(el).opacity) < 1).length,
      ANIMATED,
    );
    expect(hidden, 'a failed script must not leave the page blank').toBe(0);
    await expect(page.getByText(HERO_HEADLINE)).toBeVisible();
    await expect(page.getByText('0.8177')).toBeVisible();
    await context.close();
  });

  test('anchor navigation still works with the motion layer active', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav a[href="#contact"]').click();
    await expect(page).toHaveURL(/#contact$/);
    await expect(page.locator('#contact h2')).toBeInViewport();
  });
});
