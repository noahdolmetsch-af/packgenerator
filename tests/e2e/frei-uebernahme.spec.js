// «Fürs nächste Mal» › «In Packliste übernehmen» (Noah 05.11.2026 «8b»): the notes of the page go onto the
// packing list of the next trip, with Undo. German, phone 390 and computer 1440, fictional data only.
// The clock stands on Friday 9 October 2026 (home0460-fixture); SHOTS=<folder> saves screenshots.
import { test, expect } from './clock.js';
import { homeFixture, openHome, day } from './home0460-fixture.js';

const stored = (page, table, id) =>
  page.evaluate(([table, id]) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(table).objectStore(table).get(id);
      q.onsuccess = () => { r.result.close(); ok(q.result ?? null); };
    };
  }), [table, id]);
const count = (page, table) =>
  page.evaluate((table) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(table).objectStore(table).count();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), table);
async function shot(page, info, name) {
  if (!process.env.SHOTS) return;
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
}

const mark = (id, key, name, pile, reason = '') => ({ id, kind: 'mark', key, name, pile, reason, day: day(-2), at: `${day(-2)}T18:00:00.000Z` });
const data = (extra = {}) => {
  const d = homeFixture();
  d.tables.frei = [
    mark('test_data_gtp_m1', 'item:RA01', 'Rain jacket', 'missing', 'it rained on the pass'),
    mark('test_data_gtp_m2', 'name:test_data_gtp_ sonnencreme', 'test_data_gtp_ Sonnencreme', 'missing'),
    mark('test_data_gtp_m3', 'item:ON01', 'Bib shorts', 'unused'),
    mark('test_data_gtp_m4', 'item:LI01', 'Front light', 'proven'),
  ];
  Object.assign(d.tables, extra);
  return d;
};
const sizes = (page, info) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

test('one tap puts a note on the packing list of the next trip; Undo takes it back', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data() });
  await page.goto('./#/me/frei/naechstes');
  await expect(page.locator('[data-marks]')).toBeVisible();
  // the next trip is the one that is offered, and it is the one tomorrow
  await expect(page.locator('[data-take-trip] option:checked')).toHaveText('test_data_gtp_ Herbstrunde');
  await shot(page, info, 'uebernahme-1-vorher');
  const before = (await stored(page, 'trips', 'test_data_gtp_Herbstrunde')).entries.length;
  await page.locator('[data-mark="item:RA01"] [data-mark-take]').click();
  await expect(page.locator('[data-mark="item:RA01"] [data-mark-on]')).toContainText('test_data_gtp_ Herbstrunde');
  await expect(page.locator('[data-mark="item:RA01"] [data-mark-take]')).toHaveCount(0);
  const after = await stored(page, 'trips', 'test_data_gtp_Herbstrunde');
  expect(after.entries.length).toBe(before + 1);
  expect(after.entries.some((e) => e.itemId === 'RA01' && e.packed === false)).toBe(true);
  // Undo in the toast
  await page.getByRole('button', { name: /Rückgängig/ }).first().click();
  expect((await stored(page, 'trips', 'test_data_gtp_Herbstrunde')).entries.length).toBe(before);
  await expect(page.locator('[data-mark="item:RA01"] [data-mark-take]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Put all on the packing list: a new thing, a planning note for just came along, a link to the list', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: data() });
  await page.goto('./#/me/frei/naechstes');
  const items0 = await count(page, 'items');
  await page.locator('[data-take-all]').click();
  const trip = await stored(page, 'trips', 'test_data_gtp_Herbstrunde');
  expect(await count(page, 'items')).toBe(items0 + 1); // the sun cream
  expect(trip.entries.some((e) => e.itemId === 'RA01')).toBe(true);
  expect(trip.entries.some((e) => e.itemId === 'ON01')).toBe(true); // nothing is taken off
  expect(trip.planNotes.map((n) => n.text)).toEqual(['Bib shorts nächstes Mal zu Hause lassen']);
  for (const k of ['item:RA01', 'name:test_data_gtp_ sonnencreme', 'item:ON01', 'item:LI01']) await expect(page.locator(`[data-mark="${k}"] [data-mark-on]`)).toBeVisible();
  await expect(page.locator('[data-take-next]')).toBeVisible();
  expect(await sizes(page, info)).toBe(true);
  await shot(page, info, 'uebernahme-2-nachher');
  await page.locator('[data-take-open]').click();
  await expect(page).toHaveURL(/#\/pack$/);
  expect(errors).toEqual([]);
});

test('without a trip the page says so and points to the trips', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: data({ trips: [], debriefs: [] }) });
  await page.goto('./#/me/frei/naechstes');
  await expect(page.locator('[data-take-none]')).toBeVisible();
  await expect(page.locator('[data-take-none] a')).toHaveAttribute('href', '#/trips');
  await expect(page.locator('[data-take-all]')).toHaveCount(0);
  await shot(page, info, 'uebernahme-3-ohne-tour');
});
