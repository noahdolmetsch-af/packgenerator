// «Anprobe» (Noah 21.11.2026 «1-5a 4b», Weg A), German UI, phone and desktop: the way in from the wardrobe, the
// pieces for the temperature of the next tour, your own temperature, rain, the arrows, a gap with its reason,
// «Pack it for the tour» with Undo. Fictional data only (fixture.json + test_data_gtp_ clothes made here);
// every outside request is blocked. TRYON_SHOTS=<folder> saves the screenshots for the pull request.
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
const SHOTS = process.env.TRYON_SHOTS;

const cloth = (id, name, f = {}) => ({ id, name: `${P}${name}`, category: 'onbike', weightG: 100, qty: 1, weightStatus: 'measured', carry: 'body', defaultBag: 'body', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'], layer: 'mid', zone: 'torso', ...f });
const CLOTHES = [
  cloth('KL71', 'Merino', { layer: 'base', tempMin: 0, tempMax: 15, weightG: 180 }),
  cloth('KL72', 'Windweste', { layer: 'mid', tempMin: 5, tempMax: 18, weightG: 90 }),
  cloth('KL73', 'Fleece', { layer: 'mid', tempMin: -5, tempMax: 10, weightG: 300 }),
  cloth('KL74', 'Regenjacke', { layer: 'outer', tempMin: -2, tempMax: 18, weightG: 240 }),
  cloth('KL75', 'Beinlinge', { layer: 'mid', zone: 'legs', tempMin: 5, tempMax: 15, weightG: 110 }),
  cloth('KL76', 'Handschuhe dünn', { layer: 'accessory', zone: 'hands', tempMin: 10, tempMax: 18, weightG: 35 }),
];
const CLOTHING = ['onbike', 'rain', 'offbike', 'shoes'];
const day = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function fixture() {
  const data = structuredClone(base);
  const t = data.tables;
  // only the clothes made here, so the rows are known
  t.items = t.items.filter((i) => !CLOTHING.includes(i.category) && !i.layer && !i.zone);
  t.items.push(...CLOTHES.map((c) => ({ ...c })));
  t.settings.push(MARK);
  t.trips = [{ id: 'gtp-tour', title: `${P} Passfahrt`, domain: 'bikepacking', status: 'planned', wx: { min: 6, max: 14, rain: 'none' }, hours: 6, ready: [], startDate: day(2), days: 2, entries: [{ itemId: 'KL71', slot: 'body', qty: 1, packed: false }] }];
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
const tourEntries = async (page) => ((await table(page, 'trips')).find((x) => x.id === 'gtp-tour')?.entries ?? []).map((e) => e.itemId).sort();

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
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'desktop' ? '1440' : '390'}.png`, fullPage: false });
}

const row = (page, key) => page.locator(`[data-try-row="${key}"]`);
const pieceOf = (page, key) => row(page, key).locator('[data-try-piece]');

test('Anprobe: the way in, the tour temperature, your own, rain, arrows, a gap, pack with Undo', async ({ page, context }, info) => {
  const errors = await start(page, context, info);

  // the way in: «Passt hier» at the end of the wardrobe
  await page.goto('./#/wardrobe');
  await expect(page.getByRole('heading', { level: 1, name: T('Wardrobe') })).toBeVisible();
  await page.locator('[data-passt-hier="wardrobe"] [data-passt-item="f.wardrobetryon"]').click();
  await expect(page).toHaveURL(/#\/wardrobe\/tryon$/);
  await expect(page.getByRole('heading', { level: 1, name: T('Try on') })).toBeVisible();

  // it starts with the next tour: 6 °C (the coldest of its weather), the pieces per place
  await expect(page.locator('[data-try-start="trip"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-try-temp]')).toHaveText('6 °C');
  await expect(pieceOf(page, 'base')).toHaveText(`${P}Merino`);
  await expect(pieceOf(page, 'outer')).toHaveText(`${P}Regenjacke`);
  await expect(pieceOf(page, 'legs')).toHaveText(`${P}Beinlinge`);
  // the glove is made for 10 °C and warmer: a gap with its reason, no piece
  await expect(row(page, 'hands').locator('[data-try-gap="light"]')).toContainText(T('Your pieces here are made for {n} °C and warmer, not for {c} °C.', { n: 10, c: 6 }));
  await expect(page.locator('[data-try-sum]')).toContainText(T('{n} gaps', { n: 2 })); // hands and head
  await shot(page, info, 'anprobe-tour');
  await noSideScroll(page);

  // your own temperature: one degree warmer, and the pieces follow; the glove fits at 10 °C
  await page.locator('[data-try-up]').click();
  await expect(page.locator('[data-try-temp]')).toHaveText('7 °C');
  await expect(page.locator('[data-try-start="own"]')).toHaveAttribute('aria-pressed', 'true');
  for (let i = 0; i < 3; i++) await page.locator('[data-try-up]').click();
  await expect(page.locator('[data-try-temp]')).toHaveText('10 °C');
  await expect(pieceOf(page, 'hands')).toHaveText(`${P}Handschuhe dünn`);
  await expect(page.locator('[data-try-sum]')).not.toContainText(T('{n} gap', { n: 1 }));
  await expect(page.locator('[data-try-sum]')).not.toContainText(T('{n} gaps', { n: 2 }));
  // a warm day needs fewer places
  for (let i = 0; i < 6; i++) await page.locator('[data-try-up]').click();
  await expect(page.locator('[data-try-temp]')).toHaveText('16 °C');
  await expect(row(page, 'hands')).toHaveCount(0);

  // back to the tour; the arrows swap the mid layer for the next piece of that place, round and round
  await page.locator('[data-try-start="trip"]').click();
  await expect(page.locator('[data-try-temp]')).toHaveText('6 °C');
  const first = await pieceOf(page, 'mid').textContent();
  await page.locator('[data-try-next="mid"]').click();
  const second = await pieceOf(page, 'mid').textContent();
  expect(second).not.toBe(first);
  await page.locator('[data-try-prev="mid"]').click();
  await expect(pieceOf(page, 'mid')).toHaveText(first);
  // one piece in a place: nothing to swap to
  await expect(page.locator('[data-try-next="base"]')).toBeDisabled();

  // rain: the outer layer must keep rain out
  await page.locator('[data-try-rain]').check();
  await expect(pieceOf(page, 'outer')).toHaveText(`${P}Regenjacke`);
  await page.locator('[data-try-rain]').uncheck();

  // «Pack it for the tour»: the pieces shown (not those on the list) go on the list of the tour; Undo takes them off
  expect(await tourEntries(page)).toEqual(['KL71']);
  const pack = page.locator('[data-try-pack]');
  await expect(pack).toContainText('Passfahrt');
  await expect(pack).toContainText(T('Pack it for {trip}', { trip: '' }).trim().split(' ')[0]);
  await pack.click();
  const status = page.getByRole('status').filter({ hasText: 'Passfahrt' });
  await expect(status).toContainText(/3 Teile stehen auf der Liste von/);
  await expect.poll(async () => (await tourEntries(page)).length).toBe(4);
  expect(await tourEntries(page)).toEqual(expect.arrayContaining(['KL71', 'KL74', 'KL75']));
  await expect(pack).toBeDisabled();
  await shot(page, info, 'anprobe-eingepackt');
  await status.getByRole('button', { name: T('Undo') }).click();
  await expect.poll(() => tourEntries(page)).toEqual(['KL71']);
  await expect(pack).toBeEnabled();

  await noSideScroll(page);
  expect(errors).toEqual([]);
});

test('Anprobe: without sorted clothes it points to the setup', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  // the same clothes, none sorted into a layer or a body zone
  await page.evaluate(() => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const tx = r.result.transaction('items', 'readwrite');
      const st = tx.objectStore('items');
      st.getAll().onsuccess = (e) => {
        for (const i of e.target.result) if (i.id.startsWith('KL7')) { delete i.layer; delete i.zone; st.put(i); }
      };
      tx.oncomplete = () => { r.result.close(); ok(); };
    };
  }));
  await page.goto('./#/wardrobe/tryon');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: T('Try on') })).toBeVisible();
  await expect(page.getByText(T('No clothing sorted yet'))).toBeVisible();
  await page.getByRole('link', { name: T('Set up wardrobe') }).last().click();
  await expect(page).toHaveURL(/#\/wardrobe\/setup$/);
  expect(errors).toEqual([]);
});
