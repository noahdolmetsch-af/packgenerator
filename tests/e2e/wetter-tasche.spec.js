// Packvorschläge nach Wetter und Lieblingsteilen pro Tasche (Noah 24.11.2026 «1-5»): under a bag title one calm line names what
// the weather asks for in this bag and is not packed yet; a tap adds it (Undo in the message), × stops suggesting it.
// German UI, fictional data (test_data_gtp_).
import { test, expect } from './clock.js';
import { openHome, homeFixture } from './home0460-fixture.js';

const P = 'test_data_gtp_';
const item = (id, name, f = {}) => ({ id, name: `${P} ${name}`, category: 'clothing', weightG: 120, qty: 1, weightStatus: 'measured', defaultBag: 'seat', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'], ...f });
const JACKET = item('WT01', 'Regenjacke', { rain: 'yes', defaultBag: 'seat' });
const COVERS = item('WT02', 'Ueberschuhe', { rain: 'yes', defaultBag: 'seat', favorite: true });
const TRIP = `${P}Herbstrunde`;
const fixture = () => {
  const data = homeFixture();
  const T = data.tables;
  T.items.push(JACKET, COVERS);
  const trip = T.trips.find((x) => x.id === TRIP);
  trip.wx = { min: 8, max: 12, rain: 'rain' };
  trip.overnight = null; // no context: the weather is a suggestion, not applied by itself
  trip.entries = trip.entries.filter((e) => ![JACKET.id, COVERS.id].includes(e.itemId));
  return data;
};
const rows = (page, id) => page.evaluate(([s, k]) => new Promise((ok) => {
  const q = indexedDB.open('pack-generator');
  q.onsuccess = () => { const r = q.result.transaction(s).objectStore(s).get(k); r.onsuccess = () => { q.result.close(); ok(r.result); }; };
}), ['trips', id]);

test('Weather per bag - the line names the pieces, a tap adds with Undo, x stops the suggestion', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: fixture() });
  await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), TRIP);
  await page.goto('./#/pack');
  const line = page.locator('[data-wx-bag]').first();
  await expect(line).toBeVisible();
  await expect(line).toContainText('Fürs Wetter noch in diese Tasche');
  await expect(line.locator(`[data-wx-add="${COVERS.id}"]`)).toBeVisible();
  // the favourite stands first
  const adds = line.locator('[data-wx-add]');
  await expect(adds.first()).toHaveAttribute('data-wx-add', COVERS.id);
  for (const b of await adds.all()) expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  // tap: packed in the bag, the line loses it, Undo brings it back
  await adds.first().click();
  await expect.poll(async () => (await rows(page, TRIP)).entries.some((e) => e.itemId === COVERS.id)).toBe(true);
  await expect(page.locator(`[data-wx-add="${COVERS.id}"]`)).toHaveCount(0);
  await page.getByRole('button', { name: 'Rückgängig' }).first().click();
  await expect.poll(async () => (await rows(page, TRIP)).entries.some((e) => e.itemId === COVERS.id)).toBe(false);
  await expect(page.locator(`[data-wx-add="${COVERS.id}"]`)).toBeVisible();
  // x: not suggested again on this trip
  await page.locator(`[data-wx-skip="${JACKET.id}"]`).click();
  await expect.poll(async () => (await rows(page, TRIP)).layerPick?.[JACKET.id]).toBe('none');
  await expect(page.locator(`[data-wx-add="${JACKET.id}"]`)).toHaveCount(0);
  expect(errors).toEqual([]);
});
