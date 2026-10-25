// Paket B «Touren ohne Überraschung», more single ideas (Noah 24.10.2026, 996 Ideen «1b»): the key and the parts taken
// off the parked bike, «get in touch by» before no signal, options to compare on Reise-Links, a small taste of a dream
// tour, a warranty claim draft. Fictional data only (test_data_gtp_), the clock on Friday 9 October 2026
// (home0460-fixture.js), every outside address blocked.
import { test, expect } from '@playwright/test';
import { openHome, homeFixture, tr, trip, day } from './home0460-fixture.js';

const T = tr('de');
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const setting = (page, key) =>
  page.evaluate((k) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('settings').objectStore('settings').get(k);
      q.onsuccess = () => { r.result.close(); ok(q.result?.value); };
    };
  }), key);
const RUN = 'test_data_gtp_Jura-Ost';

function data() {
  const d = homeFixture();
  d.tables.trips = [trip('Jura-Ost', day(-1), { days: 3, stays: [{ n: 1, name: 'test_data_gtp_ Hütte', until: '22:00', phone: '+41 32 000 00 00', callBy: '23:59' }] }), ...d.tables.trips.filter((x) => !/Herbstrunde|TEST-Runde/.test(x.title))];
  d.tables.bikes = d.tables.bikes.map((b) => (b.id === 'bike-test' ? { ...b, bought: day(-200) } : b));
  d.tables.settings.push({ key: 'dreams', value: { dreams: [{ id: 'test_data_gtp_d1', title: 'test_data_gtp_ Nordkap', kind: null, days: 20, note: '', url: '', at: `${day(-30)}T08:00:00.000Z` }] } });
  return d;
}
async function open(page, context, info) {
  await context.addInitScript((id) => localStorage.setItem('pack.currentTrip', id), RUN);
  return openHome(page, context, info, { data: data() });
}

test('Parked bike: the key and what came off; tonight: get in touch by', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, info);
  await page.goto('./#/ride');
  await expect(page.locator('[data-ride-door] [data-ride-callby]')).toContainText('23:59');
  await tap(page.locator('[data-uw-helpers] [data-uw-parked]'), info);
  const dlg = page.locator('dialog[data-parked]');
  await dlg.locator('[data-parked-keyin]').fill('test_data_gtp_ roter Ring');
  await tap(dlg.locator('[data-parked-offpick="Lights"]'), info);
  await tap(dlg.locator('[data-parked-offpick="Bike computer"]'), info);
  await tap(dlg.locator('[data-parked-save]'), info);
  await expect(dlg.locator('[data-parked-key]')).toContainText('test_data_gtp_ roter Ring');
  await expect(dlg.locator('[data-parked-off]')).toContainText(T('Bike computer'));
  expect(await noSideways(page)).toBe(0);
  expect(errors).toEqual([]);
});

test('Reise-Links: options to compare, one chosen, one dropped with a reason', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, info);
  await page.goto('./#/travel');
  const box = page.locator('[data-travel-choices]');
  for (const [name, price] of [['test_data_gtp_ Hotel Post', '120'], ['test_data_gtp_ Hostel', '45']]) {
    await tap(box.locator('[data-choice-new]'), info);
    const sheet = page.getByRole('dialog');
    await sheet.locator('[data-field="name"]').fill(name);
    await sheet.locator('[data-field="price"]').fill(price);
    if (price === '120') await sheet.locator('[data-field="cancelBy"]').fill(day(2));
    await tap(sheet.getByRole('button', { name: T('Save') }), info);
    await expect(box.locator(`[data-choice="${name}"]`)).toBeVisible();
  }
  await expect(box.locator('[data-choice="test_data_gtp_ Hotel Post"] [data-choice-cancel]')).toHaveClass(/soon/);
  await tap(box.locator('[data-choice="test_data_gtp_ Hotel Post"] [data-choice-pick]'), info);
  await expect(box.locator('[data-choice="test_data_gtp_ Hotel Post"] [data-choice-pick]')).toHaveAttribute('aria-pressed', 'true');
  await tap(box.locator('[data-choice="test_data_gtp_ Hostel"] [data-choice-drop]'), info);
  await page.getByRole('dialog').locator('[data-field="why"]').fill('test_data_gtp_ zu laut');
  await tap(page.getByRole('dialog').getByRole('button', { name: T('Save') }), info);
  await expect(box.locator('[data-choice="test_data_gtp_ Hostel"]')).toHaveCount(0);
  await expect(box.locator('[data-choice-dropped="test_data_gtp_ Hostel"]')).toContainText('test_data_gtp_ zu laut');
  await expect.poll(async () => ((await setting(page, 'travel.choices')) || []).map((c) => c.state)).toEqual(['chosen', 'dropped']);
  expect(await noSideways(page)).toBe(0);
  expect(errors).toEqual([]);
});

test('Dream tour: a small taste becomes its own trip; the dream stays a dream', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, info);
  await page.goto('./#/trips/dreams');
  await tap(page.locator('[data-dream="test_data_gtp_d1"] button.open'), info);
  const dlg = page.locator('dialog.dsheet');
  await dlg.locator('[data-dream-taste]').fill('test_data_gtp_ eine Nacht im Jura');
  await tap(dlg.locator('[data-dream-taste-plan]'), info);
  const plan = page.getByRole('dialog').last();
  await expect(plan.locator('input').first()).toHaveValue(T('Taste of {name}', { name: 'test_data_gtp_ Nordkap' }));
  expect(errors).toEqual([]);
});

test('Warranty: a claim draft to check and send yourself', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, info);
  await page.goto('./#/bikes?bike=bike-test&sheet=warranty');
  const claim = page.locator('[data-claim]');
  await tap(claim.locator('[data-claim-open]'), info);
  await claim.locator('[data-claim-part]').selectOption({ index: 1 });
  await claim.locator('[data-claim-what]').fill('test_data_gtp_ Freilauf rutscht');
  await claim.locator('[data-claim-what]').blur();
  await expect(claim.locator('[data-claim-text]')).toContainText(T('What happens: {what}', { what: 'test_data_gtp_ Freilauf rutscht' }));
  await expect(claim.locator('[data-claim-text]')).toContainText(T('Warranty claim, draft'));
  expect(await noSideways(page)).toBe(0);
  expect(errors).toEqual([]);
});
