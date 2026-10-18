// «Mehr selbst einstellen» (Noah 15.10.2026, IS 254–258): Ich › Eigene Werte (#/me/werte). The backup
// reminder follows the own days (content approved by Noah 18.10.2026 19:36), packing starts N days before a trip, «cold» is the suggested
// temperature rule, everything goes back to Standard. Fictional fixture only, German texts.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const tn = (n, one, many) => T(n === 1 ? one : many, { n });
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// the fields of the page, read from the app (standards, names)
const SRC = readFileSync(fileURLToPath(new URL('../../src/lib/ownvalues.js', import.meta.url)), 'utf8');
const FIELD = Object.fromEntries([...SRC.matchAll(/\{ key: '(\w+)', area: '\w+', std: (-?\d+),.*?name: '([^']+)'/g)].map(([, key, std, name]) => [key, { std: Number(std), name }]));
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));

// calendar days in Europe/Zurich (never now + n * 864e5)
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const day = (n) => {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Zurich' }));
  d.setDate(d.getDate() + n);
  return iso(d);
};
const ITEM = base.tables.items.find((i) => i.category !== 'bags' && i.role === 'standard').id;
const trip = (id, title, startDate) => ({ id, domain: 'bikepacking', title: `test_data_gtp_ ${title}`, days: 2, startDate, entries: [{ itemId: ITEM, slot: 'frame', qty: 1, packed: false }], ready: [], status: 'planned', hours: 4, overnight: 'none' });

async function start(page, context, info, { trips = [], meta = [] } = {}) {
  const file = info.outputPath('eigene-werte.json');
  const data = structuredClone(base);
  data.tables.trips = [...(data.tables.trips ?? []), ...trips];
  writeFileSync(file, JSON.stringify(data));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await expect(panel.getByText(/importiert/)).toBeVisible();
  if (meta.length) await putMeta(page, meta);
}
/** Write rows into the meta table (the last backup is device data, not in a backup file). */
const putMeta = (page, rows) =>
  page.evaluate((rs) => new Promise((ok, fail) => {
    const r = indexedDB.open('pack-generator');
    r.onerror = fail;
    r.onsuccess = () => {
      const tx = r.result.transaction('meta', 'readwrite');
      for (const x of rs) tx.objectStore('meta').put(x);
      tx.oncomplete = () => { r.result.close(); ok(); };
    };
  }), rows);
const stored = (page) =>
  page.evaluate(() => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('settings').objectStore('settings').get('ownValues');
      q.onsuccess = () => { r.result.close(); ok(q.result?.value ?? null); };
    };
  }));
const row = (page, key) => page.locator(`main li[data-own="${key}"]`);
async function setValue(page, key, v) {
  const input = row(page, key).getByRole('textbox', { name: T(FIELD[key].name) });
  await input.fill(String(v));
  await input.press('Enter');
  await expect(input).toHaveValue(String(v));
}
const sideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test('the page: four sections in German, standards shown, reached from Ich', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info);
  await page.goto('./#/me');
  await page.locator('main').getByRole('link', { name: new RegExp(esc(T('Own values'))) }).click();
  await expect(page).toHaveURL(/#\/me\/werte$/);
  await expect(page.getByRole('heading', { level: 1, name: T('Own values') })).toBeVisible();
  for (const h of ['Pack|stage', 'Bike', 'Data', 'Suggestions']) await expect(page.locator('main').getByRole('heading', { level: 2, name: T(h) })).toBeVisible();
  await expect(row(page, 'backupDays')).toContainText(T('Standard: {value}', { value: tn(FIELD.backupDays.std, '{n} day', '{n} days') }));
  await expect(row(page, 'checkKm')).toContainText(T('Standard: {value}', { value: T('{km} km', { km: FIELD.checkKm.std.toLocaleString('de-CH') }) }));
  await expect(row(page, 'waxKm')).toContainText(T('Standard: {value}', { value: T('{km} km', { km: String(FIELD.waxKm.std) }) }));
  await expect(row(page, 'workshopDays')).toContainText(T('Standard: {value}', { value: tn(FIELD.workshopDays.std, '{n} day', '{n} days') }));
  await expect(row(page, 'coldC')).toContainText(T('Standard: {value}', { value: T('{n} °C', { n: FIELD.coldC.std }) }));
  // nothing changed: no «Auf Standard zurück»
  await expect(page.locator('[data-own-reset]')).toHaveCount(0);
  // the care per part lives at the bike, the page links there
  await expect(page.locator('main a[href="#/bikes?tab=care"]')).toContainText(T('Care per bike'));
  expect(await sideways(page)).toBe(0);
  // one value adapted: the mark and «Auf Standard zurück» show
  await row(page, 'packDays').getByRole('button', { name: T('More: {name}', { name: T(FIELD.packDays.name) }) }).click();
  await expect(row(page, 'packDays').getByRole('button', { name: T('Back to Standard|value') })).toBeVisible();
  expect(await sideways(page)).toBe(0);
  // SHOTS=<folder>: the page as a picture for Noah (viewport, light)
  if (process.env.SHOTS) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${process.env.SHOTS}/werte-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  expect(errors).toEqual([]);
});

test('backup days: the reminder on Ich follows, and back to Standard', async ({ page, context }, info) => {
  // the last backup 8 calendar days ago (noon Zurich): not due with 14 days, due with 7
  await start(page, context, info, { meta: [{ key: 'lastBackup', at: new Date(`${day(-8)}T12:00:00+02:00`).toISOString() }] });
  await page.goto('./#/me');
  await expect(page.getByRole('heading', { level: 1, name: T('Me|place') })).toBeVisible();
  await expect(page.getByRole('heading', { name: T('Backup due') })).toHaveCount(0);

  await page.goto('./#/me/werte');
  await setValue(page, 'backupDays', 7);
  await expect.poll(() => stored(page)).toEqual({ backupDays: 7 });
  await expect(row(page, 'backupDays')).toContainText(T('Adapted'));
  await page.goto('./#/me');
  await expect(page.getByRole('heading', { name: T('Backup due') })).toBeVisible();

  await page.goto('./#/me/werte');
  await row(page, 'backupDays').getByRole('button', { name: T('Back to Standard|value') }).click();
  await expect.poll(() => stored(page)).toBe(null);
  await expect(row(page, 'backupDays').getByRole('textbox')).toHaveValue(String(FIELD.backupDays.std));
  await page.goto('./#/me');
  await expect(page.getByRole('heading', { level: 1, name: T('Me|place') })).toBeVisible();
  await expect(page.getByRole('heading', { name: T('Backup due') })).toHaveCount(0);
});

test('pack days: a trip in 3 days is packing when packing starts 3 days before', async ({ page, context }, info) => {
  await start(page, context, info, { trips: [trip('gtp-ew1', 'Drei Tage', day(3))] });
  // Touren: the trip's link names its step (phase.js currentStep)
  const link = (step) => page.locator('main').getByRole('link', { name: `${T(step)}: test_data_gtp_ Drei Tage` });
  await page.goto('./#/trips');
  await expect(link('Continue to Plan')).toBeVisible();
  await expect(link('Continue to Pack')).toHaveCount(0);

  await page.goto('./#/me/werte');
  // the plus button: 2 → 3
  await row(page, 'packDays').getByRole('button', { name: T('More: {name}', { name: T(FIELD.packDays.name) }) }).click();
  await expect.poll(() => stored(page)).toEqual({ packDays: 3 });
  await page.goto('./#/trips');
  await expect(link('Continue to Pack')).toBeVisible();
});

test('cold: the temperature rule the app suggests follows', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.goto('./#/me/werte');
  await setValue(page, 'coldC', 6);
  await expect.poll(() => stored(page)).toEqual({ coldC: 6 });
  // a new item: the field «Add when colder than (°C)» shows the own number as its example
  await page.goto('./#/gear');
  await page.locator('main').getByRole('button', { name: T('Add item') }).first().click();
  const dialog = page.locator('dialog[open]');
  await dialog.locator('details.more > summary').click();
  await dialog.locator('details[data-fold="rules"] > summary').click();
  await expect(dialog.getByPlaceholder(T('e.g. {x}', { x: '6' }))).toBeVisible();
});

test('hot from and the evening-before reminder: settings only, standards 30 C and 19:00', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.goto('./#/me/werte');
  await expect(row(page, 'hotC')).toContainText(T('From this temperature the app warns you on the morning of the tour day.'));
  await expect(row(page, 'hotC')).toContainText(T('Standard: {value}', { value: T('{n} °C', { n: 30 }) }));
  await expect(row(page, 'eveRemindAt')).toContainText(T('Standard: {value}', { value: T('{time}|clock', { time: '19:00' }) }));
  // a time in 15-minute steps: 20:37 becomes 20:30, the plus button adds 15 minutes
  await row(page, 'eveRemindAt').getByRole('textbox', { name: T(FIELD.eveRemindAt.name) }).fill('20:37');
  await row(page, 'eveRemindAt').getByRole('textbox', { name: T(FIELD.eveRemindAt.name) }).press('Enter');
  await expect.poll(() => stored(page)).toEqual({ eveRemindAt: 20 * 60 + 30 });
  await expect(row(page, 'eveRemindAt').getByRole('textbox')).toHaveValue('20:30');
  await row(page, 'eveRemindAt').getByRole('button', { name: T('More: {name}', { name: T(FIELD.eveRemindAt.name) }) }).click();
  await expect(row(page, 'eveRemindAt').getByRole('textbox')).toHaveValue('20:45');
  await setValue(page, 'hotC', 33);
  await expect.poll(() => stored(page)).toEqual({ eveRemindAt: 20 * 60 + 45, hotC: 33 });
  await row(page, 'eveRemindAt').getByRole('button', { name: T('Back to Standard|value') }).click();
  await row(page, 'hotC').getByRole('button', { name: T('Back to Standard|value') }).click();
  await expect.poll(() => stored(page)).toBe(null);
});
