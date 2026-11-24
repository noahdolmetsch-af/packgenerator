// R3 «Mini-Bericht als Bild» (Noah 23.11.2026): after the race one picture with the line and four numbers, only on a tap.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en) => DE[en] ?? en;

test('Race: mini report as a picture opens on a tap and shows a picture', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/race');
  await page.locator('[data-race-sample-open]').click();
  await expect(page).toHaveURL(/#\/race\/race-sample$/);
  await page.locator('[data-race-tab="after"]').click();
  const btn = page.locator('[data-race-card]');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveText(T('Mini report as a picture'));
  // nothing is made before the tap
  await expect(page.locator('[data-postcard-img]')).toHaveCount(0);
  await btn.click();
  await expect(page.locator('[data-postcard-img]')).toBeVisible();
  if (process.env.BAGSHOT_DIR) await page.screenshot({ path: `${process.env.BAGSHOT_DIR}/r3-card-${info.project.name}.png` });
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-postcard-img]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
