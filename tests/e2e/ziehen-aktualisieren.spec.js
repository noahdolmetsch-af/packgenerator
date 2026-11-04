// «Ziehen zum Aktualisieren mit Velorad» (Noah 03.11.2026 «b», Paket D, Idee 10): on Heute a pull from the top shows a bike
// wheel and refreshes; elsewhere or from the middle of the page nothing happens. Touch only, so the phone project.
// Fictional data (home0460-fixture), nothing leaves the preview.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

async function pull(page, context, { from = 200, by = 220 } = {}) {
  const cdp = await context.newCDPSession(page);
  const touch = (type, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: 190, y }] });
  await touch('touchStart', from);
  for (let d = 20; d <= by; d += 20) await touch('touchMove', from + d);
  return { release: () => touch('touchEnd', from + by) };
}

test.describe('pull to refresh', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'phone', 'touch only'));

  test('a long pull from the top turns the wheel and says when it is up to date', async ({ page, context }, info) => {
    const T = await openHome(page, context, info);
    await page.goto('./#/');
    await page.evaluate(() => window.scrollTo(0, 0));
    const { release } = await pull(page, context);
    const wheel = page.locator('[data-pull-wheel]');
    await expect(wheel).toBeVisible();
    await expect(wheel).toContainText(T('Let go to refresh'));
    await release();
    await expect(wheel).toHaveAttribute('data-pull-wheel', 'busy');
    await expect(wheel).toHaveAttribute('data-pull-wheel', 'done', { timeout: 10_000 });
    await expect(wheel).toContainText(T('Up to date'));
    await expect(page.locator('[data-pull-wheel]')).toHaveCount(0, { timeout: 10_000 });
  });

  test('a short pull lets the wheel go back and loads nothing', async ({ page, context }, info) => {
    await openHome(page, context, info);
    await page.goto('./#/');
    await page.evaluate(() => window.scrollTo(0, 0));
    const { release } = await pull(page, context, { by: 80 });
    await expect(page.locator('[data-pull-wheel="pulling"]')).toBeVisible();
    await release();
    await expect(page.locator('[data-pull-wheel]')).toHaveCount(0);
  });

  test('no pull on another page', async ({ page, context }, info) => {
    await openHome(page, context, info);
    await page.goto('./#/trips');
    await page.evaluate(() => window.scrollTo(0, 0));
    await pull(page, context);
    await expect(page.locator('[data-pull-wheel]')).toHaveCount(0);
  });
});
