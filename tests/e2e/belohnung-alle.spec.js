// «Belohnungen für jede Sportart» (Noah 01.11.2026 «alle 1-6»): a sport page has «Reward», the star window says «Your reward»
// when the star carries it. Fictional data only; the clock stands on Friday 9 October 2026. SHOTS=<folder> saves pictures.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
async function shot(page, info, name) {
  if (!process.env.SHOTS) return;
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
}

test('a sport page hangs a reward on a star, the star window names it', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  await put(page, {
    flowLog: [1, 2, 3, 4].map((i) => ({ id: `test_run_${i}`, actId: 'run', day: addDays(TODAY, -i), at: `${addDays(TODAY, -i)}T18:00:00+02:00`, n: 1 })),
    items: [{ id: 'test_wish_1', name: 'test_data_gtp_ Cap', nameDe: 'test_data_gtp_ Kappe', ownership: 'wishlist' }],
  });
  await page.goto('./#/flow/sport/act%3Arun');
  await page.reload();
  await ready(page);
  const box = page.locator('[data-sport-reward]');
  await expect(box).toBeVisible();
  await box.getByRole('button', { name: T('Choose') }).click();
  await box.getByRole('button', { name: T('Save') }).click();
  await expect(box).toContainText('test_data_gtp_ Kappe');
  await box.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await shot(page, info, 'belohnung-sportseite');
  await page.goto('./#/flow');
  await page.reload();
  await ready(page);
  await page.locator('section[aria-labelledby="tick-h"]').locator('[data-act="run"]').click();
  const win = page.locator('dialog[data-star-window]');
  await expect(win.locator('[data-star-reward]')).toContainText('test_data_gtp_ Kappe');
  await shot(page, info, 'belohnung-fenster');
  expect(errors).toEqual([]);
});
