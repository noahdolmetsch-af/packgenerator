// SN5+ «SN5 plus» (Noah 13.10.2026, answers 1a 2a 3a 4a 5b), German UI, phone and desktop:
// Favoriten: the bar per trip kind, «zuletzt dabei» / «noch auf keiner Tour», «Oft dabei» (Favorit with
// Undo, «Nicht mehr vorschlagen»), «Als Baustein speichern» (a copy) and the quiet hint on Bausteine when
// the stars change («übernehmen?»). Import prüfen: the weight before → after, the bag of a new item,
// what «Schon da» gets, «Letzte Importe» with «Rückgängig» on an older import.
// Fictional data only (fixture.json + test_data_gtp_ names); nothing leaves the preview server.
// SN5P_SHOTS=<folder> saves the screenshots there.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';
import { openShort } from './kurz-open.js';
// The bag names of gear.js BAGS (that module needs the app's Svelte runtime): the light's suggested
// bag is the top tube bag, the rain's the seat pack (importplus.js BAG_BY_CATEGORY, unit-tested).
const BAG = { top: 'Top tube bag', bar: 'Front roll', seat: 'Seat pack / Tailfin' };
const suggestBag = (cat) => ({ light: 'top', rain: 'seat' })[cat];

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const P = 'test_data_gtp_';
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const MARK = { key: 'test_data_gtp_marker', value: 1 };
// A fixed morning (Fr., 9. Okt. 2026), so the past trips stay past and no tour asks «Tour beendet».
const NOW = new Date('2026-10-09T10:00:00+02:00');
const trip = (id, title, startDate, ids, domain = 'bikepacking') => ({ id, domain, title: `${P}${title}`, startDate, days: 1, bikeId: 'bike-test', bike: 'Test gravel bike', setup: {}, entries: ids.map((itemId) => ({ itemId, slot: 'seat', qty: 1, packed: true })), ready: [], status: 'planned', finished: true, createdAt: '2026-09-01T10:00:00.000Z' });

const table = (page, name) =>
  page.evaluate((n) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(n).objectStore(n).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);
const wide = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
async function shot(page, info, name) {
  const dir = process.env.SN5P_SHOTS;
  if (!dir) return;
  mkdirSync(dir, { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${dir}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
}

async function load(page, context, info, data) {
  const file = info.outputPath('base.json');
  writeFileSync(file, JSON.stringify(data));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.clock.setFixedTime(NOW);
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await expect.poll(async () => (await table(page, 'settings')).some((s) => s.key === MARK.key)).toBe(true);
  return errors;
}

function favData() {
  const data = structuredClone(base);
  const fav = { EL02: true, LI01: true, SL01: true, HY02: true };
  for (const i of data.tables.items) if (fav[i.id]) i.favorite = true;
  data.tables.trips.push(
    trip('t-hoernli', 'Hoernli-Runde', '2026-10-07', ['EL02', 'LI01', 'EL01', 'EL03']),
    trip('t-chasseral', 'Chasseral', '2026-09-30', ['EL02', 'EL01', 'EL03']),
    trip('t-jura', 'Jura', '2026-09-20', ['EL01']),
  );
  data.tables.settings.push(MARK);
  return data;
}

test('SN5+ Favoriten: bar, zuletzt dabei, Oft dabei, Als Baustein and the hint on Bausteine', async ({ page, context }, info) => {
  const errors = await load(page, context, info, favData());
  await page.goto('./#/favorites');
  await openShort(page);
  await expect(page.getByRole('heading', { level: 1, name: T('Favourites') })).toBeVisible();

  // F1: a bar per kind; Bikepacking (990 g) is the heaviest, Wochenende (310 + 240 g) in proportion.
  const bike = page.getByRole('region', { name: 'Bikepacking' });
  const weekend = page.getByRole('region', { name: T('Weekend') });
  const fill = async (sec) => sec.locator('.fbar span').evaluate((s) => s.style.width);
  expect(await fill(bike)).toBe('100%');
  expect(parseFloat(await fill(weekend))).toBeCloseTo((550 / 990) * 100, 0);

  // F3: zuletzt dabei with the trip and the day; never on a trip: the quiet line.
  const power = bike.locator('li.frow', { hasText: 'Power bank' });
  await expect(power.locator('.last')).toContainText(`${T('last on:')} ${P}Hoernli-Runde · 7. Okt.`);
  await expect(bike.locator('li.frow', { hasText: 'Sleeping bag' }).locator('.last')).toHaveText(T('not on any trip yet'));

  // F2: «Oft dabei»: on at least half of the trips, no star yet.
  // Impeccable runde 2 (Favoriten 1): «Oft dabei» is a closed line on top now: «2 Vorschläge: …», a tap opens it
  const line = page.locator('[data-often-line]');
  await expect(line).toHaveText(T('{n} suggestions: often with you, no star yet', { n: 2 }));
  expect((await line.boundingBox()).y).toBeLessThan((await bike.boundingBox()).y);
  // Favoriten 2: the bar is thin, and said once above the kinds
  await expect(page.getByText(T('Bar: the weight of the favourites against the heaviest kind'))).toBeVisible();
  expect(await bike.locator('.fbar').evaluate((b) => b.getBoundingClientRect().height)).toBe(4);
  await line.click();
  const often = page.locator('[data-sec="often"]');
  await expect(often.locator('li')).toHaveCount(2);
  await expect(often.locator('li').first()).toContainText('Bike computer');
  await expect(often.locator('li').first()).toContainText(T('on {n} of {of} trips', { n: 3, of: 3 }));
  expect(await wide(page)).toBeLessThanOrEqual(0);
  await shot(page, info, 'SN5p-favoriten');

  await often.getByRole('button', { name: T('Make {name} a favourite', { name: 'USB-C cable' }) }).click();
  await expect.poll(async () => (await table(page, 'items')).find((i) => i.id === 'EL03').favorite).toBe(true);
  await page.locator('.undo').getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await table(page, 'items')).find((i) => i.id === 'EL03').favorite ?? null).toBe(null);
  // «…» → «Nicht mehr vorschlagen»
  await often.locator('li', { hasText: 'USB-C cable' }).getByRole('button', { name: /^Mehr zu / }).click();
  await page.getByRole('menuitem', { name: new RegExp(`^${T('Do not suggest any more')}`) }).click();
  await expect(often.locator('li')).toHaveCount(1);
  expect((await table(page, 'settings')).find((s) => s.key === 'favSuggestOff').value).toEqual(['EL03']);

  // F4: «Als Baustein»: every favourite chosen, one left out, saved as a copy.
  await bike.getByRole('button', { name: T('Save the favourites of {kind} as a building block', { kind: 'Bikepacking' }) }).click();
  const dlg = page.getByRole('dialog', { name: T('Save as building block') });
  await expect(dlg).toBeVisible();
  await expect(dlg.getByRole('textbox', { name: T('Name') })).toHaveValue(T('Favourites {kind}', { kind: 'Bikepacking' }));
  await expect(dlg.locator('input[type=checkbox]:checked')).toHaveCount(3);
  if (info.project.name === 'phone') {
    const box = await dlg.boundingBox();
    expect(Math.round(box.width)).toBe(page.viewportSize().width);
  }
  await shot(page, info, 'SN5p-als-baustein');
  await dlg.locator('label', { hasText: 'Sleeping bag' }).click();
  await expect(dlg.locator('input[type=checkbox]:checked')).toHaveCount(2);
  await dlg.getByRole('textbox', { name: T('Name') }).fill(`${P}Fav Bike`);
  await dlg.getByRole('button', { name: T('Save'), exact: true }).click();
  await expect(dlg).toBeHidden();
  const sets = async () => (await table(page, 'settings')).find((s) => s.key === 'sets')?.value ?? [];
  await expect.poll(async () => (await sets()).find((s) => s.name === `${P}Fav Bike`)?.fav?.domain).toBe('bikepacking');
  const key = (await sets()).find((s) => s.name === `${P}Fav Bike`).key;
  const inBlock = async () => (await table(page, 'items')).filter((i) => (i.sets ?? []).includes(key)).map((i) => i.id).sort();
  expect(await inBlock()).toEqual(['EL02', 'LI01']);
  expect((await table(page, 'items')).find((i) => i.id === 'SL01').favorite).toBe(true); // the stars stay

  // A new star later: the block says so quietly, one tap takes it over.
  await often.getByRole('button', { name: T('Make {name} a favourite', { name: 'Bike computer' }) }).click();
  await expect.poll(async () => (await table(page, 'items')).find((i) => i.id === 'EL01').favorite).toBe(true);
  await page.goto('./#/blocks');
  const add = page.locator('section.sfold', { has: page.getByRole('heading', { name: T('To add') }) });
  await add.locator('summary').first().click();
  const hint = page.locator('.drift');
  await expect(hint).toContainText(T('{n} favourite has changed', { n: 1 }));
  await shot(page, info, 'SN5p-baustein-hinweis');
  await hint.getByRole('button', { name: T('Take over the changed favourites into {block}', { block: `${P}Fav Bike` }) }).click();
  await expect.poll(inBlock).toEqual(['EL01', 'EL02', 'LI01']);
  await expect(page.locator('.drift')).toHaveCount(0);
  await page.locator('.undo').getByRole('button', { name: T('Undo') }).click();
  await expect.poll(inBlock).toEqual(['EL02', 'LI01']);
  expect(await wide(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

const GEAR1 = {
  kind: 'gear-import',
  version: 1,
  items: [
    { sourceId: 'G1', name: `${P}Regenhose leicht`, category: 'rain', weightG: 230, owned: true },
    { sourceId: 'G2', name: `${P}Stirnlampe`, category: 'light', weightG: 85, owned: true },
    { sourceId: 'G3', name: `${P}Ersatzspeichen`, category: 'tools', owned: true },
    { sourceId: 'G4', name: 'Sun cream', category: 'hyg', weightG: 60, areas: ['Alltag'], notes: `${P}LSF 50`, owned: true },
  ],
};
const GEAR2 = { kind: 'gear-import', version: 1, items: [{ sourceId: 'G9', name: `${P}Kettenoel`, category: 'tools', weightG: 60, owned: true }] };

async function stage(page, info, data, name) {
  const file = info.outputPath(name);
  writeFileSync(file, JSON.stringify(data));
  const panel = await openData(page);
  await panel.locator('input[type=file]').setInputFiles(file);
  await panel.getByRole('dialog', { name: T('Check import') }).getByRole('link', { name: T('Check import') }).click();
  await expect(page).toHaveURL(/#\/gear\/import$/);
}

test('SN5+ Import pruefen: weight, bag, Schon da, Letzte Importe, undo of an older one (no umlaut: the output folder holds the files)', async ({ page, context }, info) => {
  const data = structuredClone(base);
  data.tables.settings.push(MARK);
  const errors = await load(page, context, info, data);
  const before = await table(page, 'items');

  // No import yet: the quiet line.
  await page.goto('./#/gear/import');
  await expect(page.getByRole('region', { name: T('Last imports') })).toContainText(T('No import yet.'));

  await stage(page, info, GEAR1, 'material-liste.json');
  // I1: +315 g (230 + 85; the sun cream keeps its 60 g), the spokes are not weighed.
  const w = page.locator('[data-sec="weight"]');
  await expect(w).toContainText(T('{w} in your gear list', { w: '+315 g' }));
  await expect(w).toContainText(T('{names} is not weighed and does not count.', { names: `${P}Ersatzspeichen` }));
  // I3: each new item a pill with the suggested bag; a tap opens category and bag.
  const fresh = page.locator('[data-sec="fresh"]');
  const lamp = fresh.locator('li.srow', { hasText: `${P}Stirnlampe` });
  const pill = lamp.locator('button.place');
  await expect(pill).toContainText(T(BAG[suggestBag('light')]));
  await pill.click();
  const box = page.locator('.placebox');
  await expect(box.getByRole('group', { name: T('Bag of {name}', { name: `${P}Stirnlampe` }) }).locator('[aria-pressed=true]')).toHaveText(T(BAG.top));
  // I2: what «Schon da» gets, and what stays; never the source ID.
  const same = page.locator('[data-sec="same"]');
  await expect(same).toContainText(T('+ Trip kind {name}', { name: T('Everyday') }));
  await expect(same).toContainText(T('+ Note «{text}»', { text: `${P}LSF 50` }));
  await expect(same).toContainText(T('stays: {list}', { list: '' }).trim());
  await expect(same).not.toContainText(T('Source ID'));
  expect(await wide(page)).toBeLessThanOrEqual(0);
  await shot(page, info, 'SN5p-import-pruefen');
  await box.getByRole('button', { name: T(BAG.bar) }).click();
  await expect(pill).toContainText(T(BAG.bar));

  await page.getByRole('button', { name: T('Apply|import'), exact: true }).click();
  await expect(page.locator('.done')).toBeVisible();
  const items = await table(page, 'items');
  expect(items.find((i) => i.sourceId === 'G2').defaultBag).toBe('bar');
  expect(items.find((i) => i.sourceId === 'G1').defaultBag).toBe(suggestBag('rain'));

  // A second import, then «Rückgängig» on the OLDER one: its items go, the newer one stays.
  await stage(page, info, GEAR2, 'nachtrag.json');
  await page.getByRole('button', { name: T('Apply|import'), exact: true }).click();
  await expect(page.locator('.done')).toBeVisible();
  const hist = page.locator('[data-sec="history"]');
  await expect(hist.locator('li')).toHaveCount(2);
  await expect(hist.locator('li').nth(1)).toContainText('material-liste.json');
  await expect(hist.locator('li').nth(1)).toContainText(T('{n} new', { n: 3 }));
  await shot(page, info, 'SN5p-letzte-importe');
  await hist.getByRole('button', { name: T('Undo the import {name}', { name: 'material-liste.json' }) }).click();
  await expect(page.getByRole('status').filter({ hasText: T('Undone: {name}.', { name: 'material-liste.json' }) })).toBeVisible();
  const after = await table(page, 'items');
  expect(after.length).toBe(before.length + 1);
  expect(after.some((i) => i.sourceId === 'G9')).toBe(true);
  // the sun cream has its old values back (only the change time is new)
  const bare = ({ updatedAt, ...rest }) => rest;
  expect(bare(after.find((i) => i.id === 'HY01'))).toEqual(bare(before.find((i) => i.id === 'HY01')));
  await expect(hist.locator('li').nth(1)).toContainText(T('undone {when}', { when: '' }).trim());
  await expect(hist.locator('li').nth(0).getByRole('button', { name: T('Undo the import {name}', { name: 'nachtrag.json' }) })).toBeVisible();
  // the full-backup card of the newest is gone (it would bring the older import back)
  await expect(page.locator('.done')).toHaveCount(0);
  expect(await wide(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});
