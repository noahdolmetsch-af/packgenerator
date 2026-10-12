// v0.106.0 «Bausteine bearbeiten» (Noah 1-5a, 12.10.2026; mockups A and B): the evening-before check on
// «Gepackt» and the after-trip check on «Tour beendet»: tick, remove with Undo, add a row, save as the
// standard of the area; Today's evening row opens «Gepackt». Fictional data only (test_data_gtp_ records);
// labels from the app's German texts; the suggested rows are read from the page (checks.js is unit-tested).
import { test, expect } from '@playwright/test';
import { base, tr, mockWeather } from './home0460-fixture.js';
import { importAndSettle, settle } from './settle.js';

const T = tr('de');
const D0 = '2026-10-14';
const day = (n) => {
  const [y, m, d] = D0.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n, 12)).toISOString().slice(0, 10);
};
const ID = (s) => `test_data_gtp_${s}`;
const entries = (n, packed = 0) => base.tables.items.slice(3, 3 + n).map((i, k) => ({ itemId: i.id, slot: 'seat', qty: 1, packed: k < packed }));
const trip = (id, start, extra = {}) => ({
  id: ID(id), title: `test_data_gtp_ ${id}`, domain: 'bikepacking', startDate: start, days: 3, bikeId: 'bike-test', bike: 'test_data_gtp_ Scale',
  setup: { seat: 'bag-TA01', frame: 'bag-TA02', top: 'bag-TA03' }, entries: entries(6, 6), ready: [], status: 'planned', createdAt: `${day(-10)}T08:00:00.000Z`, ...extra,
});
function data(trips) {
  const d = structuredClone(base);
  d.tables.trips = trips;
  d.tables.debriefs = [];
  d.tables.notes = [];
  d.tables.settings = [{ key: 'homePlace', value: { name: 'test_data_gtp_ Heimort', lat: 47.39, lon: 8.04 } }];
  return d;
}
async function open(page, context, trips, { hour = 9 } = {}) {
  await context.route(/^https?:\/\/(?!localhost[:/])(?!.*open-meteo)/, (route) => route.abort());
  await mockWeather(context);
  await page.clock.setFixedTime(new Date(`${D0}T${String(hour).padStart(2, '0')}:00:00+02:00`));
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/');
  await importAndSettle(page, { name: 'checks.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data(trips))) });
  await page.goto('./#/');
  await settle(page);
}
const stored = (page, store, key) =>
  page.evaluate(([s, k]) => new Promise((done, fail) => {
    const req = indexedDB.open('pack-generator');
    req.onerror = fail;
    req.onsuccess = () => {
      const get = req.result.transaction(s).objectStore(s).get(k);
      get.onsuccess = () => { req.result.close(); done(get.result); };
    };
  }), [store, key]);
const go = async (page, hash) => {
  await page.goto(`./${hash}`);
  await page.reload();
  await settle(page);
};

test('«Gepackt»: the evening-before check ticks, removes with Undo, adds a row and saves it as the standard', async ({ page, context }) => {
  await open(page, context, [trip('Alpen', day(1))]);
  await go(page, `#/trip/${ID('Alpen')}/packed`);
  const card = page.locator('[data-check="eve"]');
  await expect(card.getByRole('heading', { name: T('Evening-before check') })).toBeVisible();
  const n = await card.locator('li').count();
  expect(n).toBeGreaterThan(2);
  const label = (k) => card.locator('li .ck span').nth(k).innerText();
  const first = await label(0);
  const second = await label(1);
  await expect(card.locator('[data-count]')).toHaveText(T('{done} of {n}', { done: 0, n }));
  // tick the first row: it is saved on the trip
  await card.getByRole('checkbox', { name: first }).check();
  await expect.poll(async () => (await stored(page, 'trips', ID('Alpen'))).eve?.[0]?.done).toBe(true);
  await expect(card.locator('[data-count]')).toHaveText(T('{done} of {n}', { done: 1, n }));
  // remove the second row, then take it back
  await card.getByRole('button', { name: T('Remove {name} from this list', { name: second }) }).click();
  await expect(card.locator('li')).toHaveCount(n - 1);
  await card.getByRole('button', { name: T('Undo') }).click();
  await expect(card.locator('li')).toHaveCount(n);
  // an own row, saved as the standard of the area
  await card.getByRole('textbox', { name: T('Add a row for this trip') }).fill('test_data_gtp_ Brot kaufen');
  await card.getByRole('button', { name: T('Add') }).click();
  await expect(card.locator('li').last()).toContainText('test_data_gtp_ Brot kaufen');
  await card.getByRole('button', { name: T('Save as standard for {area}', { area: T('Bikepacking') }) }).click();
  await expect.poll(async () => (await stored(page, 'settings', 'eveStandard'))?.value?.map((r) => r.label).at(-1)).toBe('test_data_gtp_ Brot kaufen');
  await page.reload();
  await expect(card.locator('li')).toHaveCount(n + 1);
});

test('«Tour beendet»: the after-trip check of the area comes before the debrief', async ({ page, context }) => {
  await open(page, context, [trip('Jura', day(-3), { status: 'planned', finished: day(-1) })]);
  await go(page, `#/trip/${ID('Jura')}/ended`);
  const card = page.locator('[data-check="after"]');
  await expect(card.getByRole('heading', { name: T('After-trip check') })).toBeVisible();
  await expect(card.locator('li').first()).toBeVisible();
  await card.getByRole('checkbox').first().check();
  await expect.poll(async () => (await stored(page, 'trips', ID('Jura'))).after?.filter((r) => r.done).length).toBe(1);
  await expect(page.locator('main .mainbar .btn.hi')).toHaveText(T('Continue to Debrief'));
});

test('Today at 19:00 the evening before: the reminder opens «Gepackt» with the check', async ({ page, context }) => {
  await open(page, context, [trip('Herbst', day(1))], { hour: 19 });
  const row = page.locator('[data-row="eve"]');
  await expect(row).toContainText(T('Your evening-before check is waiting.'));
  await row.click();
  await expect(page).toHaveURL(new RegExp(`#/trip/${ID('Herbst')}/packed$`));
  await expect(page.locator('[data-check="eve"]')).toBeVisible();
});
