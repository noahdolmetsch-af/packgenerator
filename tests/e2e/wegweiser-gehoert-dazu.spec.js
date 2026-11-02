// «Wegweiser statt Katalog» PR 10 (Noah 01.11.2026 «1a 2a 3a 4a 5a»): «Belongs to …» on Bikes, Gear and Active, only on
// the page itself. German, phone and computer, fictional data (home0460-fixture), no sideways scroll.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

const noScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);

test('Belongs to on Bikes, Gear and Active: a quiet row of links, not on sub-pages', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { hour: 9 });
  for (const [hash, moment, name] of [['#/bikes', 'velo', 'Bike and gear|moment'], ['#/gear', 'velo', 'Bike and gear|moment'], ['#/flow', 'koerper', 'Body and training|moment']]) {
    await page.goto('./' + hash);
    const row = page.locator(`[data-gehoert="${moment}"]`);
    await expect(row).toBeVisible();
    await expect(row).toContainText(T('Belongs to {moment}', { moment: T(name) }));
    const n = await row.locator('[data-gehoert-item]').count();
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThanOrEqual(5);
    expect(await noScroll(page)).toBeLessThanOrEqual(0);
  }
  await page.goto('./#/flow/sports');
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('[data-gehoert]')).toHaveCount(0);
  await page.goto('./#/flow');
  const first = page.locator('[data-gehoert="koerper"] [data-gehoert-item]').first();
  await first.click();
  await expect(page).not.toHaveURL(/#\/flow\/?$/);
  expect(errors).toEqual([]);
});
