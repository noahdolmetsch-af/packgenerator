// SN3+ «Bausteine je nach Lage» (mockups SN3e-a, SN3f, SN3g; Noah 13.10.2026 «SN3e–SN3g freigegeben»,
// answers 1a 2a 3ab 4b 5a and «aufklappbar b»):
// - Bausteine: «Je nach Lage» open with its seven blocks and «kommt mit: …»; the other groups fold to one row;
// - a tap on a block opens its rule: «Vorschlagen», the limit, «Zurücksetzen»;
// - Packen: a fitting block is dashed with its reason; one tap adds it, Undo takes it back;
// - Planen (the trip conditions): «Pass», «Land» and «Anreise» bring their suggestions.
// Fictional data only (test_data_gtp_), German UI, Europe/Zurich, service workers blocked (config).
// SHOTS=<folder> saves the screenshots (1440 and 390, light).
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

// the lists come from the app source (situation.js, gear.js SETS); those modules need Svelte, so they are read as text
const src = (f) => readFileSync(fileURLToPath(new URL(`../../src/lib/${f}`, import.meta.url)), 'utf8');
const SITUATION_BLOCKS = [...src('situation.js').match(/SITUATION_BLOCKS = \[([^\]]+)\]/)[1].matchAll(/'(\w+)'/g)].map((m) => m[1]);
const SETS = Object.fromEntries([...src('gear.js').match(/export const SETS = \{([\s\S]*?)\n\};/)[1].matchAll(/^\s+(\w+): '([^']+)',/gm)].map((m) => [m[1], m[2]]));

const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const day = (n = 0) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
// Impeccable Packen 1: with a block on the trip the card in Packen is one line; «Bausteine ändern» opens it
async function openBlocks(page, info) {
  const card = page.getByRole('region', { name: T('Building blocks') });
  await expect(card).toBeVisible();
  const change = card.getByRole('button', { name: T('Change building blocks') });
  if (await change.count()) await tap(change, info);
  await expect(card.getByRole('button', { name: T('Change building blocks') })).toHaveCount(0);
  return card;
}
const TRIP = 'test_data_gtp_bruenig';
// a few fictional items in the blocks Kälte, Pass & Höhenmeter, Ausland and Zug (Hitze and Lange Fahrt stay empty)
const ITEMS = [
  ['WH', 'Winterhandschuhe', 180, 'cold'], ['UE', 'Überschuhe', 220, 'cold'],
  ['WW', 'Windweste', 90, 'climb'], ['AU', 'Ausweis-Hülle', 10, 'abroad'], ['SG', 'Spanngurt', 40, 'train'],
];
const NAME = (key) => T(SETS[key]);

function fixtureFile(info) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const path = `${info.project.outputDir}/sn3plus-fixture-${info.testId}.json`;
  const data = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  for (const [id, name, g, set] of ITEMS) data.tables.items.push({ id: `test_data_gtp_S${id}`, name: `test_data_gtp_ ${name}`, category: 'tools', weightG: g, qty: 1, weightStatus: 'measured', defaultBag: 'top', ownership: 'owned', role: null, sets: [set], kits: [], domains: ['bikepacking'] });
  // a day ride in five days: 3–14 °C dry, a route up to 1’650 m, 6.5 h
  const ev = data.tables.trips[0];
  const route = { name: 'test_data_gtp_ Runde', km: 104, gainM: 1650, lossM: 1650, start: { lat: 46.75, lon: 8.05 }, end: { lat: 46.75, lon: 8.05 }, line: [[46.75, 8.05], [46.8, 8.15], [46.75, 8.05]], profile: [[0, 600], [52, 1650], [104, 600]], file: 'test_data_gtp_runde.gpx' };
  data.tables.trips.push({ ...ev, id: TRIP, title: 'test_data_gtp_ Brünig-Runde', startDate: day(5), days: 1, overnight: 'none', event: false, hours: 6.5, route, wx: { min: 3, max: 14, rain: 'none' }, sets: {}, entries: ev.entries.map((e) => ({ ...e, packed: false })) });
  writeFileSync(path, JSON.stringify(data));
  return path;
}

async function start(page, context, info, hash = './#/pack?day') {
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
  await page.goto(hash);
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
const ruleOn = async (page, key) => (await dbAll(page, 'settings')).find((s) => s.key === 'sets')?.value?.find((s) => s.key === key)?.rule ?? null;
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

async function shot(page, info, name, el = null) {
  if (!process.env.SHOTS) return;
  mkdirSync(process.env.SHOTS, { recursive: true });
  const path = `${process.env.SHOTS}/${name}-${phone(info) ? 390 : 1440}.png`;
  await (el ? el.screenshot({ path }) : page.screenshot({ path, fullPage: true }));
}

test('Bausteine: «Je nach Lage» is open with its seven blocks; the other groups fold; a rule can be changed, switched off and reset', async ({ page, context }, info) => {
  const errors = await start(page, context, info, './#/blocks');
  const main = page.locator('main');
  const sit = main.getByRole('region', { name: T('Depending on the situation') });
  await expect(sit).toBeVisible();
  // Impeccable P3 (20.10.2026): the empty blocks sit in one fold; open it when it is there
  const fold = sit.locator('details[data-empty-blocks]');
  if (await fold.count()) await fold.locator('> summary').click();
  for (const key of SITUATION_BLOCKS) await expect(sit.getByRole('listitem', { name: NAME(key), exact: true })).toBeVisible();
  const cold = sit.getByRole('listitem', { name: NAME('cold'), exact: true });
  await expect(cold).toContainText(`${T('comes along:')} ${T('below|rule')} 5 °C`);
  await expect(cold).toContainText('test_data_gtp_ Winterhandschuhe');
  // Impeccable (18.10.2026): an empty block says what it does not do and offers «+ Teile» (Material in «Select»)
  const heat = sit.getByRole('listitem', { name: NAME('heat'), exact: true });
  await expect(heat).toContainText(T('still empty: suggests nothing when packing'));
  await expect(heat.getByRole('link', { name: T('Add items to {block}', { block: NAME('heat') }) })).toHaveAttribute('href', '#/gear?fill=heat');
  await expect(cold.getByRole('link')).toHaveCount(0);
  await expect(sit.locator('[data-empty-blocks] > summary')).toContainText(/\d+ leere? Bausteine?/); // Impeccable P3: the empty ones in one fold
  await expect(sit.getByRole('listitem', { name: NAME('climb'), exact: true })).toContainText(`${T('from|rule')} 1’200 ${T('m climbing a day')} ${T('or a pass')}`);
  // the other groups are one row each with their count; one tap opens them
  // v0.154.0 «Bausteine mehr» (Gesamtliste, 3a): «Auf jeder Fahrt» = Standard, Erste Hilfe, Reparatur, Laden
  const ride = main.getByRole('region', { name: T('On every ride') });
  await expect(ride.locator(':scope > details > summary')).toContainText('4');
  await expect(ride.getByRole('listitem', { name: T('Repair|block'), exact: true })).toHaveCount(0);
  for (const name of [T('Overnight|group'), T('To add')]) await expect(main.getByRole('region', { name }).locator(':scope > details')).not.toHaveAttribute('open', '');
  await tap(ride.locator(':scope > details > summary'), info);
  await expect(ride.getByRole('listitem', { name: T('Repair|block'), exact: true })).toBeVisible();
  await tap(ride.locator(':scope > details > summary'), info);
  await expect(main.getByRole('region', { name: T('Where the app knows the situation from') })).toContainText(T('Weather in Plan'));
  expect(await noSideways(page)).toBe(0);
  await shot(page, info, 'SN3e-bausteine');

  // the rule sheet: the limit 5 → 2 °C
  await tap(cold.getByRole('button').first(), info); // v0.154.0: the Kälte stages are buttons in the row too
  const dlg = page.getByRole('dialog', { name: NAME('cold') });
  await expect(dlg).toBeVisible();
  await expect(dlg.getByRole('switch', { name: T('Suggest|rule') })).toHaveAttribute('aria-checked', 'true');
  await expect(dlg.getByLabel(T('Value'))).toHaveValue('minC');
  await expect(dlg.getByLabel(T('Limit'))).toHaveValue('5');
  await expect(dlg).toContainText(T('Standard: {v}', { v: '5 °C' }));
  await expect(dlg).toContainText('test_data_gtp_ Überschuhe');
  expect(await noSideways(page)).toBe(0);
  if (!phone(info)) await page.mouse.move(2, 2);
  await shot(page, info, 'SN3f-baustein-regel');
  await dlg.getByLabel(T('Limit')).fill('2');
  await tap(dlg.getByRole('button', { name: T('Save'), exact: true }), info);
  await expect(dlg).toBeHidden();
  await expect(cold).toContainText(`${T('below|rule')} 2 °C`);
  await expect.poll(() => ruleOn(page, 'cold')).toEqual({ on: true, metric: 'minC', cmp: 'lt', limit: 2 });
  // a wrong limit is refused at the field
  await tap(cold.getByRole('button').first(), info); // v0.154.0: the Kälte stages are buttons in the row too
  await dlg.getByLabel(T('Limit')).fill('abc');
  await tap(dlg.getByRole('button', { name: T('Save'), exact: true }), info);
  await expect(dlg.getByRole('alert')).toBeVisible();
  // «Zurücksetzen» puts the standard back
  await tap(dlg.getByRole('button', { name: T('Reset|rule') }), info);
  await expect(dlg.getByLabel(T('Limit'))).toHaveValue('5');
  await tap(dlg.getByRole('button', { name: T('Save'), exact: true }), info);
  await expect(cold).toContainText(`${T('below|rule')} 5 °C`);
  await expect.poll(() => ruleOn(page, 'cold')).toBeNull();

  // switched off: «Vorschlag aus», dashed
  const train = sit.getByRole('listitem', { name: NAME('train'), exact: true });
  await tap(train.getByRole('button'), info);
  const tdlg = page.getByRole('dialog', { name: NAME('train') });
  await tap(tdlg.getByRole('switch', { name: T('Suggest|rule') }), info);
  await tap(tdlg.getByRole('button', { name: T('Save'), exact: true }), info);
  await expect(train).toContainText(`${T('Suggestion off')} · ${T('Travel there by train')}`);
  await expect.poll(() => ruleOn(page, 'train')).toEqual({ on: false, metric: 'train' });
  expect(errors).toEqual([]);
});

test('Packen: a fitting block is dashed with its reason; one tap adds it, Undo takes it back; nothing comes by itself', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const card = await openBlocks(page, info);
  const on = card.getByRole('group', { name: T('On the trip|blocks') });
  const add = card.getByRole('group', { name: T('Add|blocks') });
  // v0.154.0 (4b): «Kälte: Hände und Füsse» is its own suggestion, so the name is followed by the count
  const cold = add.getByRole('button', { name: new RegExp(`^${esc(T('Suggestion: lowest {c} °C', { c: 3 }))} ${NAME('cold')} \\d`) });
  await expect(cold).toHaveAttribute('aria-pressed', 'false');
  await expect(cold).toHaveClass(/sug/);
  await expect(add.getByRole('button', { name: new RegExp(`^${esc(T('Suggestion: up to {m} m', { m: '1’650' }))} ${esc(NAME('climb'))}`) })).toBeVisible();
  // Planen has no country and no train yet: those blocks are there to choose, not suggested
  await expect(add.getByRole('button', { name: new RegExp(`^${NAME('train')}`) })).not.toHaveClass(/sug/);
  await expect(card.getByText(T('Fits this trip: {names}. Never a must: without a tap they stay out.', { names: `${NAME('cold')}, ${NAME('climb')}` }))).toBeVisible();
  await expect(card.getByRole('link', { name: T('Change rules') })).toHaveAttribute('href', '#/blocks');
  expect([...(await onTrip(page))].some((id) => /test_data_gtp_S(WH|UE|WW)/.test(id))).toBe(false);
  // hover (computer): the bubble names the rule
  if (!phone(info)) {
    await cold.hover();
    await expect(page.locator('.xtip.on')).toContainText(T('{block} · comes along {rule}', { block: NAME('cold'), rule: `${T('below|rule')} 5 °C` }));
  }
  expect(await noSideways(page)).toBe(0);
  await shot(page, info, 'SN3g-packen-vorschlag', card);
  if (!phone(info)) await page.mouse.move(2, 2);

  // one tap adds Kälte; Undo takes it back
  await tap(cold, info);
  await expect(on.getByRole('button', { name: new RegExp(`^${NAME('cold')}`) })).toHaveAttribute('aria-pressed', 'true');
  await expect(card.getByRole('status')).toContainText(T('{block} added to this trip.', { block: NAME('cold') }));
  await expect.poll(async () => (await onTrip(page)).has('test_data_gtp_SWH')).toBe(true);
  await tap(card.getByRole('button', { name: T('Undo'), exact: true }), info);
  await expect(add.getByRole('button', { name: new RegExp(`^${esc(T('Suggestion: lowest {c} °C', { c: 3 }))} ${NAME('cold')} \\d`) })).toBeVisible();
  await expect.poll(async () => (await onTrip(page)).has('test_data_gtp_SWH')).toBe(false);
  expect(errors).toEqual([]);
});

test('Planen: «Pass», «Land» and «Anreise» are stored on the trip and bring their suggestions', async ({ page, context }, info) => {
  const errors = await start(page, context, info, './#/pack?weather');
  const sheet = page.locator('dialog[open]');
  await expect(sheet.getByRole('heading', { name: T('Edit trip conditions') })).toBeVisible();
  const lage = sheet.getByRole('group', { name: T('Pass, country, getting there and bathing') });
  await lage.scrollIntoViewIfNeeded();
  const pass = lage.getByRole('button', { name: T('Pass|trip'), exact: true });
  await expect(pass).toHaveAttribute('aria-pressed', 'false');
  await tap(pass, info);
  await expect(pass).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await tripNow(page)).pass).toBe(true);
  await lage.getByLabel(T('Country')).selectOption('FR');
  await expect.poll(async () => (await tripNow(page)).country).toBe('FR');
  const arrival = lage.getByRole('group', { name: T('Getting there') });
  await tap(arrival.getByRole('button', { name: T('Train|arrival'), exact: true }), info);
  await expect.poll(async () => (await tripNow(page)).arrival).toBe('train');
  await expect(arrival.getByRole('button', { name: T('Train|arrival'), exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await noSideways(page)).toBe(0);
  await shot(page, info, 'SN3-planen-lage', sheet);
  // a second tap takes «Zug» off again (never binding), a third one puts it back
  await tap(arrival.getByRole('button', { name: T('Train|arrival'), exact: true }), info);
  await expect.poll(async () => (await tripNow(page)).arrival).toBeNull();
  await tap(arrival.getByRole('button', { name: T('Train|arrival'), exact: true }), info);
  await expect.poll(async () => (await tripNow(page)).arrival).toBe('train');

  await page.goto('./#/pack?day');
  const add = (await openBlocks(page, info)).getByRole('group', { name: T('Add|blocks') });
  await expect(add.getByRole('button', { name: new RegExp(`^${esc(T('Suggestion: travel by train'))} ${NAME('train')}`) })).toBeVisible();
  await expect(add.getByRole('button', { name: new RegExp(`^${esc(T('Suggestion: trip in {country}', { country: 'Frankreich' }))} ${NAME('abroad')}`) })).toBeVisible();
  await expect(add.getByRole('button', { name: new RegExp(`^${esc(T('Suggestion: a pass'))} ${esc(NAME('climb'))}`) })).toBeVisible();
  expect((await tripNow(page)).sets.train).toBeUndefined(); // only suggested, never switched on
  expect(errors).toEqual([]);
});
