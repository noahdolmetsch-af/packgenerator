// Paket VG «Das Velo im Griff» (Noah 20.10.2026 «1a 2a 3a», «4-6 alle», «7-8 beide»), German UI:
// - the page «Verschleiss» has the chain rotation, «Was hält am längsten», the four pages and the reminders;
// - spare parts at home: an own chain change takes one away, empty → the shopping list;
// - pack the bike: tick, own point, delete with Undo; chain rotation: two chains, put one on;
// - sale listing: the text from km and parts, the price only when typed; wear photos: three parts.
// Fictional fixture; nothing leaves the preview server; service workers blocked (config).
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
// the lists from the app source (griff.js imports Svelte runes, so it is read as text)
const GRIFF = readFileSync(fileURLToPath(new URL('../../src/lib/griff.js', import.meta.url)), 'utf8');
const PACK_STD = [...GRIFF.match(/export const PACK_STD = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
const PREFS_KEY = GRIFF.match(/export const PREFS_KEY = '([^']+)'/)[1];
const STOCK_KEY = GRIFF.match(/export const STOCK_KEY = '([^']+)'/)[1];
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const BIKE = base.tables.bikes[0];
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
// calendar days in Europe/Zurich
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${today()}T12:00:00Z`));
// the thousands mark as the browser writes it (Node on GitHub writes ' where Chrome writes ’)
let SEP = '’';
const N = (n) => n.toLocaleString('en-US').replace(/,/g, SEP);
const rep = (date, km, extra = {}) => ({ date, km, value: null, action: 'replace', result: 'done', by: 'self', note: '', ...extra });
// a fictional bike with 2600 km: the chain changed by yourself 60 days ago (Test-Marke, before: Alt-Marke)
Object.assign(BIKE, {
  km: 2600,
  parts: [
    { key: 'chain', model: 'Testmarke 12', history: [rep(day(-300), 0, { model: 'Altmarke 11' }), rep(day(-60), 1800)] },
    { key: 'tyres', model: '', history: [rep(day(-200), 0)] },
  ],
});
// one chain at home, counted 90 days ago → the own change 60 days ago used it up
base.tables.settings.push({ key: STOCK_KEY, value: [{ id: 'st-test', name: 'Testkette', part: 'chain', qty: 1, since: day(-90) }] });

const table = (page, name) =>
  page.evaluate((n) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(n).objectStore(n).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);
const setting = async (page, key) => (await table(page, 'settings')).find((s) => s.key === key)?.value;
const bikeNow = async (page) => (await table(page, 'bikes')).find((b) => b.id === BIKE.id);
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.beforeEach(async ({ page, context }, info) => {
  page.on('dialog', (d) => { throw new Error(`browser dialog: ${d.message()}`); });
  const file = info.outputPath('griff.json');
  writeFileSync(file, JSON.stringify(base));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  SEP = await page.evaluate(() => (1000).toLocaleString('de-CH').charAt(1));
});

test('the wear page: brands, chain rotation, the four pages and the reminders', async ({ page }) => {
  await page.goto(`./#/bikes?tab=care&view=wear&bike=${BIKE.id}`);
  await expect(page.getByRole('heading', { level: 1, name: T('Wear|page') })).toBeVisible();
  await expect(page.locator('[data-brands]')).toContainText('Altmarke');
  await expect(page.locator('[data-brands]')).toContainText(`${N(1800)} km`);

  // chain rotation: two chains, put B on
  const rot = page.locator('[data-rotation]');
  await rot.locator('[data-chain-name]').fill('Kette A');
  await rot.locator('[data-chain-add]').click();
  await rot.locator('[data-chain-name]').fill('Kette B');
  await rot.locator('[data-chain-add]').click();
  await expect(rot.locator('[data-chain]')).toHaveCount(2);
  await rot.locator('[data-chain]').filter({ hasText: 'Kette B' }).locator('[data-chain-swap]').click();
  await expect(rot.locator('[data-chain]').filter({ hasText: 'Kette B' })).toContainText(T('on the bike'));
  await expect.poll(async () => (await bikeNow(page)).chains?.swaps?.at(-1)?.to).toBeTruthy();

  // the reminders are saved
  const wet = page.locator('[data-pref-wet]');
  await expect(wet).toBeChecked();
  await wet.uncheck();
  await expect.poll(async () => (await setting(page, PREFS_KEY))?.wetChain).toBe(false);

  for (const v of ['photos', 'sell', 'bikepack', 'stock']) await expect(page.locator(`[data-griff-page="${v}"]`)).toBeVisible();
  expect(await noSideways(page)).toBe(0);
  await page.locator('[data-griff-page="photos"]').click();
  await expect(page).toHaveURL(/view=photos/);
  await expect(page.getByRole('heading', { level: 1, name: T('Wear photos') })).toBeVisible();
  await expect(page.locator('[data-shots]')).toHaveCount(3);
  expect(await noSideways(page)).toBe(0);
});

test('spare parts at home: an own change used it up, then on the shopping list; a new row', async ({ page }) => {
  await page.goto(`./#/bikes?tab=care&view=stock&bike=${BIKE.id}`);
  await expect(page.getByRole('heading', { level: 1, name: T('Spare parts at home') })).toBeVisible();
  const row = page.locator('[data-stock="st-test"]');
  await expect(row).toHaveAttribute('data-stock-left', '0');
  await expect(row).toContainText(T('empty'));
  await row.locator('[data-stock-shop]').click();
  await expect(page.getByText(T('"{name}" is on the shopping list.', { name: 'Testkette' }))).toBeVisible();
  await expect.poll(async () => JSON.stringify(await table(page, 'settings'))).toContain('Testkette');

  await page.locator('[data-stock-name]').fill('Schlauch 29');
  await page.locator('[data-stock-new-qty]').fill('3');
  await page.locator('[data-stock-add]').click();
  const added = page.locator('[data-stock]').last();
  await expect(page.locator('[data-stock]')).toHaveCount(2);
  await expect(added.getByRole('textbox', { name: T('Name') })).toHaveValue('Schlauch 29');
  await expect(added).toHaveAttribute('data-stock-left', '3');
  expect(await noSideways(page)).toBe(0);
});

test('pack the bike: tick, own point, delete with Undo', async ({ page }) => {
  await page.goto(`./#/bikes?tab=care&view=bikepack&bike=${BIKE.id}`);
  await expect(page.getByRole('heading', { level: 1, name: T('Pack the bike') })).toBeVisible();
  const items = page.locator('[data-pack-item]');
  await expect(items).toHaveCount(PACK_STD.length);
  await expect(items.first()).toContainText(T(PACK_STD[0]));
  await items.first().locator('[data-pack-tick]').check();
  await expect(page.getByText(T('{n} of {m} done', { n: 1, m: PACK_STD.length }))).toBeVisible();

  await page.locator('[data-pack-new]').fill('Helm einpacken');
  await page.locator('[data-pack-add]').click();
  await expect(items).toHaveCount(PACK_STD.length + 1);
  await expect(items.last()).toContainText('Helm einpacken');

  await items.last().locator('[data-pack-delete]').click();
  await page.getByTestId('ask-delete').getByRole('button', { name: T('Delete'), exact: true }).click();
  await expect(items).toHaveCount(PACK_STD.length);
  await page.getByRole('button', { name: /Rückgängig|Undo/ }).click();
  await expect(items).toHaveCount(PACK_STD.length + 1);
  expect(await noSideways(page)).toBe(0);
});

test('sale listing: km and parts in the text, the price only when typed', async ({ page }) => {
  await page.goto(`./#/bikes?tab=care&view=sell&bike=${BIKE.id}`);
  await expect(page.getByRole('heading', { level: 1, name: T('Sale listing') })).toBeVisible();
  const text = page.locator('[data-sell-text]');
  await expect(text).toContainText(BIKE.name);
  await expect(text).toContainText('Testmarke 12');
  await expect(text).not.toContainText('CHF');
  await page.locator('[data-sell-price]').fill('950');
  await page.locator('[data-sell-price]').blur();
  await expect(text).toContainText(T('Price: CHF {price}', { price: '950' }));
  expect(await noSideways(page)).toBe(0);
});

// Noah 21.10.2026 «1b»: the chain reminder after rain stands on the page «Verschleiss» (and on the phone), not on Heute
test('chain after rain: a hint on the wear page, not on Today; done writes the care entry and the hint goes', async ({ page }) => {
  const put = (store, row) =>
    page.evaluate(([s, r]) => new Promise((ok, no) => {
      const o = indexedDB.open('pack-generator');
      o.onsuccess = () => {
        const tx = o.result.transaction(s, 'readwrite');
        tx.objectStore(s).put(r);
        tx.oncomplete = () => { o.result.close(); ok(); };
        tx.onerror = () => no(tx.error);
      };
    }), [store, row]);
  await put('kmBook', { id: 'kb-wet-test', bikeId: BIKE.id, date: today(), km: 42, kind: 'ride', source: 'manual', state: 'counted' });
  await put('meta', { key: 'inspectRain', at: new Date().toISOString(), lat: 0, lon: 0, days: { [today()]: 9 } });

  // Today in the evening: no chain window
  await page.clock.setFixedTime(new Date(`${today()}T18:30:00Z`));
  await page.goto('./#/');
  await settle(page);
  await expect(page.locator('dialog[data-window="chain"]')).toHaveCount(0);

  await page.goto(`./#/bikes?tab=care&view=wear&bike=${BIKE.id}`);
  const hint = page.locator('[data-wet-chain]');
  await expect(hint).toBeVisible();
  await expect(hint).toContainText(T('Dry and oil the chain'));
  await expect(hint).toContainText('42');
  expect(await noSideways(page)).toBe(0);
  await hint.locator('[data-wet-chain-done]').click();
  await expect(hint).toHaveCount(0);
  await expect.poll(async () => (await bikeNow(page)).parts.find((p) => p.key === 'chain').history.some((h) => h.date === today() && h.action === 'service')).toBe(true);
});
