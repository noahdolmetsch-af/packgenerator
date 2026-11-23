// K3 «Taschen am Starttag wiegen» (Noah 23.11.2026): the packed bag on the scale, one number; the app compares it
// with its calculation, says where to look, and the number can be changed, removed and brought back. Fictional data.
import { test, expect } from './clock.js';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const wide = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);

test('Weigh a bag: number, comparison, change, remove, undo', async ({ page, context }, info) => {
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
  // the fixture trip lies in the past (a fixed trip has no weighing): reopen it
  await page.locator('.list-menu summary').click();
  await page.locator('.tz2-reopen').click();
  await page.locator('dialog[open] button.hi', { hasText: T('Reopen') }).click();
  await expect(page.locator('.tz2-reopen')).toHaveCount(0);
  const heads = page.locator('section.bag-group .bag-heading');
  await expect(heads.first()).toBeVisible();
  for (let i = 0; i < (await heads.count()); i++) if ((await heads.nth(i).getAttribute('aria-expanded')) !== 'true') await heads.nth(i).click();
  const bw = page.locator('[data-bag-weigh]').first();
  await bw.scrollIntoViewIfNeeded();
  await expect(bw.getByLabel(T('Packed bag on the scale (g)'))).toBeVisible();

  // a wrong text is said kindly
  await bw.locator('[data-bag-weigh-input]').fill('abc');
  await bw.locator('[data-bag-weigh-save]').click();
  await expect(bw.getByText(T('Type the weight in grams, e.g. 1850.'))).toBeVisible();

  // far above the calculation: the question where to look
  await bw.locator('[data-bag-weigh-input]').fill('9000');
  await bw.locator('[data-bag-weigh-save]').click();
  const line = bw.locator('[data-bag-weigh-result]');
  await expect(line).toBeVisible();
  await expect(line).toContainText(/mehr als die Rechnung|kann noch nichts sagen/);
  expect(await wide(page)).toBeLessThanOrEqual(0);
  if (process.env.BAGSHOT_DIR) await bw.locator('xpath=ancestor::section[contains(@class,"bag-group")]').screenshot({ path: `${process.env.BAGSHOT_DIR}/k3-weigh-${info.project.name}.png` });

  // far below: less than the calculation
  await bw.locator('[data-bag-weigh-edit]').click();
  await bw.locator('[data-bag-weigh-input]').fill('50');
  await bw.locator('[data-bag-weigh-save]').click();
  await expect(bw.locator('[data-bag-weigh-result]')).toContainText(/weniger als die Rechnung/);

  // it stays after opening the page again
  await page.reload();
  await expect(page.locator('.calm-pack')).toBeVisible();
  const heads2 = page.locator('section.bag-group .bag-heading');
  await expect(heads2.first()).toBeVisible();
  for (let i = 0; i < (await heads2.count()); i++) if ((await heads2.nth(i).getAttribute('aria-expanded')) !== 'true') await heads2.nth(i).click();
  const bw2 = page.locator('[data-bag-weigh]').first();
  await expect(bw2.locator('[data-bag-weigh-result]')).toContainText(/weniger als die Rechnung/);

  // remove, then Undo brings it back
  await bw2.locator('[data-bag-weigh-remove]').click();
  await expect(bw2.locator('[data-bag-weigh-input]')).toBeVisible();
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect(bw2.locator('[data-bag-weigh-result]')).toBeVisible();
  expect(errors).toEqual([]);
});
