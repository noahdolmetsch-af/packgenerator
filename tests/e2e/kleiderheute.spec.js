// Kleider «heute» (Noah 23.11.2026), German UI, phone and desktop: the suggestion for a cold, rainy day takes only pieces
// that say what they are made for (a gap instead of a guess), the wardrobe tidies up by suggestion («Aufräumen»: no
// range, everyday pieces, the same piece twice; every tap has an Undo), wishes stand apart, an odd weight says
// «prüfen?», and «Was ziehe ich heute an?» is offered once. Fictional data only (fixture.json + test_data_gtp_ clothes
// made here); every outside request is blocked. KLEIDERHEUTE_SHOTS=<folder> saves the screenshots for the pull request.
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';
import { openLayers } from './wardrobe-open.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z0-9]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const P = 'test_data_gtp_';
const MARK = { key: 'test_data_gtp_marker', value: 1 };
const PLACE = { name: `${P}Testdorf, Testland`, lat: 46.5, lon: 7.5 };
const SHOTS = process.env.KLEIDERHEUTE_SHOTS;
const CLOTHING = ['onbike', 'rain', 'offbike', 'shoes'];

const cloth = (id, name, f = {}) => ({ id, name: `${P}${name}`, category: 'onbike', weightG: 100, qty: 1, weightStatus: 'measured', carry: 'body', defaultBag: 'body', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'], ...f });
const CLOTHES = [
  cloth('KH01', 'Baselayer duenn', { layer: 'base', zone: 'torso', tempMin: 4, tempMax: 35, weightG: 50 }),
  cloth('KH02', 'Langarmtrikot ultraduenn (warme Fahrten)', { layer: 'mid', zone: 'torso', weightG: 145 }),
  cloth('KH03', 'Fleecepulli', { layer: 'mid', zone: 'torso', tempMin: -5, tempMax: 10, weightG: 300 }),
  cloth('KH04', 'Regenjacke', { layer: 'outer', zone: 'torso', tempMin: -2, tempMax: 18, weightG: 240, category: 'rain' }),
  cloth('KH05', 'Bib kurz', { layer: 'base', zone: 'legs', tempMin: 4, tempMax: 35, weightG: 150 }),
  cloth('KH06', 'Winter-Tights lang', { layer: 'base', zone: 'legs', tempMin: -15, tempMax: 4, weightG: 300 }),
  cloth('KH07', 'Brillen-Etui', { layer: 'accessory', zone: 'head', weightG: 1 }),
  cloth('KH08', 'Chaeppli dick', { layer: 'accessory', zone: 'head', tempClass: 'kalt', weightG: 45 }),
  cloth('KH09', 'Latexhandschuhe', { layer: 'accessory', zone: 'hands', weightG: 5 }),
  cloth('KH10', 'Badehose', { layer: 'base', zone: 'legs' }),
  cloth('KH11', 'Badehose', { layer: 'base', zone: 'legs' }),
  cloth('KH12', 'Flip-Flops', { layer: 'accessory', zone: 'feet' }),
  cloth('KH13', 'Fleecehose', { layer: 'mid', zone: 'legs', weightG: 200 }),
  cloth('KH14', 'Daunenjacke Ultralight', { layer: 'outer', zone: 'torso', ownership: 'wishlist', weightG: 369 }),
  cloth('KH15', 'Regenschuhe', { layer: 'accessory', zone: 'feet', tempClass: 'kalt', weightG: 1000 }),
];

function fixture() {
  const data = structuredClone(base);
  const t = data.tables;
  t.items = t.items.filter((i) => !CLOTHING.includes(i.category) && !i.layer && !i.zone);
  t.items.push(...CLOTHES.map((c) => ({ ...c })));
  t.settings.push(MARK, { key: 'homePlace', value: PLACE });
  return data;
}

const table = (page, name) =>
  page.evaluate((s) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(s).objectStore(s).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);
const item = async (page, id) => (await table(page, 'items')).find((i) => i.id === id);

/** The home forecast as the app saves it (meta "homeForecast"): today and tomorrow, 4 °C and rain all day. */
const writeForecast = (page) =>
  page.evaluate((place) => new Promise((ok) => {
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const day = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
    const hourly = { t: Array(24).fill(4), p: Array(24).fill(70) };
    const rec = { key: 'homeForecast', fetchedAt: new Date().toISOString(), place, days: [0, 1].map((n) => ({ date: day(n), min: 4, max: 4, rain: 'rain', rainMm: 3, rainPct: 70, hourly })) };
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const tx = r.result.transaction('meta', 'readwrite');
      tx.objectStore('meta').put(rec);
      tx.oncomplete = () => { r.result.close(); ok(); };
    };
  }), PLACE);

async function start(page, context, info) {
  const file = info.outputPath('test_data_gtp_base.json');
  writeFileSync(file, JSON.stringify(fixture()));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await expect.poll(async () => (await table(page, 'settings')).some((s) => s.key === MARK.key)).toBe(true);
  return errors;
}

async function shot(page, info, name, loc = null) {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  const file = `${SHOTS}/${name}-${info.project.name}.png`;
  if (loc) await loc.screenshot({ path: file });
  else await page.screenshot({ path: file, fullPage: true });
}

async function noSideScroll(page) {
  const size = page.viewportSize();
  for (const w of [320, 390]) {
    await page.setViewportSize({ width: w, height: size.height });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
  }
  await page.setViewportSize(size);
}

test('Kleider heute: cold suggestion, tidy up by suggestion, wishes apart, odd weight, one button', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await writeForecast(page);
  await page.goto('./#/wardrobe');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: T('Wardrobe') })).toBeVisible();
  const toggle = page.locator('button.wear-btn');
  await expect(toggle).toContainText('4°');

  // 1. The suggestion at 4 °C and rain: the piece without a range is not guessed; long legs, a cap with a class.
  await toggle.click();
  const card = page.locator('#w-today');
  await expect(card).toContainText(`${P}Fleecepulli`);
  await expect(card).toContainText(`${P}Regenjacke`);
  await expect(card).toContainText(`${P}Winter-Tights lang`);
  await expect(card).toContainText(`${P}Chaeppli dick`);
  for (const bad of ['ultraduenn', 'Bib kurz', 'Brillen-Etui']) await expect(card).not.toContainText(bad);
  await expect(card).toContainText(T('Hands') + ': ' + T('nothing warm enough')); // the latex gloves say no range: a gap, with its reason
  await shot(page, info, 'heute-vorschlag', card);

  // 6. «Was ziehe ich heute an?» once: the button, not also a jump chip
  await expect(page.getByRole('button', { name: T('What do I wear today?') })).toHaveCount(1);

  // 2.-4. Tidy up: a closed line with the number, then the three lists
  const tidy = page.locator('[data-tidy]');
  await expect(tidy.locator('.pill')).toBeVisible();
  await tidy.getByRole('button', { name: T('Tidy up') }).click();
  await expect(tidy.locator('[data-tidy-range] li').first()).toBeVisible();
  await shot(page, info, 'heute-aufraeumen', tidy);

  // no range: one tap sets the suggested range (Fleecehose: «cool, cold»), Undo takes it back
  const row = tidy.locator('[data-range-id="KH13"]');
  await expect(row).toBeVisible();
  await row.locator('.chip').click();
  await expect.poll(async () => (await item(page, 'KH13')).tempMin).not.toBeUndefined();
  expect(typeof (await item(page, 'KH13')).tempMin).toBe('number');
  await expect(row).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo'), exact: true }).first().click();
  await expect.poll(async () => (await item(page, 'KH13')).tempMin ?? null).toBeNull();

  // everyday: the swimming trunks and flip-flops are suggested; a tap moves, «stays» keeps, nothing by itself
  await expect(tidy.locator('[data-tidy-everyday] li')).toHaveCount(3); // 2 × Badehose + Flip-Flops
  expect((await item(page, 'KH12')).domains).toEqual(['bikepacking']);
  await tidy.locator('[data-everyday-id="KH12"] .chip').click();
  await expect.poll(async () => (await item(page, 'KH12')).domains).toEqual(['everyday']);
  await tidy.locator('[data-everyday-id="KH10"] .other').click();
  await expect(tidy.locator('[data-everyday-id="KH10"]')).toHaveCount(0);
  expect((await item(page, 'KH10')).domains).toEqual(['bikepacking']);

  // the same piece twice: a suggestion to merge; nothing is deleted (the second is archived), Undo restores it
  const twice = tidy.locator('[data-tidy-twice] li');
  await expect(twice).toHaveCount(1);
  await expect(twice).toContainText('×2');
  await twice.locator('.chip').click();
  await expect.poll(async () => (await item(page, 'KH11')).ownership).toBe('gone');
  expect(await item(page, 'KH11')).toBeTruthy();
  await page.getByRole('button', { name: T('Undo'), exact: true }).first().click();
  await expect.poll(async () => (await item(page, 'KH11')).ownership).toBe('owned');

  // 5. wishes apart; 6. weights: «prüfen?» at 1 g and exactly 1 kg
  await openLayers(page); // a phone starts with every layer as one closed line
  const wishes = page.locator('[data-wishes]');
  await expect(wishes).toContainText(`${P}Daunenjacke Ultralight`);
  await expect(page.locator('section.layer', { hasText: `${P}Daunenjacke Ultralight` })).toHaveCount(0);
  await expect(page.locator('.badge.warn')).toHaveCount(2); // Brillen-Etui 1 g, Regenschuhe 1 kg
  await shot(page, info, 'heute-wunschliste', wishes);
  await noSideScroll(page);
  expect(errors).toEqual([]);
});
