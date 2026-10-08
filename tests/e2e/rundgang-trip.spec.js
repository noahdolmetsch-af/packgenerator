// Rundgang (user journey) fixes in the trip screens, German UI, phone and desktop:
// L2  open weather suggestions on top of Plan; "Next: Pack" asks once while some are undecided.
// L7  the debrief opens from the trip's last day; before the start On the way leads back to Pack.
// L9  New trip without a bike adds one inline; a trip without any gear lands in a friendly empty Plan.
// Fictional fixture plus test_data_gtp_ items, bikes and trips; nothing leaves the preview server.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const day = (n) => {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Zurich' }));
  d.setDate(d.getDate() + n);
  return iso(d);
};
const MARK = { key: 'test_data_gtp_marker', value: 1 };
const item = (id, name, f) => ({ id, name: `test_data_gtp_ ${name}`, category: 'clothing', weightG: 120, qty: 1, weightStatus: 'measured', defaultBag: 'seat', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'], ...f });
const trip = (id, title, f) => ({ id, domain: 'bikepacking', title: `test_data_gtp_ ${title}`, days: 1, bikeId: 'bike-test', bike: 'Test gravel bike', setup: { seat: 'bag-TA01', frame: 'bag-TA02', top: 'bag-TA03' }, entries: [{ itemId: 'TO01', slot: 'frame', qty: 1, packed: false }], ready: [], status: 'planned', hours: 2, overnight: 'none', ...f });

/** The fixture as a backup file: `empty` drops every bike, bag and item (a fresh start without gear). */
function fixture(path, { trips = [], items = [], empty = false } = {}) {
  const data = structuredClone(base);
  if (empty) {
    data.tables.items = [];
    data.tables.bikes = [];
    data.tables.containers = [];
  }
  data.tables.items.push(...items);
  data.tables.trips.push(...trips);
  data.tables.settings.push(MARK);
  writeFileSync(path, JSON.stringify(data));
}

async function start(page, context, info, opts = {}) {
  const file = info.outputPath('rundgang-trip.json');
  fixture(file, opts);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await expect.poll(async () => (await table(page, 'settings')).some((s) => s.key === MARK.key)).toBe(true);
}

const table = (page, name) =>
  page.evaluate((s) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(s).objectStore(s).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);

const sideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
/** No sideways scroll at the project's width, and on the phone also at 320 px (then back). */
async function fits(page, info) {
  expect(await sideways(page)).toBe(0);
  if (info.project.name !== 'phone') return;
  const size = page.viewportSize();
  await page.setViewportSize({ width: 320, height: size.height });
  await expect.poll(() => sideways(page)).toBe(0);
  await page.setViewportSize(size);
}
/** RG_SHOTS=<folder> saves screenshots there (never into the repo). */
const shot = (page, info, name) => process.env.RG_SHOTS && page.screenshot({ path: `${process.env.RG_SHOTS}/${name}-${info.project.name}.png` });
const goButton = (page) => page.locator('.trip-band .act .go');

test('L2: open suggestions on top of Plan; "Next: Pack" asks once, the Pack tab never', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // Cold (4–12 °C): arm warmers, wind vest and long gloves are suggested, none of them on the list yet.
  const cold = [item('GTPA', 'Armlinge', { coldBelow: 14 }), item('GTPB', 'Windweste', { coldBelow: 12 }), item('GTPC', 'Handschuhe lang', { coldBelow: 10 }), item('GTPD', 'Überschuhe', { coldBelow: 8 })];
  await start(page, context, info, { items: cold, trips: [trip('gtp-l2', 'Kalt', { startDate: day(5), days: 2, overnight: 'lodging', wx: { min: 4, max: 12, rain: 'none' } })] });
  await page.goto('./#/pack');
  const fold = page.getByRole('button', { name: new RegExp(esc(T('Review weather suggestions'))) });
  await expect(fold).toContainText(T('{n} open', { n: 4 }));
  await expect(fold).toHaveClass(/open-work/);
  await shot(page, info, 'l2-plan');
  // Right under the trip fields, before the packing list (in the page's order).
  const order = await page.evaluate(() => {
    const f = document.querySelector('.fold-btn.detail-link');
    const cond = document.querySelector('section.cond');
    const list = document.querySelector('.list-head h2');
    return [!!(cond.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING), !!(f.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING)];
  });
  expect(order).toEqual([true, true]);
  await fits(page, info);

  // The Pack tab itself does not ask.
  await page.locator('.trip-band .steps a').nth(1).click();
  await expect(page).toHaveURL(/#\/pack\?day/);
  await expect(page.locator('dialog.ask-sheet')).toHaveCount(0);
  await page.goto('./#/pack');

  // "Next: Pack" asks: n open, the first three names, then "Decide now" opens Still to decide.
  await expect(goButton(page)).toHaveText(T('Next: Pack'));
  await goButton(page).click();
  const ask = page.locator('dialog.ask-sheet');
  await expect(ask.getByRole('heading', { name: T('{n} suggestions still open', { n: 4 }) })).toBeVisible();
  await expect(ask).toContainText(T('{names} are not on the list yet.', { names: 'test_data_gtp_ Armlinge, test_data_gtp_ Windweste, test_data_gtp_ Handschuhe lang …' }));
  await fits(page, info);
  await shot(page, info, 'l2-ask');
  await ask.getByRole('button', { name: T('Decide now') }).click();
  await expect(page.locator('section.review').getByRole('heading', { name: T('Still to decide') })).toBeVisible();
  await expect(page).toHaveURL(/#\/pack$/);
  await page.locator('section.review').getByRole('button', { name: T('Back'), exact: true }).click();

  // Asked once: the second tap goes straight to Pack.
  await goButton(page).click();
  await expect(page).toHaveURL(/#\/pack\?day/);
  await expect(page.locator('dialog.ask-sheet')).toHaveCount(0);

  // After a reload it asks again; "Pack without them" goes to Pack and changes nothing on the list.
  await page.goto('./#/pack');
  await page.reload();
  await goButton(page).click();
  await page.locator('dialog.ask-sheet').getByRole('button', { name: T('Pack without them') }).click();
  await expect(page).toHaveURL(/#\/pack\?day/);
  const [tr] = await table(page, 'trips');
  expect(tr.entries.map((e) => e.itemId).filter((id) => id.startsWith('GTP'))).toEqual([]);
  expect(errors).toEqual([]);
});

test('L2: a trip without open suggestions goes straight to Pack', async ({ page, context }, info) => {
  await start(page, context, info, { trips: [trip('gtp-l2b', 'Warm', { startDate: day(5), days: 2, overnight: 'lodging', wx: { min: 18, max: 26, rain: 'none' } })] });
  await page.goto('./#/pack');
  await expect(page.getByRole('button', { name: new RegExp(esc(T('Review weather suggestions'))) })).not.toHaveClass(/open-work/);
  await goButton(page).click();
  await expect(page).toHaveURL(/#\/pack\?day/);
  await expect(page.locator('dialog.ask-sheet')).toHaveCount(0);
});

test('L7: no debrief before the last day; On the way before the start leads back to Pack', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info, { trips: [trip('gtp-l7', 'Später', { startDate: day(10), days: 2 })] });
  await page.goto('./#/debrief/gtp-l7');
  const end = new Date(`${day(11)}T12:00:00`).toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'long' });
  await expect(page.getByRole('heading', { name: T('Debrief from {date}', { date: end }) })).toBeVisible();
  await expect(page.getByRole('button', { name: T('Save debrief') })).toHaveCount(0);
  await expect(goButton(page)).toHaveText(T('Back to packing'));
  await fits(page, info);
  await shot(page, info, 'l7-debrief');
  // "Trip is off" is the Plan's "Not riding" (skipped); it can be taken back.
  await page.getByRole('button', { name: T('Trip is off') }).click();
  await expect(page.locator('.early .tp-status')).toHaveText(T('Not riding'));
  expect((await table(page, 'trips'))[0].skipped).toBe(true);
  await page.getByRole('button', { name: T('Riding it after all') }).click();
  await expect.poll(async () => (await table(page, 'trips'))[0].skipped).toBe(false);
  expect((await table(page, 'debriefs'))).toEqual([]);

  // On the way, 10 days before the start: back to Pack, the trip is not ended.
  await page.evaluate(() => localStorage.setItem('pack.currentTrip', 'gtp-l7'));
  await page.goto('./#/ride');
  await expect(goButton(page)).toHaveText(T('Back to packing'));
  await goButton(page).click();
  await expect(page).toHaveURL(/#\/pack\?day/);
  expect((await table(page, 'trips'))[0].finished).toBeFalsy();
  expect(errors).toEqual([]);
});

test('L7: during the trip "Next: Debrief" on the way ends it and opens the whole debrief', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info, { trips: [trip('gtp-l7b', 'Unterwegs', { startDate: day(0), days: 2 })] });
  // Day 1 of 2: the debrief tab still waits for the last day…
  await page.goto('./#/debrief/gtp-l7b');
  await expect(page.locator('section.early')).toBeVisible();
  // …but ending the trip on the way opens it at once.
  await page.evaluate(() => localStorage.setItem('pack.currentTrip', 'gtp-l7b'));
  await page.goto('./#/ride');
  await expect(goButton(page)).toHaveText(T('Next: Debrief'));
  await goButton(page).click();
  await expect(page).toHaveURL(/#\/debrief\/gtp-l7b/);
  await expect(page.getByRole('button', { name: T('Save debrief') }).first()).toBeVisible();
  expect((await table(page, 'trips'))[0].finished).toBe(day(0));
  expect(errors).toEqual([]);
});

test('L9: New trip without a bike adds one inline; a trip without gear lands in a friendly empty Plan', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info, { empty: true });
  await page.goto('./#/pack');
  await page.getByRole('button', { name: T('Create a trip') }).click();
  const dlg = page.locator('dialog.trip-dlg');
  await expect(dlg).toBeVisible();
  await expect(dlg).toContainText(T('No bike added yet.'));
  // No last trip: no "Copy the last trip".
  await expect(dlg.getByRole('button', { name: new RegExp(esc(T('Copy the last trip'))) })).toHaveCount(0);
  await fits(page, info);
  await dlg.getByRole('button', { name: `+ ${T('Add a bike')}` }).click();
  await dlg.getByLabel(T('Name of the bike')).fill('test_data_gtp_ Testvelo');
  await shot(page, info, 'l9-bike');
  await dlg.getByRole('button', { name: T('Save'), exact: true }).click();
  await expect(dlg.getByRole('button', { name: 'test_data_gtp_ Testvelo' })).toHaveAttribute('aria-pressed', 'true');
  const bikes = await table(page, 'bikes');
  expect(bikes.map((b) => b.name)).toEqual(['test_data_gtp_ Testvelo']);
  expect(bikes[0].slots.length).toBeGreaterThan(0);
  await dlg.getByRole('button', { name: new RegExp(`^${esc(T('Create trip'))}`) }).click();
  await expect(dlg).toHaveCount(0);

  // Plan with an empty list: a kind sentence and a way to add the first item.
  const empty = page.locator('section.empty-list');
  await expect(empty.getByRole('heading', { name: T('Your packing list is still empty.') })).toBeVisible();
  const [tr] = await table(page, 'trips');
  expect(tr.bikeId).toBe(bikes[0].id);
  expect(tr.entries).toEqual([]);
  await fits(page, info);
  await shot(page, info, 'l9-empty');
  await empty.getByRole('button', { name: T('Add gear') }).click();
  const sheet = page.locator('dialog.calm-sheet');
  await expect(sheet.getByRole('heading', { name: T('Add material') })).toBeVisible();
  await expect(sheet).toContainText(T('No gear yet. Type the name of your first item in the search above.'));
  await sheet.getByLabel(T('Search your gear')).fill('test_data_gtp_ Pumpe');
  await expect(sheet.getByRole('button', { name: T('Add "{q}" as a new item and pack it', { q: 'test_data_gtp_ Pumpe' }) })).toBeVisible();
  expect(errors).toEqual([]);
});
