// Paket 4 (Noah 19.10.2026 «1a», «3a»): the house check and the list for the flat sitter on the sheet
// «Vor der Abfahrt», the shared sitter page, and «Bereit für morgen?» the evening before a tour.
// Fictional data only (test_data_gtp_), the clock on Friday 9 October 2026 09:00.
import { test, expect } from './clock.js';
import { openHome, homeFixture, tr, trip, day } from './home0460-fixture.js';

const T = tr('de');
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

async function open(page, context, info, startOffset) {
  const d = homeFixture();
  const id = 'test_data_gtp_Haus-Tour';
  d.tables.trips = [trip('Haus-Tour', day(startOffset), { days: 2, wx: { min: 2, max: 9, rain: 'rain' } }), ...d.tables.trips.filter((x) => !/TEST-Runde/.test(x.title))];
  await context.addInitScript((x) => localStorage.setItem('pack.currentTrip', x), id);
  await openHome(page, context, info, { data: d });
}

test('Before you leave: house check, own line, list for the sitter with QR and link', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, info, 1);
  await page.goto('./#/ride/abfahrt');
  const house = page.locator('[data-house]');
  await expect(house).toContainText(T('Stove and oven off'));
  await tap(house.getByLabel(T('Windows closed')), info);
  await expect(house).toContainText(T('{done} of {all}', { done: 1, all: 8 }));

  await tap(house.locator('[data-lines-edit]'), info);
  await house.locator('[data-lines-new]').fill('test_data_gtp_ Storen runter');
  await tap(house.locator('[data-lines-add]'), info);
  await tap(house.locator('[data-lines-done]'), info);
  await expect(house).toContainText('test_data_gtp_ Storen runter');
  await expect(house).toContainText(T('{done} of {all}', { done: 1, all: 9 }));

  const keeper = page.locator('[data-keeper]');
  await expect(keeper).toContainText(T('Water the plants'));
  await keeper.locator('[data-keeper-note]').fill('test_data_gtp_ Schlüssel bei den Nachbarn');
  await keeper.locator('[data-keeper-note]').blur();
  await tap(keeper.locator('[data-keeper-qr]'), info);
  await expect(keeper.locator('[data-keeper-qrcode] path')).toHaveAttribute('d', /M\d/);
  const href = await keeper.locator('[data-keeper-link]').getAttribute('href');
  expect(href).toContain('#/share/hueter/');
  expect(await noSideways(page)).toBe(0);

  await page.goto(`./${href.slice(href.indexOf('#'))}`);
  const sitter = page.locator('[data-hueter-page]');
  await expect(sitter).toContainText(T('Thank you for looking after the flat'));
  await expect(sitter).toContainText(T('Empty the letterbox'));
  await expect(sitter).toContainText('test_data_gtp_ Schlüssel bei den Nachbarn');
  expect(await noSideways(page)).toBe(0);
  expect(errors).toEqual([]);
});

test('Ready for tomorrow: on the evening before, hints from weather and charging', async ({ page, context }, info) => {
  await open(page, context, info, 1);
  await page.goto('./#/pack');
  const card = page.locator('[data-bereit]').first();
  await expect(card).toContainText(T('Ready for tomorrow?'));
  const m = card.locator('[data-morgen]');
  await expect(m.locator('[data-hint="cold"]')).toContainText(T('Cold morning, {n} °C: gloves and a warm layer on top.', { n: 2 }));
  await expect(m.locator('[data-hint="rain"]')).toBeVisible();
  await expect(m.locator('[data-hint="charge"]')).toBeVisible();
  // without the AI helper set up there is no button for it
  await expect(m.locator('[data-morgen-ask]')).toHaveCount(0);
});
