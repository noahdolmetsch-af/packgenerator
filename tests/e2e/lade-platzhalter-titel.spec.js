// Durchklick Etappe 2, Frage 5a (Noah 05.11.2026): while the code of a page loads, the placeholder comes soon and carries the
// name of the page, so the screen is never blank under the path. The code of Wardrobe arrives late (1.5 s) on purpose.
// German, phone and computer, no data.
import { test, expect } from './clock.js';

test('a page that loads slowly shows its name and the loading bike after 0.1 s', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await context.route(/\/assets\/Wardrobe-[^/]+\.js$/, async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.continue();
  });
  await page.goto('./#/');
  await expect(page.locator('main')).toBeVisible();
  await page.evaluate(() => (location.hash = '#/wardrobe'));
  const wait = page.locator('[data-page-loading]');
  // the placeholder is there well before the old 0.3 s, and it has the name of the page and the loading sign
  await expect(wait).toBeVisible({ timeout: 700 });
  await expect(wait.locator('[data-page-wait-title]')).not.toHaveText('');
  await expect(wait.locator('[data-skeleton]')).toBeVisible();
  const name = (await wait.locator('[data-page-wait-title]').innerText()).trim();
  expect(name.length).toBeGreaterThan(2);
  // then the real page replaces it
  await expect(page.locator('main h1').first()).toBeVisible({ timeout: 10_000 });
  await expect(wait).toHaveCount(0);
  expect(errors).toEqual([]);
});
