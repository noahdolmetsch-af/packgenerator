// «Gesamtgewicht» (Noah 23.11.2026 «1a», «5a»): the weight card shows the trip in steps, the button «Wiegen» opens the first
// bag without a number. Fictional data. GESAMT_SHOTS=<folder> saves screenshots.
import { test, expect } from './clock.js';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';

test.use({ locale: 'de-CH' });
const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const SHOTS = process.env.GESAMT_SHOTS;

test('Gesamtgewicht in Stufen und Knopf Wiegen', async ({ page, context }, info) => {
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
  // the fixture trip lies in the past (fixed): reopen it
  await page.locator('.list-menu summary').click();
  await page.locator('.tz2-reopen').click();
  await page.locator('dialog[open] button.hi', { hasText: T('Reopen') }).click();
  await expect(page.locator('.tz2-reopen')).toHaveCount(0);

  const tot = page.locator('[data-total-weight]');
  await expect(tot).toBeVisible();
  await expect(tot.locator('h3')).toHaveText(T('Total weight'));
  await expect(tot.locator('[data-total-row="items"]')).toContainText(T('Only the items'));
  await expect(tot.locator('[data-total-row="bags"]')).toContainText(T('With the bags'));
  await expect(tot.locator('[data-total-row="bike"]')).toContainText(T('With the bike'));
  // every line is at least as heavy as the one before
  const kgs = await tot.locator('[data-total-row] .g').allTextContents();
  const n = kgs.map((x) => parseFloat(x.replace(/[^\d.,]/g, '').replace(',', '.')));
  for (let i = 1; i < n.length; i++) expect(n[i]).toBeGreaterThanOrEqual(n[i - 1]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  if (SHOTS) {
    mkdirSync(SHOTS, { recursive: true });
    await page.evaluate(() => document.fonts.ready);
    await tot.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await page.screenshot({ path: `${SHOTS}/gesamt-${info.project.name}.png` });
  }

  // «Wiegen»: the first bag without a number opens, the cursor stands in the field
  await tot.locator('[data-total-weigh]').click();
  const box = page.locator('[data-bag-weigh]').first();
  await expect(box.locator('[data-bag-weigh-input]')).toBeVisible();
  await expect(box.locator('[data-bag-weigh-input]')).toBeFocused();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/wiegen-${info.project.name}.png` });

  // the same way from the address #/pack?weigh
  await page.goto('./#/pack?weigh');
  await expect(page.locator('[data-bag-weigh-input]').first()).toBeVisible();
  expect(errors).toEqual([]);
});
