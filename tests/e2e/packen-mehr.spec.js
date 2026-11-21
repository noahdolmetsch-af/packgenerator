// «Vereinfachen ohne Verlust» Schritt 2 (Noah 07.11.2026 «1a 2a 3a 4b 5a»): Packen shows the packing list first and the
// rest of a trip in five closed groups under «Mehr zu dieser Tour». For a real user they are closed (the other specs
// run with 'pg.packmore' = 'open', playwright.config.js); this spec tests that default, that a tap opens a group with
// the functions inside, and that nothing hides in a closed group. Fictional data only (test_data_gtp_), clock of home0460-fixture.js.
import { test, expect } from './clock.js';
import { openHome, homeFixture, tr, trip, day } from './home0460-fixture.js';

const T = tr('de');
const PLAN = 'test_data_gtp_Alpen-Plan';
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

function data() {
  const d = homeFixture();
  d.tables.trips = [trip('Alpen-Plan', day(4), { days: 2 }), ...d.tables.trips.filter((x) => !/Herbstrunde|TEST-Runde/.test(x.title))];
  return d;
}

test('Packen: the packing list first, five closed groups under More about this trip, a tap opens one', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.addInitScript((id) => { localStorage.setItem('pack.currentTrip', id); localStorage.removeItem('pg.packmore'); }, PLAN);
  await openHome(page, context, info, { data: data(), hour: 9 });
  await page.goto('./#/pack');

  const more = page.locator('[data-pack-more]');
  await expect(more).toBeVisible();
  await expect(more.getByRole('heading', { name: T('More about this trip') })).toBeVisible();
  expect(await noSideways(page)).toBe(0);

  // closed by default: the functions are in the page but not shown
  const groups = more.locator('details[data-morefold]');
  await expect(groups.first()).toBeVisible();
  expect(await groups.count()).toBeGreaterThanOrEqual(4);
  for (const g of await groups.all()) await expect(g).not.toHaveAttribute('open', '');
  await expect(page.locator('[data-door-planb]')).toBeHidden();
  await expect(page.locator('[data-two]')).toBeHidden();

  // a tap on the group shows what is inside
  const weather = more.locator('details[data-morefold="weather"]');
  await expect(weather.locator(':scope > summary')).toContainText(T('Weather and warnings'));
  await weather.locator(':scope > summary').click();
  await expect(page.locator('[data-door-planb]')).toBeVisible();

  const others = more.locator('details[data-morefold="others"]');
  await expect(others.locator(':scope > summary')).toContainText(T('With others'));
  await others.locator(':scope > summary').click();
  await expect(page.locator('[data-two]')).toBeVisible();
  await expect(page.locator('[data-two] summary')).toContainText(T('Packing for two'));

  expect(errors).toEqual([]);
});
