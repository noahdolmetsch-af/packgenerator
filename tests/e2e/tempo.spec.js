// Tempo (Noah 19.10.2026 «1a 2a 3a»): long lists draw only a first part, so typing and opening stay quick.
// - Material: a search shows five rows per category and «Noch n zeigen» (before: every hit at once, the
//   first letter drew ~650 rows and froze the phone).
// - Touren › Packmodus: 20 rows first (on a phone five), «Noch n Touren zeigen» adds 20 at a time.
import { test, expect } from './clock.js';
import { start, tr } from './gesamttest/lib.js';
import { SHOW_ROWS } from '../../src/lib/list/listen.js';
import { TOUR_ROWS, PHONE_ROWS } from '../../src/lib/touren/kurz.js';

const T = tr('de');

test('Material search: five rows per category and Show more', async ({ page, context }, info) => {
  test.setTimeout(180_000);
  await start(page, context, info);
  await page.goto('./#/gear');
  const box = page.locator('main input[type="search"]').first();
  await box.fill('e');
  const cats = page.locator('main section.cat');
  await expect(cats.first()).toBeVisible();
  const n = await cats.count();
  expect(n).toBeGreaterThan(1);
  let capped = null;
  for (let i = 0; i < n; i++) {
    const rows = await cats.nth(i).locator('ul.rows > li').count();
    expect(rows).toBeLessThanOrEqual(SHOW_ROWS + 1);
    if (!capped && (await cats.nth(i).locator('.allrows').count())) capped = cats.nth(i);
  }
  // a category with more hits opens all of them with one tap
  expect(capped).not.toBeNull();
  // centre it first: at the top edge the sticky search bar would cover it
  await capped.locator('.allrows').evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await capped.locator('.allrows').click();
  expect(await capped.locator('ul.rows > li').count()).toBeGreaterThan(SHOW_ROWS + 1);
  // a new search starts short again
  await box.fill('a');
  for (let i = 0; i < (await cats.count()); i++) expect(await cats.nth(i).locator('ul.rows > li').count()).toBeLessThanOrEqual(SHOW_ROWS + 1);
});

test('Trips: the list grows step by step', async ({ page, context }, info) => {
  test.setTimeout(180_000);
  await start(page, context, info);
  await page.goto('./#/trips');
  const open = page.locator('[data-packmode-open]');
  await expect(page.locator('[data-packmode-open], [data-packmode]').first()).toBeAttached({ timeout: 15_000 });
  if (await open.count()) await open.click();
  const pm = page.locator('[data-packmode]');
  const list = pm.locator('[data-trip-list] [data-row]');
  const more = pm.locator('[data-pack-phone-more]');
  const phone = info.project.name === 'phone';
  await expect(list).toHaveCount(phone ? PHONE_ROWS : TOUR_ROWS);
  // «Noch n Touren zeigen» names what the next tap adds: up to the next step of 20
  const added = async () => Number((await more.textContent()).match(/\d+/)[0]);
  const n = await added();
  expect(n).toBeLessThanOrEqual(phone ? TOUR_ROWS - PHONE_ROWS : TOUR_ROWS);
  await expect(more).toContainText(T(n === 1 ? 'Show {n} more trip' : 'Show {n} more trips').replace('{n}', String(n)));
  const before = await list.count();
  await more.click();
  await expect(list).toHaveCount(before + n);
  for (let i = 0; i < 30 && (await more.count()); i++) await more.click();
  await expect(more).toHaveCount(0);
  expect(await list.count()).toBeGreaterThan(TOUR_ROWS);
});
