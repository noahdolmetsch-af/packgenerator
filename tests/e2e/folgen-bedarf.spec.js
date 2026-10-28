// Paket B «Touren ohne Überraschung» part 2 (Noah 24.10.2026, 996 Ideen «1b»): in Packen › Add material
// «Vorher ansehen, was sich ändert» (things, grams, bags, earlier trips before a block is added) and
// «Nach Bedürfnis packen» (needs filled from your gear, people, three variants). Fictional data only
// (test_data_gtp_), the clock on Friday 9 October 2026 (home0460-fixture.js), every outside address blocked.
import { test, expect } from './clock.js';
import { openHome, homeFixture, tr, trip, day } from './home0460-fixture.js';

const T = tr('de');
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const TRIP = 'test_data_gtp_Bedarf-Tour';
const own = (id, name, sets, weightG, category) => ({ id: `test_data_gtp_${id}`, name: `test_data_gtp_ ${name}`, category, weightG, qty: 1, weightStatus: 'measured', defaultBag: 'seat', ownership: 'owned', role: null, sets, kits: [], domains: ['bikepacking'] });

function data() {
  const d = homeFixture();
  d.tables.items = [
    ...d.tables.items,
    own('rainpants', 'Regenhose', ['rain'], 180, 'rain'),
    own('overshoes', 'Überschuhe', ['rain'], 120, 'shoes'),
    own('down', 'Daunenschlafsack', ['bivy'], 600, 'sleep'),
    own('synth', 'Kunstfaserschlafsack', ['bivy'], 1100, 'sleep'),
    own('stove', 'Kocher', ['cook'], 300, 'kitchen'),
  ];
  d.tables.trips = [trip('Bedarf-Tour', day(6), { days: 3 }), ...d.tables.trips];
  return d;
}

async function openAdd(page, context, info) {
  await context.addInitScript((id) => localStorage.setItem('pack.currentTrip', id), TRIP);
  await openHome(page, context, info, { data: data() });
  await page.goto('./#/pack');
  await tap(page.getByRole('button', { name: T('Add material') }).first(), info);
  return page.getByRole('dialog', { name: T('Add material') });
}

test('Folgen vorher sehen: things, grams and bags before a block, then add it', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const sheet = await openAdd(page, context, info);
  await tap(sheet.locator('[data-block-preview]'), info);
  const fx = page.locator('[data-block-effects]');
  await expect(fx).toBeVisible();
  const rain = fx.locator('[data-effect="rain"]');
  await expect(rain).toContainText('test_data_gtp_ Regenhose');
  await expect(rain).toContainText('+300 g');
  await expect(rain.locator('[data-effect-history]')).toContainText(/früheren Touren|Rückblick/);
  expect(await noSideways(page)).toBe(0);
  await tap(rain.getByRole('button', { name: /hinzufügen/ }), info);
  await expect(fx).toHaveCount(0);
  await expect(page.locator('.blocknote')).toContainText('2');
  expect(errors).toEqual([]);
});

test('Nach Beduerfnis packen: needs, people, variants, onto the list', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const sheet = await openAdd(page, context, info);
  await tap(sheet.locator('[data-needs-open]'), info);
  const nd = page.locator('[data-needs]');
  await tap(nd.locator('[data-need="sleepwarm"]'), info);
  await tap(nd.locator('[data-need="cook"]'), info);
  await tap(nd.getByRole('button', { name: T('One person more') }), info);
  await expect(nd.locator('[data-people]')).toHaveText('2');
  // light: the down bag twice (2 people) and the stove once (shared)
  await expect(nd.locator('[data-need-row="sleepwarm"]')).toContainText('2× test_data_gtp_ Daunenschlafsack');
  await expect(nd.locator('[data-need-row="cook"]')).toContainText(T('shared, once'));
  await expect(nd.locator('[data-variant="comfort"]')).toContainText('+1 kg');
  await tap(nd.locator('[data-variant="comfort"]'), info);
  await expect(nd.locator('[data-need-row="sleepwarm"]')).toContainText('test_data_gtp_ Kunstfaserschlafsack');
  expect(await noSideways(page)).toBe(0);
  await tap(nd.locator('[data-needs-take]'), info);
  await expect(nd).toHaveCount(0);
  const saved = await page.evaluate(async (id) => {
    const req = indexedDB.open('pack-generator');
    const db = await new Promise((r) => (req.onsuccess = () => r(req.result)));
    const tr = await new Promise((r) => { const g = db.transaction('trips').objectStore('trips').get(id); g.onsuccess = () => r(g.result); });
    return { people: tr.people, needs: tr.needs, e: tr.entries.filter((x) => /synth|stove/.test(x.itemId)).map((x) => [x.itemId, x.qty]) };
  }, TRIP);
  expect(saved).toEqual({ people: 2, needs: ['sleepwarm', 'cook'], e: [['test_data_gtp_synth', 2], ['test_data_gtp_stove', 1]] });
  expect(errors).toEqual([]);
});
