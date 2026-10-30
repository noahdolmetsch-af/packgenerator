// «VO2max auf Heute» (Noah 28.10.2026 «2 a und b»): a calm tile under «Dein Körper» with the last VO2max, its day and
// the change over four weeks; «Verlauf» opens Körperwerte › VO2max; without a value the tile stays away.
// German UI, the clock fixed in Europe/Zurich, no network, fictional health days only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const shots = process.env.SHOTS;

async function open(page, context, healthDays) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/');
  await ready(page);
  if (healthDays.length) await put(page, { healthDays });
  await page.reload();
  await ready(page);
  return errors;
}

test('the VO2max tile: value, day, change over four weeks, «Verlauf» opens its tab', async ({ page, context }, info) => {
  // a value every 7 days: 49.2 two days ago, 47.9 thirty days before that
  const days = [];
  for (let i = 2; i < 80; i += 7) days.push({ date: addDays(TODAY, -i), restingHr: 52, vo2max: i === 2 ? 49.2 : i === 30 ? 47.9 : 48.4, src: 'google' });
  const errors = await open(page, context, days);
  const tile = page.locator('[data-section="vo2max"]');
  await tile.scrollIntoViewIfNeeded();
  await expect(tile).toContainText(T('VO2max'));
  await expect(tile.locator('[data-vo2-value]')).toContainText(/49[.,]2/);
  await expect(tile.locator('[data-vo2-value]')).toContainText('ml/kg/min');
  await expect(tile.locator('[data-vo2-before]')).toContainText(/\+1[.,]3/);
  await expect(tile.locator('[data-vo2-before]')).toContainText(/47[.,]9/);
  // it stands in the area «Dein Körper»
  const area = await page.evaluate(() => {
    const items = [...document.querySelectorAll('[data-home-sec], [data-tile]')];
    const at = items.findIndex((el) => el.dataset.tile === 'vo2max');
    return items.slice(0, at).reverse().find((el) => el.dataset.homeSec)?.dataset.homeSec ?? null;
  });
  expect(area).toBe('body');
  const w = page.viewportSize().width;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
  if (shots) {
    await tile.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await page.screenshot({ path: `${shots}/vo2-tile-${info.project.name}.png` });
  }
  await tile.locator('[data-vo2-all]').click();
  await expect(page).toHaveURL(/#\/flow\/stats\/vo2max/);
  expect(errors).toEqual([]);
});

test('without a VO2max the tile stays away', async ({ page, context }) => {
  const errors = await open(page, context, [{ date: TODAY, restingHr: 52, src: 'google' }]);
  await expect(page.locator('[data-section="body"]').first()).toBeVisible();
  await expect(page.locator('[data-section="vo2max"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
