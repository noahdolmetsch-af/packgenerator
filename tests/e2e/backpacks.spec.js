// v0.37.0 "Rucksäcke" (Noah 1a–5a), German UI, phone and desktop, fictional data only
// (fixture.json plus test_data_gtp_ backpacks and trips; nothing leaves the preview server):
// 1. a hiking trip on the generic "Backpack 30 L" shows the quiet "Echten Rucksack wählen"; the sheet
//    suggests the 15 L pack made for hiking (by litres and area); after choosing it the bag has its real
//    name, and the quiet litre badge says the items need more than its 15 L;
// 2. a bike trip puts a hip bag on "Hüfte" and a running vest on "Rücken": their weight shows under
//    "Am Körper", the base weight (bike luggage) stays the same.
// V037_SHOTS=<folder> saves screenshots (Pack hiking, Pack bike, Bikes setup) there.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const P = 'test_data_gtp_';
const HIKE = `${P}trip-hike`;
const RIDE = `${P}trip-ultra`;
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });

function fixture(file) {
  const d = structuredClone(base);
  d.tables.items.push(
    { id: 'HK01', name: `${P}Wanderjacke`, category: 'offbike', weightG: 450, volumeL: 9, qty: 1, weightStatus: 'measured', carry: 'luggage', defaultBag: null, ownership: 'owned', role: null, sets: [], kits: [], domains: ['hiking'] },
    { id: 'HK02', name: `${P}Thermosflasche`, category: 'lux', weightG: 500, volumeL: 7, qty: 1, weightStatus: 'measured', carry: 'luggage', defaultBag: null, ownership: 'owned', role: null, sets: [], kits: [], domains: ['hiking'] },
  );
  d.tables.containers.push(
    { id: 'bag-gtp-run12', name: `${P}Laufrucksack 12 L`, slot: 'carry', volumeL: 12, itemId: null, weightG: 300, pieces: 1 },
    { id: 'bag-gtp-run15', name: `${P}Laufweste 15 L`, slot: 'carry', volumeL: 15, itemId: null, weightG: 350, pieces: 1, domains: ['hiking'] },
    { id: 'bag-gtp-hip', name: `${P}Hüfttasche 2 L`, slot: 'hip', volumeL: 2, itemId: null, weightG: 150, pieces: 1 },
  );
  const trip = { status: 'planned', days: 1, startDate: today(), ready: [], createdAt: new Date().toISOString() };
  d.tables.trips.push(
    { ...trip, id: HIKE, title: `${P}Wanderung`, domain: 'hiking', bikeId: null, bike: null, setup: {}, packs: [{ key: 'pack', name: 'Backpack 30 L', volumeL: 30 }], entries: [{ itemId: 'HK01', slot: 'pack', qty: 1, packed: false }, { itemId: 'HK02', slot: 'pack', qty: 1, packed: false }] },
    { ...trip, id: RIDE, title: `${P}Ultra`, domain: 'bikepacking', bikeId: 'bike-test', bike: 'Test gravel bike', setup: { seat: 'bag-TA01', frame: 'bag-TA02', top: 'bag-TA03' }, entries: [{ itemId: 'ON01', slot: 'body', qty: 1, packed: false }, { itemId: 'ON02', slot: 'body', qty: 1, packed: false }, { itemId: 'EL02', slot: 'top', qty: 1, packed: false }] },
  );
  d.tables.settings.push({ key: 'test_data_gtp_marker', value: 1 });
  writeFileSync(file, JSON.stringify(d));
}

const table = (page, name) =>
  page.evaluate((s) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(s).objectStore(s).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);

async function start(page, context, info) {
  const file = info.outputPath('base.json');
  fixture(file);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await expect.poll(async () => (await table(page, 'settings')).some((s) => s.key === 'test_data_gtp_marker')).toBe(true);
}

async function openTrip(page, id) {
  await page.evaluate((x) => localStorage.setItem('pack.currentTrip', x), id);
  await page.goto('./#/pack');
  await page.reload();
  await expect(page.locator('.trip-band')).toBeVisible();
}

async function fits(page, where) {
  await page.waitForTimeout(150);
  const { sw, w, wide } = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    w: innerWidth,
    wide: [...document.querySelectorAll('body *')].filter((el) => el.getBoundingClientRect().right > innerWidth + 1).slice(0, 4).map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`),
  }));
  expect(sw, `${where}: ${sw} px wide at ${w} px (${wide.join(', ')})`).toBeLessThanOrEqual(w);
}

const shots = process.env.V037_SHOTS;
async function shot(page, name, info) {
  if (!shots) return;
  mkdirSync(shots, { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${shots}/${name}-${info.project.name}.png`, fullPage: true });
}

test('Rucksaecke: a hiking trip picks a real backpack; litre badge only from known litres', async ({ page, context }, info) => {
  await start(page, context, info);
  await openTrip(page, HIKE);

  // The generic bag: a quiet way to the real one, no litre badge (30 L hold the 16 L).
  const groups = page.locator('.bag-group');
  const generic = groups.filter({ hasText: T('Backpack 30 L') });
  await expect(generic).toBeVisible();
  await expect(generic.locator('.tp-badge', { hasText: T('over {cap} L', { cap: 30 }) })).toHaveCount(0);
  const choose = generic.getByRole('button', { name: T('Choose a real backpack') });
  await expect(choose).toBeVisible();
  await fits(page, 'Pack, hiking, generic');
  await choose.click();

  // The sheet: the 15 L pack made for hiking is the suggestion (by litres and area).
  const sheet = page.getByRole('dialog', { name: T('Bags for this trip') });
  await expect(sheet).toBeVisible();
  const sel = sheet.getByLabel(T('Backpack 30 L'));
  await expect(sel.locator('option', { hasText: T('suggested') })).toHaveAttribute('value', 'bag-gtp-run15');
  await sel.selectOption('bag-gtp-run15');
  await expect.poll(async () => (await table(page, 'trips')).find((x) => x.id === HIKE).packs[0].bagId).toBe('bag-gtp-run15');
  await fits(page, 'Pack, hiking, bags sheet');
  await sheet.getByRole('button', { name: T('Done'), exact: true }).click();

  // The real bag: its name, no more "Choose", and a quiet badge: 9 + 7 L do not fit in 15 L.
  const real = groups.filter({ hasText: `${P}Laufweste 15 L` });
  await expect(real).toBeVisible();
  await expect(page.getByRole('button', { name: T('Choose a real backpack') })).toHaveCount(0);
  await expect(real.locator('.tp-badge', { hasText: T('over {cap} L', { cap: 15 }) })).toBeVisible();
  await real.locator('.bag-heading').click();
  await expect(real.getByText(T('The items with known litres need {need} L; the bag holds {cap} L.', { need: 16, cap: 15 }))).toBeVisible();
  // the generic bag is kept on the trip, as the way back
  expect((await table(page, 'trips')).find((x) => x.id === HIKE).packs[0]).toMatchObject({ key: 'pack', name: 'Backpack 30 L', volumeL: 30 });
  await fits(page, 'Pack, hiking, real backpack');
  await shot(page, 'pack-hiking', info);
});

test('Rucksaecke: a bike trip with a hip bag on Huefte and a vest on Ruecken counts them On me', async ({ page, context }, info) => {
  await start(page, context, info);
  await openTrip(page, RIDE);

  const weight = page.locator('details.weight-details');
  const cell = (label) => weight.locator('.weight-grid > div').filter({ has: page.locator('span', { hasText: new RegExp(`^${label}$`) }) }).locator('b.num');
  if (!(await weight.evaluate((d) => d.open))) await weight.locator('summary').click();
  await expect(cell(T('On you'))).toHaveText('330 g'); // bib shorts 190 + jersey 140
  const baseBefore = await cell(T('Base')).innerText();

  // Bags for this trip: the worn places under their own light header.
  await page.locator('details.list-menu > summary').click();
  await page.getByRole('button', { name: T('Bags for this trip') }).click();
  const sheet = page.getByRole('dialog', { name: T('Bags for this trip') });
  await expect(sheet.getByRole('heading', { name: new RegExp(T('On me')) })).toBeVisible();
  await sheet.getByLabel(T('Hip|worn'), { exact: true }).selectOption('bag-gtp-hip');
  await sheet.getByLabel(T('Back|worn'), { exact: true }).selectOption('bag-gtp-run15');
  await expect.poll(async () => (await table(page, 'trips')).find((x) => x.id === RIDE).setup).toMatchObject({ hip: 'bag-gtp-hip', carry: 'bag-gtp-run15' });
  await fits(page, 'Pack, bike, bags sheet');
  await sheet.getByRole('button', { name: T('Done'), exact: true }).click();

  // On me: 330 + hip bag 150 + vest 350; the base weight of the bike luggage stays.
  if (!(await weight.evaluate((d) => d.open))) await weight.locator('summary').click();
  await expect(cell(T('On you'))).toHaveText('830 g');
  await expect(cell(T('Base'))).toHaveText(baseBefore);
  await expect(weight.getByText(T('Back and Hip count to On you, not to the bike or the wheels.'))).toBeVisible();
  await fits(page, 'Pack, bike, worn bags');
  await shot(page, 'pack-bike', info);

  // Bikes → Setup: Rücken and Hüfte under "Am Körper", with their bags.
  await page.goto('./#/bikes');
  await page.reload();
  const worn = page.locator('.worn-h');
  await expect(worn).toContainText(T('On me'));
  await expect(page.locator('#slot-carry')).toContainText(T('Back|worn'));
  await expect(page.locator('#slot-hip')).toContainText(T('Hip|worn'));
  await fits(page, 'Bikes, setup');
  await shot(page, 'bikes-setup', info);
});
