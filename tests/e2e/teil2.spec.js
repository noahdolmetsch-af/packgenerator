// v0.124.0 «Neue Tour Teil 2» (mockups B4/B5, Noah 12.10.2026 «b2 b4 b5 ok»; B5 default «a ★ Ja, schlank dabei»):
// B4  Packen shows the trip's building blocks as big option buttons: «Bausteine · n dabei · m zur Wahl»,
//     «Dabei» green with ✓, «Dazunehmen» white with +, a suggestion dashed with a label (rain when wet,
//     Repair when it holds more than 8 parts). One tap switches the whole block (Undo); hover (computer)
//     or a long press (phone) shows what is inside.
// B5  «Reparatur unterwegs»: the window suggests 8 of the 16 repair parts as option buttons; at most 8;
//     «8 Teile übernehmen» keeps them in Repair (the rest stays in Gear) and puts them on the trip; Undo.
// Fictional data only (test_data_gtp_), German UI, Europe/Zurich, service workers blocked (config).
// SHOTS=<folder> saves the screenshots (1440 and 390, light).
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const day = (n = 0) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());

// 12 more repair parts: with the fixture's four tools Repair holds 16 (the app suggests 8 for the ride)
const TOOLS = [
  ['RH', 'Reifenheber 2×', 20], ['KS', 'Kettenschloss', 5], ['FZ', 'Flickzeug', 15], ['TW', 'Tubeless-Würste', 30],
  ['KB', 'Kabelbinder 5×', 10], ['SP', 'Standpumpe', 1600], ['KN', 'Kettennieter', 120], ['DS', 'Drehmomentschlüssel', 310],
  ['KA', 'Kassettenabzieher', 90], ['MS', 'Montageständer', 4200], ['KO', 'Kettenöl gross', 300], ['VS', 'Ventilschlüssel', 8],
];
const TRIP = 'test_data_gtp_jura';

function fixtureFile(info) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const path = `${info.project.outputDir}/teil2-fixture-${info.testId}.json`;
  const data = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  for (const [id, name, g] of TOOLS) data.tables.items.push({ id: `test_data_gtp_T${id}`, name: `test_data_gtp_ ${name}`, category: 'tools', weightG: g, qty: 1, weightStatus: 'measured', defaultBag: 'top', ownership: 'owned', role: null, sets: ['repair'], kits: [], domains: ['bikepacking'] });
  data.tables.items.push({ id: 'test_data_gtp_RACE', name: 'test_data_gtp_ Startnummer-Halter', category: 'bike', weightG: 20, qty: 1, weightStatus: 'measured', defaultBag: 'top', ownership: 'owned', role: null, sets: ['race'], kits: [], domains: ['bikepacking'] });
  // a weekend in five days with 30 % rain; Repair off (a new trip of 0.114.0), Charging on by itself
  const ev = data.tables.trips[0];
  data.tables.trips.push({ ...ev, id: TRIP, title: 'test_data_gtp_ Jura-Runde', startDate: day(5), event: false, wx: { min: 6, max: 16, rain: 'showers', rainPct: 30 }, sets: { repair: false }, entries: ev.entries.map((e) => ({ ...e, packed: false })) });
  writeFileSync(path, JSON.stringify(data));
  return path;
}

async function start(page, context, info) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(fixtureFile(info));
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  await page.goto('./#/pack?day');
  return errors;
}

/** One store of the app's IndexedDB. */
const dbAll = (page, store) =>
  page.evaluate(
    (name) =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const q = r.result.transaction(name).objectStore(name).getAll();
          q.onsuccess = () => (r.result.close(), ok(q.result));
        };
      }),
    store,
  );
const tripNow = async (page) => (await dbAll(page, 'trips')).find((x) => x.id === TRIP);
const onTrip = async (page) => new Set((await tripNow(page)).entries.map((e) => e.itemId));

async function shot(page, info, name, el = null) {
  if (!process.env.SHOTS) return;
  mkdirSync(process.env.SHOTS, { recursive: true });
  const path = `${process.env.SHOTS}/${name}-${phone(info) ? 390 : 1440}.png`;
  await (el ? el.screenshot({ path }) : page.screenshot({ path }));
}

/** A finger held on an element (Chromium touch events through CDP), as in knoepfe.spec.js. */
async function longPress(page, locator, ms = 700) {
  const box = await locator.boundingBox();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }] });
  await page.waitForTimeout(ms);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test('B4: the building blocks as big buttons in Packen; one tap switches a block; hover or hold shows what is inside', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const card = page.getByRole('region', { name: T('Building blocks') });
  await expect(card).toBeVisible();
  // Impeccable Packen 1: with a block on the trip (Charging) the card is one line; «Bausteine ändern» opens it
  await expect(card).toHaveAttribute('data-blocks-folded', '');
  const line = card.locator('.fon');
  await expect(line).toContainText(T('Building blocks on the trip:'));
  await expect(line).toContainText(T('Charging|block'));
  await expect(card.getByRole('button', { name: /test_data_gtp_ Rain/ })).toHaveCount(0);
  expect(await noSideways(page)).toBe(0);
  await shot(page, info, 'B4-bausteine-zu', card);
  await tap(card.getByRole('button', { name: T('Change building blocks') }), info);
  await expect(card).not.toHaveAttribute('data-blocks-folded', '');
  const on = card.getByRole('group', { name: T('On the trip|blocks') });
  const add = card.getByRole('group', { name: T('Add|blocks') });
  // Charging comes by itself; Repair (16 parts, off) and the own rain block are dashed suggestions
  const charge = on.getByRole('button', { name: new RegExp(`^${T('Charging|block')}`) });
  await expect(charge).toHaveAttribute('aria-pressed', 'true');
  const rain = add.getByRole('button', { name: /test_data_gtp_ Rain/ });
  await expect(rain).toContainText(T('Suggestion: {pct} % rain', { pct: 30 }));
  await expect(add.getByRole('button', { name: new RegExp(`^${T('Suggestion: {n} of {all} for the ride', { n: 8, all: 16 })}`) })).toBeVisible();
  for (const name of [T('Hygiene|block'), T('Light|block'), T('Race|block')]) await expect(add.getByRole('button', { name: new RegExp(`^${name}`) })).toHaveAttribute('aria-pressed', 'false');
  const counts = await card.locator('.cnt').textContent();
  expect(counts).toBe(T('{n} on · {m} to choose', { n: await on.getByRole('button').count(), m: await add.getByRole('button').count() }));
  expect(await noSideways(page)).toBe(0);
  await shot(page, info, 'B4-bausteine-beim-packen', card);

  // hover (computer) or hold (phone): the bubble names what is inside, nothing is switched
  const hyg = add.getByRole('button', { name: new RegExp(`^${T('Hygiene|block')}`) });
  await hyg.scrollIntoViewIfNeeded();
  if (phone(info)) await longPress(page, hyg);
  else await hyg.hover();
  await expect(page.locator('.xtip.on')).toContainText('test_data_gtp_ Badetuch') // the fixture's towel, by its German name;
  await expect(hyg).toHaveAttribute('aria-pressed', 'false');
  await page.mouse.move(2, 2);

  // one tap adds the whole block; it moves to «Dabei»
  await tap(hyg, info);
  await expect(on.getByRole('button', { name: new RegExp(`^${T('Hygiene|block')}`) })).toHaveAttribute('aria-pressed', 'true');
  await expect(card.getByRole('status')).toContainText(T('{block} added to this trip.', { block: T('Hygiene|block') }));
  await expect.poll(async () => (await onTrip(page)).has('test_data_gtp_HY02')).toBe(true);

  // one tap takes a block off; Undo brings it back
  await tap(charge, info);
  await expect(add.getByRole('button', { name: new RegExp(`^${T('Charging|block')}`) })).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(async () => (await onTrip(page)).has('test_data_gtp_EL02')).toBe(false);
  expect((await tripNow(page)).sets.charge).toBe(false);
  await tap(card.getByRole('button', { name: T('Undo'), exact: true }), info);
  await expect(on.getByRole('button', { name: new RegExp(`^${T('Charging|block')}`) })).toHaveAttribute('aria-pressed', 'true');
  expect((await tripNow(page)).sets.charge).not.toBe(false);
  // «Zuklappen» folds the card to its one line again
  await tap(card.getByRole('button', { name: T('Fold up|blocks') }), info);
  await expect(card).toHaveAttribute('data-blocks-folded', '');
  await expect(card.getByRole('button', { name: T('Change building blocks') })).toBeFocused();
  expect(errors).toEqual([]);
});

test('B5: Reparatur unterwegs suggests 8 of 16 parts, at most 8, takes them over and Undo puts them back', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  // Impeccable Packen 1: Charging is on, so the card is one line until «Bausteine ändern»
  const card = page.getByRole('region', { name: T('Building blocks') });
  await tap(card.getByRole('button', { name: T('Change building blocks') }), info);
  await tap(card.getByRole('button', { name: new RegExp(`^${T('Suggestion: {n} of {all} for the ride', { n: 8, all: 16 })}`) }), info);
  const dlg = page.getByRole('dialog', { name: T('Repair on the way') });
  await expect(dlg).toBeVisible();
  const road = dlg.getByRole('group', { name: T('For the ride') });
  const shop = dlg.getByRole('group', { name: T('Stays in the workshop') });
  await expect(road.getByRole('button')).toHaveCount(8);
  for (const n of ['Ersatzschlauch', 'Minipumpe', 'Multitool', 'Reifenheber 2×', 'Kettenschloss', 'Flickzeug', 'Tubeless-Würste', 'Kabelbinder 5×']) await expect(road.getByRole('button', { name: new RegExp(`test_data_gtp_ ${n}`) })).toHaveAttribute('aria-pressed', 'true');
  await expect(shop.getByRole('button', { name: /test_data_gtp_ Kettennieter/ })).toHaveAttribute('aria-pressed', 'false');
  await expect(shop.getByRole('button')).toHaveCount(6);
  const take = dlg.getByRole('button', { name: T('Take {n} parts', { n: 8 }) });
  await expect(take).toBeVisible();
  expect(await noSideways(page)).toBe(0);
  if (!phone(info)) await page.mouse.move(2, 2); // the pointer of the click would show a bubble in the picture
  await expect(page.locator('.xtip.on')).toHaveCount(0);
  await shot(page, info, 'B5-reparatur-unterwegs');

  // «… und 2 weitere» shows all; a ninth part is refused with a line
  await tap(dlg.getByRole('button', { name: T('… and {n} more workshop parts', { n: 2 }) }), info);
  await expect(shop.getByRole('button')).toHaveCount(8);
  await tap(shop.getByRole('button', { name: /test_data_gtp_ Ventilschlüssel/ }), info);
  await expect(dlg.getByText(T('At most {n} parts: take one out first.', { n: 8 }))).toBeVisible();
  await expect(road.getByRole('button')).toHaveCount(8);
  // one out, another in
  await tap(road.getByRole('button', { name: /test_data_gtp_ Kabelbinder/ }), info);
  await expect(dlg.getByRole('button', { name: T('Take {n} parts', { n: 7 }) })).toBeVisible();
  await tap(shop.getByRole('button', { name: /test_data_gtp_ Ventilschlüssel/ }), info);
  await tap(dlg.getByRole('button', { name: T('Take {n} parts', { n: 8 }) }), info);
  await expect(dlg).toBeHidden();

  // Repair is slim and on the trip: the 8 parts are in Repair and on the list, the workshop is not
  const on = card.getByRole('group', { name: T('On the trip|blocks') });
  await expect(on.getByRole('button', { name: new RegExp(`^${T('Repair|block')}`) })).toContainText(T('{n} items', { n: 8 }));
  await expect(card.getByRole('status')).toContainText(T('Repair is slim now: {n} parts for the ride.', { n: 8 }));
  const items = await dbAll(page, 'items');
  const rep = items.filter((i) => i.sets?.includes('repair')).map((i) => i.id);
  expect(rep.length).toBe(8);
  expect(rep).toContain('test_data_gtp_TVS');
  expect(rep).not.toContain('test_data_gtp_TKB');
  expect(items.find((i) => i.id === 'test_data_gtp_TSP')).toBeTruthy(); // the workshop stays in Gear
  const list = await onTrip(page);
  expect(list.has('test_data_gtp_TVS')).toBe(true);
  expect(list.has('test_data_gtp_TSP')).toBe(false);
  expect((await tripNow(page)).sets.repair).toBe(true);

  // Undo: the workshop back in Repair, the trip as before
  await tap(card.getByRole('button', { name: T('Undo'), exact: true }), info);
  await expect.poll(async () => (await dbAll(page, 'items')).filter((i) => i.sets?.includes('repair')).length).toBe(16);
  expect((await tripNow(page)).sets.repair).toBe(false);
  expect(errors).toEqual([]);
});
