// v0.154.0 «Bausteine mehr» (mockups SN3h, SN3i, SN3i-b, SN3j; Noah 14.10.2026 «SN3h–SN3j freigegeben»,
// answers 1a 2a 3a 4b 5a):
// - Bausteine: the groups of the Gesamtliste in their order, «Je nach Lage» (12) and «Baden» open, the others folded;
//   the new blocks start with example parts (1a); new parts show «+N neu» with Rückgängig and Undo (2a);
//   «Standard» first in «Auf jeder Fahrt» (3a); the Kälte stages inside Kälte;
// - the rule of «Kurz ins Wasser»: «und am See oder Fluss», «noch von Hand», «Nasses trocken halten» follows;
// - Planen: «Baden» by hand; Packen: Kurz ins Wasser and Nasses trocken halten come as a suggestion;
// - Packen (SN3j): Zwei Nächte («Fr.–So., 2 Nächte») and Abfahrt warm dashed in front; cold: one suggestion PER stage (4b).
// Fictional data only (test_data_gtp_; the example parts are generic), German UI, Europe/Zurich, service workers blocked.
// SHOTS=<folder> saves the screenshots (1440 and 390, light).
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

// the lists come from the app source (gear.js SETS, blocksmore.js); those modules need Svelte, so they are read as text
const src = (f) => readFileSync(fileURLToPath(new URL(`../../src/lib/${f}`, import.meta.url)), 'utf8');
const SETS = Object.fromEntries([...src('gear.js').match(/export const SETS = \{([\s\S]*?)\n\};/)[1].matchAll(/^\s+(\w+): '([^']+)',/gm)].map((m) => [m[1], m[2]]));
const GROUPS = Object.fromEntries([...src('blocksmore.js').match(/export const BLOCK_GROUPS = \{([\s\S]*?)\n\};/)[1].matchAll(/^\s+(\w+): \[([^\]]+)\]/gm)].map((m) => [m[1], [...m[2].matchAll(/'(\w+)'/g)].map((x) => x[1])]));
const PARTS = Object.fromEntries([...src('blocksmore.js').match(/const P = \{([\s\S]*?)\n\};/)[1].matchAll(/^\s+(\w+): \['([^']+)', '([^']+)', '(\w+)'\]/gm)].map((m) => [m[1], { en: m[2], de: m[3] }]));
const MORE = Object.fromEntries([...src('blocksmore.js').match(/export const MORE_PARTS = \{([\s\S]*?)\n\};/)[1].matchAll(/^\s+(\w+): \[([^\]]+)\]/gm)].map((m) => [m[1], [...m[2].matchAll(/'(\w+)'/g)].map((x) => x[1])]));

const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
// calendar days in Europe/Zurich
const zurichToday = () => new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`);
const day = (n = 0) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(zurichToday());
/** Days until the next Friday at least 2 days ahead (before the fixture's event in 10 days). */
const toFriday = () => {
  const wd = zurichToday().getUTCDay();
  const n = (5 - wd + 7) % 7;
  return n < 2 ? n + 7 : n;
};
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const TRIP = 'test_data_gtp_grimsel';
const NAME = (key) => T(SETS[key]);
const DE_PART = (k) => PARTS[k].de;

function fixtureFile(info, trip = {}) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const path = `${info.project.outputDir}/bausteinemehr-fixture-${info.testId}.json`;
  const data = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  // a backup from before 0.154.0: the update «Bausteine mehr» runs on import (the shared fixture already had it)
  data.tables.settings = data.tables.settings.filter((s) => s.key !== 'update.blocksMore2026');
  const ev = data.tables.trips[0];
  // a weekend Fr–So with 2 nights in a hotel and a pass, down 1’594 m a day
  const route = { name: 'test_data_gtp_ Grimsel-Runde', km: 212, gainM: 3400, lossM: 4782, start: { lat: 46.6, lon: 8.3 }, end: { lat: 46.6, lon: 8.3 }, line: [[46.6, 8.3], [46.56, 8.34], [46.6, 8.3]], profile: [[0, 600], [70, 2164], [212, 600]], file: 'test_data_gtp_grimsel.gpx' };
  data.tables.trips.push({ ...ev, id: TRIP, title: 'test_data_gtp_ Grimsel-Wochenende', startDate: day(toFriday()), days: 3, overnight: 'lodging', tent: false, cook: false, event: false, hours: 4.5, pass: true, route, wx: { min: 6, max: 17, rain: 'none' }, sets: {}, entries: ev.entries.map((e) => ({ ...e, packed: false })), ...trip });
  writeFileSync(path, JSON.stringify(data));
  return path;
}

async function start(page, context, info, hash, trip = {}) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(fixtureFile(info, trip));
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  await page.goto(hash);
  return errors;
}

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
const itemNamed = async (page, name) => (await dbAll(page, 'items')).find((i) => i.name === name) ?? null;
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

async function shot(page, info, name, el = null) {
  if (!process.env.SHOTS) return;
  mkdirSync(process.env.SHOTS, { recursive: true });
  const path = `${process.env.SHOTS}/${name}-${phone(info) ? 390 : 1440}.png`;
  if (!phone(info)) await page.mouse.move(2, 2);
  await (el ? el.screenshot({ path }) : page.screenshot({ path, fullPage: true }));
}

test('Bausteine: the five groups of the Gesamtliste, example parts in the new blocks, +N neu with Rueckgaengig and Undo', async ({ page, context }, info) => {
  const errors = await start(page, context, info, './#/blocks');
  const main = page.locator('main');
  const heads = main.locator('.groups > .gcol').first().locator('h2');
  await expect(heads).toHaveText([T('Overnight|group'), T('On every ride'), T('Depending on the situation'), T('Bathing|group'), T('To add')]);
  // 5a: «Je nach Lage» and «Baden» open, the others folded
  const sit = main.getByRole('region', { name: T('Depending on the situation') });
  for (const key of GROUPS.situation) await expect(sit.getByRole('listitem', { name: NAME(key), exact: true })).toBeVisible();
  const bath = main.getByRole('region', { name: T('Bathing|group') });
  for (const key of GROUPS.bathing) await expect(bath.getByRole('listitem', { name: NAME(key), exact: true })).toBeVisible();
  for (const name of [T('Overnight|group'), T('On every ride'), T('To add')]) await expect(main.getByRole('region', { name }).locator(':scope > details')).not.toHaveAttribute('open', '');
  // 1a: a new block starts with its example parts; «noch von Hand» where the app does not know it yet
  const swim = bath.getByRole('listitem', { name: NAME('swim'), exact: true });
  for (const k of MORE.swim) await expect(swim).toContainText(DE_PART(k));
  await expect(swim).toContainText(`${T('comes along:')} ${T('above|rule')} 22 °C ${T('and at a lake or river')}`);
  await expect(swim).toContainText(T('still by hand'));
  await expect(swim).toContainText(T('{n} example items', { n: MORE.swim.length }));
  // Licht and Rennen moved to «Je nach Lage» with their «kommt mit»
  await expect(sit.getByRole('listitem', { name: NAME('lights'), exact: true })).toContainText(T('The ride goes into the dark'));
  // 4b: the Kälte stages inside Kälte, each one opens its own rule
  const cold = sit.getByRole('listitem', { name: NAME('cold'), exact: true });
  for (const k of ['coldHands', 'coldLayers', 'coldEvening']) await expect(cold.getByRole('button', { name: NAME(k), exact: true })).toBeVisible();
  await expect(cold.getByRole('button', { name: NAME('coldHands'), exact: true })).toContainText(`${T('below|rule')} 8 °C`);
  expect(await noSideways(page)).toBe(0);
  await shot(page, info, 'bausteine-gruppen');

  // 3a: Standard first in «Auf jeder Fahrt»
  const every = main.getByRole('region', { name: T('On every ride') });
  await tap(every.locator(':scope > details > summary'), info);
  await expect(every.getByRole('listitem').first()).toHaveAccessibleName(T('Standard|block'));
  await tap(every.locator(':scope > details > summary'), info);
  // 2a: Hotel/Hütte got its new parts directly, with «+3 Teile neu» and Rückgängig
  const night = main.getByRole('region', { name: T('Overnight|group') });
  await expect(night.locator(':scope > details > summary')).toContainText(T('+{n} new items', { n: MORE.hotel.length + MORE.cookWarm.length }));
  await tap(night.locator(':scope > details > summary'), info);
  const sleep = night.getByRole('listitem', { name: NAME('sleepwell'), exact: true });
  for (const k of MORE.sleepwell) await expect(sleep).toContainText(DE_PART(k));
  await expect(sleep).toContainText(T('new|block'));
  const hotel = night.getByRole('listitem', { name: NAME('hotel'), exact: true });
  const line = hotel.locator('p[data-new="hotel"]');
  await expect(line).toContainText(T('+{n} new items', { n: MORE.hotel.length }));
  for (const k of MORE.hotel) await expect(line).toContainText(DE_PART(k));
  await shot(page, info, 'bausteine-neu-rueckgaengig', night);
  await tap(line.getByRole('button', { name: T('Take back the new items of {block}', { block: NAME('hotel') }) }), info);
  await expect(line).toHaveCount(0);
  await expect.poll(async () => (await itemNamed(page, PARTS.trousers.en))?.sets?.includes('hotel') ?? false).toBe(false);
  await expect(page.getByRole('status').filter({ hasText: T('{block}: {n} new items taken back.', { block: NAME('hotel'), n: 3 }) })).toBeVisible();
  // the bar's Undo puts them back
  await tap(page.getByRole('button', { name: T('Undo'), exact: true }), info);
  await expect(hotel.locator('p[data-new="hotel"]')).toContainText(DE_PART('trousers'));
  await expect.poll(async () => (await itemNamed(page, PARTS.trousers.en))?.sets ?? []).toContain('hotel');
  expect(await noSideways(page)).toBe(0);
  expect(errors).toEqual([]);
});

test('the rule of Kurz ins Wasser: a second condition by hand, Nasses trocken halten follows; a stage rule can be switched off', async ({ page, context }, info) => {
  const errors = await start(page, context, info, './#/blocks');
  const bath = page.locator('main').getByRole('region', { name: T('Bathing|group') });
  await tap(bath.getByRole('listitem', { name: NAME('swim'), exact: true }).getByRole('button').first(), info);
  const dlg = page.getByRole('dialog', { name: NAME('swim') });
  await expect(dlg).toBeVisible();
  await expect(dlg.getByLabel(T('Value'))).toHaveValue('maxC');
  await expect(dlg.getByLabel(T('Limit'))).toHaveValue('22');
  await expect(dlg).toContainText(T('and at a lake or river'));
  await expect(dlg).toContainText(T('still by hand'));
  await expect(dlg).toContainText(T('When {block} comes along, the app also suggests {dry}.', { block: `«${NAME('swim')}»`, dry: `«${NAME('drybag')}»` }));
  for (const k of MORE.swim) await expect(dlg).toContainText(DE_PART(k));
  expect(await noSideways(page)).toBe(0);
  await shot(page, info, 'regel-kurz-ins-wasser');
  await tap(dlg.getByRole('button', { name: T('Cancel'), exact: true }), info);
  await expect(dlg).toBeHidden();
  // a stage: «Kälte: Schichten» switched off, the chip says so
  const cold = page.locator('main').getByRole('region', { name: T('Depending on the situation') }).getByRole('listitem', { name: NAME('cold'), exact: true });
  await tap(cold.getByRole('button', { name: NAME('coldLayers'), exact: true }), info);
  const sdlg = page.getByRole('dialog', { name: NAME('coldLayers') });
  await expect(sdlg.getByLabel(T('Limit'))).toHaveValue('0');
  await tap(sdlg.getByRole('switch', { name: T('Suggest|rule') }), info);
  await tap(sdlg.getByRole('button', { name: T('Save'), exact: true }), info);
  await expect(cold.getByRole('button', { name: NAME('coldLayers'), exact: true })).toContainText(T('Suggestion off'));
  expect(errors).toEqual([]);
});

test('Planen: Baden by hand; Packen suggests Kurz ins Wasser and Nasses trocken halten, never by itself', async ({ page, context }, info) => {
  const errors = await start(page, context, info, './#/pack?weather', { wx: { min: 14, max: 26, rain: 'none' }, pass: false });
  const sheet = page.locator('dialog[open]');
  await expect(sheet.getByRole('heading', { name: T('Edit trip conditions') })).toBeVisible();
  const lage = sheet.getByRole('group', { name: T('Pass, country, getting there and bathing') });
  const baden = lage.getByRole('group', { name: T('Bathing|trip') });
  await baden.scrollIntoViewIfNeeded();
  const lake = baden.getByRole('button', { name: T('Lake or river'), exact: true });
  await expect(lake).toHaveAttribute('aria-pressed', 'false');
  await tap(lake, info);
  await expect(lake).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await tripNow(page)).bathe).toEqual(['lake']);
  await expect(lage).toContainText(T('still by hand'));
  expect(await noSideways(page)).toBe(0);
  await shot(page, info, 'planen-baden', sheet);

  await page.goto('./#/pack?day');
  const card = page.getByRole('region', { name: T('Building blocks') });
  const add = card.getByRole('group', { name: T('Add|blocks') });
  const swim = add.getByRole('button', { name: new RegExp(`^${esc(T('Suggestion: highest {c} °C', { c: 26 }))} ${esc(NAME('swim'))}`) });
  await expect(swim).toHaveClass(/sug/);
  await expect(add.getByRole('button', { name: new RegExp(`^${esc(T('Suggestion: with bathing'))} ${esc(NAME('drybag'))}`) })).toBeVisible();
  expect((await tripNow(page)).sets.swim).toBeUndefined(); // only suggested
  await tap(swim, info);
  await expect(card.getByRole('group', { name: T('On the trip|blocks') }).getByRole('button', { name: new RegExp(`^${esc(NAME('swim'))}`) })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await tripNow(page)).sets.swim).toBe(true);
  await tap(card.getByRole('button', { name: T('Undo'), exact: true }), info);
  await expect.poll(async () => (await tripNow(page)).sets.swim).toBeUndefined();
  expect(errors).toEqual([]);
});

test('Packen: Zwei Naechte and Abfahrt warm are dashed suggestions; without a tap they stay out', async ({ page, context }, info) => {
  const errors = await start(page, context, info, './#/pack?day');
  const card = page.getByRole('region', { name: T('Building blocks') });
  const add = card.getByRole('group', { name: T('Add|blocks') });
  const SUG = T('Suggestion: {what}', { what: '' });
  const two = add.getByRole('button', { name: new RegExp(`^${esc(SUG)}.*${esc(NAME('twonights'))}`) });
  await expect(two).toHaveClass(/sug/);
  await expect(two).toContainText(/Fr\.?–So\.?, 2 Nächte/);
  const down = add.getByRole('button', { name: new RegExp(`^${esc(SUG)}Pass, ↓ \\S+ m ${esc(NAME('descent'))}`) });
  await expect(down).toHaveClass(/sug/);
  // Gut schlafen does not fit a hotel night: it is not among the buttons
  await expect(add.getByRole('button', { name: new RegExp(esc(NAME('sleepwell'))) })).toHaveCount(0);
  const ids = new Set((await tripNow(page)).entries.map((e) => e.itemId));
  const shirt = await itemNamed(page, PARTS.shirt2.en);
  expect(ids.has(shirt.id)).toBe(false); // nothing came by itself
  if (!phone(info)) {
    await down.hover();
    await expect(page.locator('.xtip.on')).toContainText(NAME('descent'));
  }
  expect(await noSideways(page)).toBe(0);
  await shot(page, info, 'packen-vorschlag', card);
  expect(errors).toEqual([]);
});

test('Packen 4b: cold brings one suggestion per stage', async ({ page, context }, info) => {
  const errors = await start(page, context, info, './#/pack?day', { wx: { min: -2, max: 4, rain: 'none' } });
  const card = page.getByRole('region', { name: T('Building blocks') });
  const add = card.getByRole('group', { name: T('Add|blocks') });
  for (const k of ['coldHands', 'coldLayers', 'coldEvening']) {
    const b = add.getByRole('button', { name: new RegExp(`^${esc(T('Suggestion: lowest {c} °C', { c: -2 }))} ${esc(NAME(k))}`) });
    await expect(b).toHaveClass(/sug/);
  }
  // one tap takes one stage only
  await tap(add.getByRole('button', { name: new RegExp(`^${esc(T('Suggestion: lowest {c} °C', { c: -2 }))} ${esc(NAME('coldHands'))}`) }), info);
  await expect.poll(async () => (await tripNow(page)).sets).toMatchObject({ coldHands: true });
  expect((await tripNow(page)).sets.coldLayers).toBeUndefined();
  await expect(add.getByRole('button', { name: new RegExp(`^${esc(T('Suggestion: lowest {c} °C', { c: -2 }))} ${esc(NAME('coldLayers'))}`) })).toHaveClass(/sug/);
  expect(await noSideways(page)).toBe(0);
  await shot(page, info, 'packen-kaelte-stufen', card);
  expect(errors).toEqual([]);
});
