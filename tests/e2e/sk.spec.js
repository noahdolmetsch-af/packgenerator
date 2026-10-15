// SK «Seiten-Kacheln» + «Links nach aussen» (mockups SK1–SK8, SKX1–SKX5; Noah 13.10.2026 «SK1–SK6
// freigegeben», «SK7–SKX5 freigegeben»):
// - the tile row at the end of Vergangene Touren, Rückblick, Velos, Material and Aktiv (not on Heute):
//   at most 7 tiles plus the empty «+»;
// - «…» › Ausblenden with Undo (on a phone also a long press);
// - «Kacheln anpassen»: move (pins), switch off, «Wieder zeigen», «Wie am Anfang»;
// - «+» with all 7 places full asks which tile goes;
// - a «Woanders» row opens in a new tab (target _blank, rel noopener noreferrer);
// - an own link not entered yet is dashed with «eintragen»; entering one keeps it on the device.
// Fictional data only (test_data_gtp_), own links on example.org, German UI, Europe/Zurich, service workers
// blocked (config), every outside address blocked. SHOTS=<folder> saves screenshots (1440 and 390, light).
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

// the pages and their tiles come from the app source (sk/pages.js needs Svelte, so it is read as text)
const PAGES_SRC = readFileSync(fileURLToPath(new URL('../../src/lib/sk/pages.js', import.meta.url)), 'utf8');
const pageTiles = (key) => {
  const line = PAGES_SRC.match(new RegExp(`^\\s+${key}: \\[(.*)\\],$`, 'm'))[1];
  return { own: [...line.matchAll(/(?<!ex\()T\.(\w+)/g)].map((m) => m[1]), extra: [...line.matchAll(/ex\(T\.(\w+)\)/g)].map((m) => m[1]) };
};
const HREF = { past: './#/pack/past', debrief: './#/debrief', bikes: './#/bikes', gear: './#/gear', flow: './#/flow' };

const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const day = (n = 0) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const PLACE = { name: 'test_data_gtp_ Langnau', lat: 46.94, lon: 7.79 };

function fixtureFile(info) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const path = `${info.project.outputDir}/sk-fixture-${info.testId}.json`;
  const data = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  // the trips start in a fictional place (for the forecast map and the train)
  for (const tr of data.tables.trips) tr.place = PLACE;
  writeFileSync(path, JSON.stringify(data));
  return path;
}

async function start(page, context, info, hash) {
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
const setting = async (page, key) => (await dbAll(page, 'settings')).find((s) => s.key === key)?.value ?? null;
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const tileIds = (row) => row.locator('[data-sk-tile]').evaluateAll((els) => els.map((e) => e.dataset.skTile));

async function shot(page, info, name, el = null) {
  if (!process.env.SHOTS) return;
  mkdirSync(process.env.SHOTS, { recursive: true });
  const path = `${process.env.SHOTS}/${name}-${phone(info) ? 390 : 1440}.png`;
  await (el ? el.screenshot({ path }) : page.screenshot({ path, fullPage: true }));
}

test('tiles at the end of Vergangene Touren, Rückblick, Velos, Material and Aktiv; none on Heute', async ({ page, context }, info) => {
  const errors = await start(page, context, info, './#/');
  await settle(page);
  await expect(page.locator('[data-sk]')).toHaveCount(0);
  for (const [key, href] of Object.entries(HREF)) {
    await page.goto(href);
    const row = page.locator(`[data-sk="${key}"]`);
    await expect(row, key).toBeVisible();
    const ids = await tileIds(row);
    const list = pageTiles(key);
    expect(ids.length, key).toBeGreaterThan(0);
    expect(ids.length, key).toBeLessThanOrEqual(7);
    // only the page's own tiles at the start, extras come after «Dazunehmen»
    for (const id of ids) expect(list.own, `${key}: ${id}`).toContain(id);
    // a tile that stepped aside says so in one quiet line; together with the shown ones all are there
    const quiet = await row.locator('[data-sk-quiet]').evaluateAll((els) => els.map((e) => e.dataset.skQuiet));
    expect([...ids, ...quiet].length, key).toBeGreaterThanOrEqual(Math.min(7, list.own.length));
    await expect(row.locator('[data-sk-plus]')).toBeVisible();
    await expect(row.getByRole('button', { name: new RegExp(`^${esc(T('Adjust tiles'))}`) })).toBeVisible();
    // the tile is the page's name and a short hint; an outside one opens in a new tab with the sign
    for (const a of await row.locator('[data-sk-tile] a.sk-a[target]').all()) {
      await expect(a).toHaveAttribute('target', '_blank');
      await expect(a).toHaveAttribute('rel', 'noopener noreferrer');
      await expect(a).toContainText(T('(opens elsewhere)'));
    }
    expect(await noSideways(page), key).toBe(0);
    await row.scrollIntoViewIfNeeded();
    await shot(page, info, `SK-${key}`, row);
  }
  // Vergangene Touren: bikepacking.com is an outside tile
  await page.goto(HREF.past);
  const bp = page.locator('[data-sk="past"] [data-sk-tile="bp"] a');
  await expect(bp).toHaveAttribute('href', 'https://bikepacking.com/routes/');
  expect(errors).toEqual([]);
});

test('«…» › Ausblenden hides a tile with Undo; on a phone a long press opens the same menu', async ({ page, context }, info) => {
  const errors = await start(page, context, info, HREF.past);
  const row = page.locator('[data-sk="past"]');
  await expect(row).toBeVisible();
  const before = await tileIds(row);
  const first = row.locator(`[data-sk-tile="${before[0]}"]`);
  if (phone(info)) {
    // a long press on the tile (touch) opens its menu
    await first.locator('a.sk-a').dispatchEvent('pointerdown', { pointerType: 'touch', isPrimary: true });
    await expect(page.getByRole('menuitem', { name: new RegExp(`^${esc(T('Hide'))}`) })).toBeVisible({ timeout: 3000 });
    await first.locator('a.sk-a').dispatchEvent('pointerup', { pointerType: 'touch', isPrimary: true });
  } else {
    await first.getByRole('button', { name: new RegExp(`^${esc(T('More for {what}', { what: '' }))}`) }).click();
  }
  await shot(page, info, 'SK6-menu');
  await tap(page.getByRole('menuitem', { name: new RegExp(`^${esc(T('Hide'))}`) }), info);
  await expect(row.locator(`[data-sk-tile="${before[0]}"]`)).toHaveCount(0);
  await expect(row.getByRole('button', { name: new RegExp(esc(T('{n} hidden', { n: 1 }))) })).toBeVisible();
  await expect.poll(async () => (await setting(page, 'sk.page.past'))?.hidden ?? []).toEqual([before[0]]);
  const toast = page.locator('[data-sk-toast]');
  await expect(toast).toBeVisible();
  await shot(page, info, 'SK6-hidden');
  await tap(toast.getByRole('button', { name: T('Undo') }), info);
  await expect(row.locator(`[data-sk-tile="${before[0]}"]`)).toBeVisible();
  await expect.poll(async () => (await setting(page, 'sk.page.past'))?.hidden ?? []).toEqual([]);
  expect(await tileIds(row)).toEqual(before);
  expect(errors).toEqual([]);
});

test('«Kacheln anpassen»: move pins the tile, switch off and «Wieder zeigen», «Wie am Anfang»', async ({ page, context }, info) => {
  const errors = await start(page, context, info, HREF.bikes);
  const row = page.locator('[data-sk="bikes"]');
  await expect(row).toBeVisible();
  const before = await tileIds(row);
  expect(before.length).toBeGreaterThanOrEqual(3);
  await tap(row.locator('[data-sk-adjust]'), info);
  const sheet = page.locator('dialog[open][data-sk-sheet]');
  await expect(sheet.getByRole('heading', { name: T('Adjust tiles') })).toBeVisible();
  await shot(page, info, 'SK6-anpassen', sheet);
  // the third tile one up: it is pinned at place 2
  const third = sheet.locator(`[data-sk-row="${before[2]}"]`);
  await tap(third.getByRole('button', { name: new RegExp(`${esc(T('Move {name} up', { name: '' }).trim())}$`) }), info);
  await expect.poll(async () => (await setting(page, 'sk.page.bikes'))?.pins ?? {}).toEqual({ [before[2]]: 1 });
  await expect.poll(() => tileIds(row)).toEqual([before[0], before[2], before[1], ...before.slice(3)]);
  await expect(row.locator(`[data-sk-tile="${before[2]}"]`).getByText(T('Pinned|tile'))).toBeAttached();
  // switch the first one off: it is under «Ausgeblendet» with «Wieder zeigen»
  await tap(sheet.locator(`[data-sk-switch="${before[0]}"]`), info);
  await expect(sheet.locator(`[data-sk-show="${before[0]}"]`)).toBeVisible();
  await expect(row.locator(`[data-sk-tile="${before[0]}"]`)).toHaveCount(0);
  await tap(sheet.locator(`[data-sk-show="${before[0]}"]`), info);
  await expect(row.locator(`[data-sk-tile="${before[0]}"]`)).toBeVisible();
  // «Wie am Anfang»: the page's own order, no pins
  await tap(sheet.locator('[data-sk-reset]'), info);
  await expect.poll(() => tileIds(row)).toEqual(before);
  await expect.poll(async () => (await setting(page, 'sk.page.bikes'))?.pins ?? {}).toEqual({});
  await tap(sheet.getByRole('button', { name: T('Done'), exact: true }), info);
  await expect(sheet).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('«+» with all 7 places full asks first which tile goes', async ({ page, context }, info) => {
  const errors = await start(page, context, info, HREF.gear);
  const row = page.locator('[data-sk="gear"]');
  await expect(row).toBeVisible();
  await expect.poll(async () => (await tileIds(row)).length).toBe(7);
  const before = await tileIds(row);
  await tap(row.locator('[data-sk-plus]'), info);
  const sheet = page.locator('dialog[open][data-sk-sheet]');
  await expect(sheet.getByText(T('{n} of {n} places taken. If you add a tile, the app first asks which one should make room.', { n: 7 }))).toBeVisible();
  await shot(page, info, 'SK8-plus', sheet);
  await tap(sheet.locator('[data-sk-add="lighter"]'), info);
  await expect(sheet.getByRole('heading', { name: T('Which tile makes room?') })).toBeVisible();
  await expect(sheet.locator('[data-sk-choose]')).toBeVisible();
  // nothing changed yet
  expect(await tileIds(row)).toEqual(before);
  await tap(sheet.locator(`[data-sk-goes="${before[3]}"]`), info);
  await expect(sheet.getByRole('heading', { name: T('Adjust tiles') })).toBeVisible();
  await expect.poll(async () => (await tileIds(row)).sort()).toEqual([...before.filter((x) => x !== before[3]), 'lighter'].sort());
  const st = await setting(page, 'sk.page.gear');
  expect(st.hidden).toEqual([before[3]]);
  expect(st.added).toEqual(['lighter']);
  expect(errors).toEqual([]);
});

test('a «Woanders» row opens in a new tab and sends only the place and the day', async ({ page, context }, info) => {
  const errors = await start(page, context, info, './#/pack?weather');
  const sheet = page.locator('dialog[open]');
  await expect(sheet.getByRole('heading', { name: T('Edit trip conditions') })).toBeVisible();
  const sbb = sheet.locator('[data-sk-link="x3s"]');
  await sbb.scrollIntoViewIfNeeded();
  await expect(sbb).toHaveAttribute('target', '_blank');
  await expect(sbb).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(sbb).toHaveAttribute('href', /^https:\/\/www\.sbb\.ch\/de\/kaufen\/pages\/fahrplan\/fahrplan\.xhtml\?nach=test_data_gtp_%20Langnau&datum=\d\d\.\d\d\.\d{4}$/);
  await expect(sbb).toContainText(T('(opens elsewhere)'));
  for (const kind of ['x3m', 'x10']) {
    await expect(sheet.locator(`[data-sk-link="${kind}"]`)).toHaveAttribute('target', '_blank');
    await expect(sheet.locator(`[data-sk-link="${kind}"]`)).toHaveAttribute('rel', 'noopener noreferrer');
  }
  await expect(sheet.locator('[data-sk-link="x10"]')).toHaveAttribute('href', 'https://map.geo.admin.ch/?swisssearch=test_data_gtp_%20Langnau');
  await shot(page, info, 'SKX2-woanders', sheet.locator('[data-sk-woanders]').last());
  // «…» › «SBB nicht mehr zeigen»: gone, with Undo
  const wo = sheet.locator('[data-sk-woanders]').filter({ has: page.locator('[data-sk-link="x3s"]') });
  await tap(wo.getByRole('button', { name: T('Options for the links elsewhere') }), info);
  await tap(page.getByRole('menuitem', { name: new RegExp(`^${esc(T('Don’t show «{name}» any more', { name: 'SBB' }))}`) }), info);
  await expect(sheet.locator('[data-sk-link="x3s"]')).toHaveCount(0);
  await expect.poll(() => setting(page, 'sk.off')).toEqual(['x3s']);
  await tap(page.locator('[data-sk-toast]').getByRole('button', { name: T('Undo') }), info);
  await expect(sheet.locator('[data-sk-link="x3s"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('an own link not entered yet is dashed with «eintragen»; entering one keeps it on the device', async ({ page, context }, info) => {
  const errors = await start(page, context, info, HREF.bikes);
  const enter = page.locator('[data-sk-link="x9"][data-sk-enter]');
  await expect(enter).toBeVisible();
  await expect(enter).toContainText(T('own link · enter'));
  await expect(enter).toContainText(T('Maker and warranty'));
  expect(await enter.evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe('dashed');
  await shot(page, info, 'SKX3-eintragen', enter.locator('xpath=ancestor::*[@data-sk-woanders]'));
  await tap(enter, info);
  const sheet = page.locator('dialog[open][data-sk-own]');
  await expect(sheet.getByRole('heading', { name: T('Enter a link') })).toBeVisible();
  // only http and https
  await sheet.getByLabel(T('Address')).fill('javascript:alert(1)');
  await tap(sheet.getByRole('button', { name: T('Save'), exact: true }), info);
  await expect(sheet.getByRole('alert')).toHaveText(T('Only addresses that start with http:// or https://'));
  await sheet.getByLabel(T('Address')).fill('example.org/garantie');
  await expect(sheet.getByRole('link', { name: new RegExp(T('Try it')) })).toHaveAttribute('href', 'https://example.org/garantie');
  await shot(page, info, 'SKX5-eigener-link', sheet);
  await tap(sheet.getByRole('button', { name: T('Save'), exact: true }), info);
  await expect(sheet).toHaveCount(0);
  const link = page.locator('a[data-sk-link="x9"]');
  await expect(link).toHaveAttribute('href', 'https://example.org/garantie');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(link).toContainText(T('your link'));
  const own = await setting(page, 'sk.links');
  expect(Object.values(own)).toEqual([{ url: 'https://example.org/garantie', name: T('Maker and warranty') }]);
  expect(Object.keys(own)[0]).toMatch(/^x9:test_data_gtp_/);
  // an own link as a tile of the page (SK8 «Eigener Link»)
  const row = page.locator('[data-sk="bikes"]');
  await tap(row.locator('[data-sk-adjust]'), info);
  const tiles = page.locator('dialog[open][data-sk-sheet]');
  await tap(tiles.locator('[data-sk-ownadd]'), info);
  const sheet2 = page.locator('dialog[open][data-sk-own]');
  await sheet2.getByLabel(T('Address')).fill('https://example.org/veloclub');
  await sheet2.getByLabel(T('Name on the button')).fill('test_data_gtp_ Veloclub');
  await tap(sheet2.getByRole('button', { name: T('Save'), exact: true }), info);
  await tap(tiles.getByRole('button', { name: T('Done'), exact: true }), info);
  const ownTile = row.locator('[data-sk-tile^="own-"] a');
  await expect(ownTile).toHaveAttribute('href', 'https://example.org/veloclub');
  await expect(ownTile).toHaveAttribute('target', '_blank');
  await expect(ownTile).toContainText('test_data_gtp_ Veloclub');
  expect(errors).toEqual([]);
});
