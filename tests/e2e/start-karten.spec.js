// Start-Karten ST1/ST2 (Noah 14.10.2026, App-Start 2b/3b, «1a 2a 3b»): Today no longer jumps to On the way
// or «Tour beendet»; a card with the trip card leads there. The ride card goes away once On the way was open.
import { test, expect } from './clock.js';
import { openHome, homeFixture, trip, entries, day } from './home0460-fixture.js';

function data(kind) {
  const d = homeFixture();
  const T = d.tables;
  T.trips = T.trips.filter((x) => !x.id.endsWith('Herbstrunde') && !x.id.endsWith('TEST-Runde'));
  const start = kind === 'ride' ? day(0) : day(-1);
  T.trips.unshift(trip('Herbstrunde', start, { days: 2, entries: entries(6, 6), packedAt: start }));
  return d;
}
const noErrors = (page) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
};

test('ST1: on a trip day Today stays, the card leads to On the way and then goes away (3b)', async ({ page, context }, info) => {
  const errors = noErrors(page);
  const T = await openHome(page, context, info, { data: data('ride'), hour: 9 });
  await expect(page).toHaveURL(/#\/$/);
  const card = page.locator('[data-startkarte="ride"]');
  await expect(card).toContainText(T('On the way today'));
  await expect(card).toContainText(T('Day {n} of {total}', { n: 1, total: 2 }));
  await expect(card).toContainText('test_data_gtp_ Herbstrunde');
  // the card stands with the trip card, before it
  expect(await card.evaluate((el) => !!el.nextElementSibling?.matches('[data-section="trip"]'))).toBe(true);
  await card.getByText(T('Open On the way')).click();
  await expect(page).toHaveURL(/#\/ride$/);
  // Tempo (19.10.2026): On the way loads on its first visit; it notes the visit once it is there
  await expect(page.locator('html')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  await expect(page.locator('main h1').first()).toBeVisible();
  await page.goto('./#/');
  await expect(page.locator('section[data-section="trip"]').first()).toBeVisible();
  await expect(card).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('ST2: on the last evening Today stays, the evening card leads to the trip ended page', async ({ page, context }, info) => {
  const errors = noErrors(page);
  const T = await openHome(page, context, info, { data: data('evening'), hour: 19 });
  await expect(page).toHaveURL(/#\/$/);
  const card = page.locator('[data-startkarte="evening"]');
  await expect(card).toContainText(T('Last evening'));
  // 2a: the card replaces the small line «Letzter Abend» at the top
  await expect(page.locator('[data-row="last"]')).toHaveCount(0);
  await card.getByText(T('Finish the trip')).click();
  await expect(page).toHaveURL(/#\/trip\/test_data_gtp_Herbstrunde\/ended$/);
  expect(errors).toEqual([]);
});
