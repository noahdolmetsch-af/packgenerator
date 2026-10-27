// «Was ziehe ich an? selbst anpassen» step 1 (Noah 27.10.2026), German UI, phone and desktop: in the window on
// Today a gap says why and «Trotzdem» takes the warmest piece, «Tauschen» picks another piece, «+ Schicht dazu»
// adds a row the temperature does not need yet, «Warum so?» explains the rule, «Zurück zum Vorschlag» with Undo.
// Fictional data only (fixture.json + test_data_gtp_ clothes made here); outside requests are blocked, the home
// forecast (6 °C all day) is written into the app's database.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z0-9]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const P = 'test_data_gtp_';
const MARK = { key: 'test_data_gtp_marker', value: 1 };
const PLACE = { name: `${P}Testdorf, Testland`, lat: 46.5, lon: 7.5 };
const cloth = (id, name, f = {}) => ({ id, name: `${P}${name}`, category: 'onbike', weightG: 100, qty: 1, weightStatus: 'measured', carry: 'body', defaultBag: 'body', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'], ...f });
const CLOTHES = [
  cloth('KA01', 'Merino Langarm', { layer: 'base', zone: 'torso', tempMin: 0, tempMax: 15 }),
  cloth('KA02', 'Thermotrikot', { layer: 'mid', zone: 'torso', tempMin: -5, tempMax: 10 }),
  cloth('KA03', 'Langarm duenn', { layer: 'mid', zone: 'torso', tempMin: 12, tempMax: 18 }),
  cloth('KA04', 'Windjacke', { layer: 'outer', zone: 'torso', tempMin: 0, tempMax: 14 }),
  cloth('KA05', 'Winterhose', { layer: 'mid', zone: 'legs', tempMin: -5, tempMax: 10 }),
  cloth('KA06', 'Kurzfingerhandschuhe', { layer: 'accessory', zone: 'hands', tempMin: 15 }),
  cloth('KA07', 'Handschuhe lang'),
  cloth('KA08', 'Stirnband', { layer: 'accessory', zone: 'head', tempMin: 0, tempMax: 12 }),
  cloth('KA09', 'Ueberschuhe', { layer: 'accessory', zone: 'feet', tempMin: -5, tempMax: 8 }),
];

const table = (page, name) =>
  page.evaluate((s) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(s).objectStore(s).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);

const writeForecast = (page) =>
  page.evaluate((place) => new Promise((ok) => {
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const day = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
    const hourly = { t: Array(24).fill(6), p: Array(24).fill(0) };
    const rec = { key: 'homeForecast', fetchedAt: new Date().toISOString(), place, days: [0, 1].map((n) => ({ date: day(n), min: 6, max: 6, rainMm: 0, rainPct: 0, hourly })) };
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const tx = r.result.transaction('meta', 'readwrite');
      tx.objectStore('meta').put(rec);
      tx.oncomplete = () => { r.result.close(); ok(); };
    };
  }), PLACE);

test('Was ziehe ich an: gap with reason, take anyway, swap, add a layer, why, back with Undo', async ({ page, context }, info) => {
  const data = structuredClone(base);
  data.tables.items.push(...CLOTHES);
  data.tables.settings.push(MARK, { key: 'homePlace', value: PLACE });
  const file = info.outputPath('test_data_gtp_base.json');
  writeFileSync(file, JSON.stringify(data));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await expect.poll(async () => (await table(page, 'settings')).some((s) => s.key === MARK.key)).toBe(true);
  await writeForecast(page);
  await page.goto('./');
  await page.reload();

  await page.locator('[data-wear-open]').click();
  const card = page.locator('dialog.wear [data-wear-card]');
  await expect(card).toBeVisible();
  const row = (k) => card.locator(`[data-wear-row="${k}"]`);
  await expect(row('mid')).toContainText(`${P}Thermotrikot`);

  // the gap at the hands says why (pieces too light, one still to sort) and offers «Trotzdem»
  const gap = row('hands').locator('[data-wear-gap="light"]');
  await expect(gap).toContainText(T('Your pieces here are made for {n} °C and warmer. Today: {c} °C.', { n: 15, c: 6 }));
  await expect(gap.getByRole('link', { name: T('Sort them') })).toBeVisible();
  await gap.locator('[data-wear-anyway]').click();
  await expect(row('hands')).toContainText(`${P}Kurzfingerhandschuhe`);
  await expect(row('hands')).toContainText(T('chosen by you · today only'));

  // swap the mid layer to a lighter piece (marked as too light)
  await row('mid').locator('[data-wear-swap="mid"]').click();
  const opt = row('mid').locator('[data-wear-opt="KA03"]');
  await expect(opt).toContainText(T('too light for {c} °C', { c: 6 }));
  await opt.click();
  await expect(row('mid')).toContainText(`${P}Langarm duenn`);
  await expect.poll(async () => (await table(page, 'settings')).find((s) => s.key === 'wear.day')?.value?.pick?.mid).toBe('KA03');

  // feet are not needed at 6 °C: add them anyway
  await expect(row('feet')).toHaveCount(0);
  await card.locator('[data-wear-add]').click();
  await card.locator('[data-wear-addrow="feet"]').click();
  await expect(row('feet')).toContainText(`${P}Ueberschuhe`);
  await expect(row('feet')).toContainText(T('added by you · today only'));

  // «Warum so?»
  await card.locator('[data-wear-why] summary').click();
  await expect(card.locator('[data-wear-why]')).toContainText(T('The coldest hour of your ride: {c} °C.', { c: 6 }));

  // back to the suggestion, then Undo
  await card.locator('[data-wear-reset]').click();
  await expect(row('mid')).toContainText(`${P}Thermotrikot`);
  await expect(row('feet')).toHaveCount(0);
  await card.getByRole('status').getByRole('button', { name: T('Undo') }).click();
  await expect(row('mid')).toContainText(`${P}Langarm duenn`);
  await expect(row('feet')).toHaveCount(1);

  for (const w of [320, 390]) {
    const size = page.viewportSize();
    await page.setViewportSize({ width: w, height: size.height });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
    await page.setViewportSize(size);
  }
  expect(errors).toEqual([]);
});
