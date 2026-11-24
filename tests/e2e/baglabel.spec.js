// K2 «Taschen-Etiketten» (Noah 23.11.2026): the content of a bag as one picture, made on a tap. Fictional data only.
import { test, expect } from './clock.js';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const T = (en) => DE[en] ?? en;

test('Bag label: a picture of the content, save link and share button', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  await importAndSettle(page, FIX);
  await page.evaluate(() => localStorage.setItem('pack.currentTrip', 'test_data_gtp_trip26'));
  await page.goto('./#/pack');
  await page.reload();
  await expect(page.locator('.calm-pack')).toBeVisible();
  const heads = page.locator('section.bag-group .bag-heading');
  await expect(heads.first()).toBeVisible();
  for (let i = 0; i < (await heads.count()); i++) if ((await heads.nth(i).getAttribute('aria-expanded')) !== 'true') await heads.nth(i).click();
  const open = page.locator('[data-bag-label-open]').first();
  await open.scrollIntoViewIfNeeded();
  await expect(open).toHaveText(T('Label of the bag'));
  await expect(page.locator('[data-bag-label-img]')).toHaveCount(0);
  await open.click();
  const img = page.locator('[data-bag-label-img]');
  await expect(img).toBeVisible();
  const dim = await img.evaluate((i) => ({ w: i.naturalWidth, h: i.naturalHeight }));
  expect(dim.w).toBe(900);
  expect(dim.h).toBeGreaterThan(500);
  await expect(page.locator('[data-bag-label-save]')).toHaveAttribute('download', /\.jpg$/);
  await expect(page.locator('[data-bag-label-share]')).toBeEnabled();
  if (process.env.BAGSHOT_DIR) await page.locator('dialog[open]').screenshot({ path: `${process.env.BAGSHOT_DIR}/k2-label-${info.project.name}.png` });
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-bag-label-img]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
