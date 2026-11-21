// «Kleiderschrank einrichten» (Noah 21.11.2026 «1-5a 4b», Weg C), German UI, phone and desktop: the line in the wardrobe,
// one piece after the other with the suggestion preselected, save with Undo, a piece without a place needs one,
// Skip, «I do not have it any more», the skipped ones come back, the end says what is next.
// Fictional data only (fixture.json + test_data_gtp_ clothes made here); every outside request is blocked.
// SETUP_SHOTS=<folder> saves the screenshots for the pull request.
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
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
const SHOTS = process.env.SETUP_SHOTS;

const cloth = (id, name, f = {}) => ({ id, name: `${P}${name}`, category: 'onbike', weightG: 100, qty: 1, weightStatus: 'measured', carry: 'body', defaultBag: 'body', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'], ...f });
const CLOTHES = [
  cloth('KL61', 'Windweste', { weightG: 90 }),
  cloth('KL62', 'Beinlinge', { layer: 'mid', zone: 'legs', weightG: 110 }),
  cloth('KL63', 'Handschuhe dünn', { weightG: 35 }),
  cloth('KL64', 'Gummiente', { weightG: 20 }),
  cloth('KL65', 'Regenjacke', { layer: 'outer', zone: 'torso', tempMin: -2, tempMax: 18, weightG: 240 }),
];
const CLOTHING = ['onbike', 'rain', 'offbike', 'shoes'];

function fixture() {
  const data = structuredClone(base);
  // only the clothes made here, so the queue is known
  data.tables.items = data.tables.items.filter((i) => !CLOTHING.includes(i.category) && !i.layer && !i.zone);
  data.tables.items.push(...CLOTHES);
  data.tables.settings.push(MARK);
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

async function noSideScroll(page) {
  const size = page.viewportSize();
  for (const w of [320, 390]) {
    await page.setViewportSize({ width: w, height: size.height });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
  }
  await page.setViewportSize(size);
}

async function shot(page, info, name) {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  const size = page.viewportSize();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'desktop' ? '1440' : '390'}.png`, fullPage: false });
  await page.setViewportSize(size);
}

const card = (page) => page.locator('[data-setup-card]');
const heading = (page) => card(page).getByRole('heading', { level: 2 });
const level = (page, key) => card(page).locator(`[data-level="${key}"]`);
const save = (page) => card(page).locator('[data-setup-save]');

test('Kleiderschrank einrichten: suggestion, save with Undo, a place for the unknown, skip, gone, the end', async ({ page, context }, info) => {
  const errors = await start(page, context, info);

  // the wardrobe says how many pieces still lack a temperature or a place, and leads there
  await page.goto('./#/wardrobe');
  await expect(page.getByRole('heading', { level: 1, name: T('Wardrobe') })).toBeVisible();
  const hint = page.locator('[data-setup-hint]');
  await expect(hint).toContainText(T('{n} pieces still without temperature or place', { n: 4 }));
  await shot(page, info, 'kleider-hinweis');
  await hint.getByRole('link', { name: T('Set up wardrobe') }).click();
  await expect(page).toHaveURL(/#\/wardrobe\/setup$/);
  await expect(page.getByRole('heading', { level: 1, name: T('Set up wardrobe') })).toBeVisible();

  // 1. Beinlinge: layer and zone are known, the name suggests Mild and Cool, nothing is changed yet
  await expect(heading(page)).toContainText('Beinlinge');
  await expect(card(page).locator('[data-place]')).toHaveText(`${T('Mid|layer')} · ${T('Legs')}`);
  await expect(level(page, 'mild')).toHaveAttribute('aria-pressed', 'true');
  await expect(level(page, 'cool')).toHaveAttribute('aria-pressed', 'true');
  await expect(level(page, 'warm')).toHaveAttribute('aria-pressed', 'false');
  await expect(card(page).locator('[data-range]')).toContainText('5–20 °C');
  expect((await item(page, 'KL62')).tempMin).toBeUndefined();
  await shot(page, info, 'einrichten-vorschlag');
  await noSideScroll(page);
  // a tap on a chip changes the steps: Cool alone, then Cool and Cold
  await level(page, 'mild').click();
  await expect(level(page, 'mild')).toHaveAttribute('aria-pressed', 'false');
  await level(page, 'cold').click();
  await expect(card(page).locator('[data-range]')).toContainText('0–12 °C');
  await level(page, 'cold').click();
  await level(page, 'mild').click();
  await expect(card(page).locator('[data-range]')).toContainText('5–20 °C');
  await save(page).click();
  await expect.poll(async () => (await item(page, 'KL62'))?.tempMax).toBe(20);
  expect(await item(page, 'KL62')).toMatchObject({ tempMin: 5, tempMax: 20, layer: 'mid', zone: 'legs' });
  const toast = page.getByRole('status').filter({ hasText: T('{name} saved', { name: `${P}Beinlinge` }) });
  await expect(toast).toBeVisible();
  await toast.getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await item(page, 'KL62')).tempMin).toBeUndefined();
  await expect(heading(page)).toContainText('Beinlinge'); // the piece is back
  await save(page).click();
  await expect.poll(async () => (await item(page, 'KL62'))?.tempMax).toBe(20);

  // 2. Gummiente: the name says nothing, there is no layer or zone: saving needs both and a temperature
  await expect(heading(page)).toContainText('Gummiente');
  await expect(save(page)).toBeDisabled();
  await level(page, 'cold').click();
  await expect(save(page)).toBeDisabled();
  await card(page).getByRole('button', { name: T('Base|layer'), exact: true }).click();
  await card(page).getByRole('button', { name: T('Legs'), exact: true }).click();
  await expect(save(page)).toBeEnabled();
  await shot(page, info, 'einrichten-eigene-wahl');
  await save(page).click();
  await expect.poll(async () => (await item(page, 'KL64'))?.tempMax).toBe(5);
  expect(await item(page, 'KL64')).toMatchObject({ tempMin: 0, tempMax: 5, layer: 'base', zone: 'legs' });

  // 3. Handschuhe dünn: skip leaves everything as it is
  await expect(heading(page)).toContainText('Handschuhe');
  await expect(level(page, 'cool')).toHaveAttribute('aria-pressed', 'true'); // a thin glove is for the cool days
  await card(page).locator('[data-setup-skip]').click();
  expect((await item(page, 'KL63')).tempMin).toBeUndefined();

  // 4. Windweste: «I do not have it any more» puts it to Gone, with Undo
  await expect(heading(page)).toContainText('Windweste');
  await card(page).locator('[data-setup-gone]').click();
  await expect.poll(async () => (await item(page, 'KL61')).ownership).toBe('gone');

  // the end: one piece is skipped, the rest is done; the skipped one comes back on request
  const done = page.locator('[data-setup-done]');
  await expect(done).toContainText(T('{n} piece is skipped. The rest has its temperature, layer and body zone.', { n: 1 }));
  await shot(page, info, 'einrichten-fertig');
  await done.getByRole('button', { name: T('Show the skipped ones') }).click();
  await expect(heading(page)).toContainText('Handschuhe');
  await save(page).click();
  await expect.poll(async () => (await item(page, 'KL63'))?.tempMax).toBe(20);
  expect(await item(page, 'KL63')).toMatchObject({ layer: 'accessory', zone: 'hands', tempMin: 5 });
  await expect(done).toContainText(T('Every piece has its temperature, layer and body zone. The onion can think along now.'));
  await expect(done).toContainText(T('Next: Today now suggests what to wear.'));
  await done.getByRole('link', { name: T('Open the wardrobe') }).click();
  await expect(page).toHaveURL(/#\/wardrobe$/);
  await expect(page.locator('[data-setup-hint]')).toHaveCount(0);

  await noSideScroll(page);
  expect(errors).toEqual([]);
});
