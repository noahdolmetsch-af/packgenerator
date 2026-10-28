// «Feierabend-Biwak» (Träume und Neuland N6, Noah 27.10.2026 «1-5 a»): on Touren › Träume the next Friday
// evening, the own (fictional) places to sleep near home, best rated first, the (faked) night's weather;
// «Plan it» makes a two-day trip with the bivouac building block; the evening can be changed and reset.
// Fictional data only, no real network.
import { test, expect } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const P = 'test_data_gtp_';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z ]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const BIKE = base.tables.bikes[0];
const SLEEP = base.tables.items.find((i) => i.category === 'sleep');
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (loc, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await loc.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png` });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const plus = (day, n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${day}T12:00:00Z`));
const wd = (day) => ((new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7) + 1;
// the next Friday (Saturday) from today; today only before 17:30 in Zürich
const nextOn = (weekday) => {
  const now = new Date().toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Zurich' });
  let n = (weekday - wd(today()) + 7) % 7;
  if (n === 0 && now >= '17:30') n = 7;
  return plus(today(), n);
};
const METEO = () => {
  const time = Array.from({ length: 16 }, (_, i) => plus(today(), i - 1));
  return { daily: { time, temperature_2m_min: time.map(() => 4), temperature_2m_max: time.map(() => 14), precipitation_sum: time.map(() => 0), precipitation_probability_max: time.map(() => 5) } };
};
const SPOTS = [
  { id: `${P}a`, kind: 'sleep', name: `${P}Waldlichtung`, note: '', lat: 47.45, lon: 8.6, stars: 3, createdAt: '2026-09-01T10:00:00Z' },
  { id: `${P}b`, kind: 'sleep', name: `${P}Hütte am Grat`, note: '', lat: 47.5, lon: 8.7, stars: 5, createdAt: '2026-09-02T10:00:00Z' },
  { id: `${P}c`, kind: 'sleep', name: `${P}Zu weit`, note: '', lat: 46.5, lon: 8.0, stars: 5, createdAt: '2026-09-03T10:00:00Z' },
];

async function put(page, store, rows) {
  await page.evaluate(
    ([name, list]) =>
      new Promise((ok, bad) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => bad(r.error);
        r.onsuccess = () => {
          const tx = r.result.transaction(name, 'readwrite');
          for (const row of list) tx.objectStore(name).put(row);
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = () => bad(tx.error);
        };
      }),
    [store, rows],
  );
}
const trips = (page) =>
  page.evaluate(
    () =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const q = r.result.transaction('trips').objectStore('trips').getAll();
          q.onsuccess = () => (r.result.close(), ok(q.result));
        };
      }),
  );

test('After-work bivouac: next Friday, own places to sleep near home, the night, plan it, change the evening', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/api\.open-meteo\.com\/v1\/forecast/, (r) => r.fulfill({ json: METEO() }));
  await context.route(/^https?:\/\/(?!localhost[:/])(?!api\.open-meteo\.com)/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/trips/dreams');
  await ready(page);
  const sec = page.locator('[data-biwak]');
  await expect(sec).toBeVisible();
  // without a home place: one button sets it
  await expect(sec.locator('[data-bw-home]')).toBeVisible();

  await put(page, 'settings', [
    { key: 'homePlace', value: { name: `${P}Zürich`, lat: 47.3769, lon: 8.5417 } },
    { key: 'own-points', value: { points: SPOTS } },
  ]);
  await put(page, 'bikes', [BIKE]);
  await put(page, 'items', [{ ...SLEEP, id: `${P}biwaksack`, name: `${P}Biwaksack`, sets: ['bivy'] }]);
  await page.reload();
  await ready(page);

  // 1. the next Friday, the places in reach (best first, the far one left out), the night's weather
  const fri = nextOn(5);
  const friName = new Date(`${fri}T12:00:00Z`).toLocaleDateString('de-CH', { weekday: 'short', timeZone: 'UTC' });
  await expect(sec.locator('[data-bw-when]')).toContainText(`${friName}`);
  await expect(sec.locator('[data-bw-when]')).toContainText('17:30');
  await expect(sec.locator('[data-bw-when]')).toContainText('9:00');
  const spots = sec.locator('[data-bw-spot]');
  await expect(spots).toHaveCount(2);
  await expect(spots.first()).toContainText(`${P}Hütte am Grat`);
  await expect(sec.locator('[data-bw-wx]')).toContainText('4°');
  await noSideways(page);
  await shot(sec, info, 'FB1-biwak');

  // 2. plan it: a two-day trip with the bivouac night and its block
  await spots.first().locator('[data-bw-plan]').click();
  const dlg = page.getByRole('dialog', { name: T('Plan the tour') });
  await expect(dlg).toBeVisible();
  await expect(dlg).toContainText(T('Two days with the bivouac building block: the packing list is ready'));
  await dlg.getByRole('radio', { name: BIKE.name }).check();
  await shot(dlg, info, 'FB2-planen');
  await dlg.getByRole('button', { name: T('Create the trip') }).click();
  await expect(page).toHaveURL(/#\/pack/);
  await expect.poll(async () => (await trips(page)).length).toBe(1);
  const [trip] = await trips(page);
  expect(trip.startDate).toBe(fri);
  expect(trip.days).toBe(2);
  expect(trip.overnight).toBe('outdoor');
  expect(trip.tent).toBe(false);
  expect(trip.entries.some((e) => e.itemId === `${P}biwaksack`)).toBe(true);
  expect(trip.note).toContain('17:30');

  // 3. change the evening to Saturday: the date moves; back to the suggestion
  await page.goto('./#/trips/dreams');
  await ready(page);
  await sec.locator('[data-bw-change]').click();
  await sec.locator('[data-bw-edit]').getByRole('button', { name: T('Sat|short'), exact: true }).click();
  const sat = nextOn(6);
  const satName = new Date(`${sat}T12:00:00Z`).toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', timeZone: 'UTC' });
  await expect(sec.locator('[data-bw-when]')).toContainText(satName);
  await shot(sec, info, 'FB3-aendern');
  await sec.locator('[data-bw-reset]').click();
  await expect(sec.locator('[data-bw-when]')).toContainText(friName);
  await noSideways(page);
  expect(errors).toEqual([]);
});

// Noah 28.10.2026 «2b»: on a tap, free places from OpenStreetMap (faked answer, fictional names), nearest first
const OSM = {
  elements: [
    { type: 'node', id: 1, lat: 47.42, lon: 8.56, tags: { tourism: 'camp_site', name: `${P}Zeltplatz am Bach` } },
    { type: 'node', id: 2, lat: 47.4, lon: 8.55, tags: { amenity: 'shelter', shelter_type: 'basic_hut', name: `${P}Waldhütte` } },
    { type: 'node', id: 3, lat: 46.6, lon: 8.1, tags: { tourism: 'wilderness_hut', name: `${P}Zu weit weg` } },
    { type: 'node', id: 4, lat: 47.41, lon: 8.57, tags: { tourism: 'camp_site', access: 'private', name: `${P}Privat` } },
  ],
};

test('After-work bivouac: free places from OpenStreetMap only on a tap', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  let asked = 0;
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.route(/overpass/, (r) => ((asked += 1), r.fulfill({ json: OSM, headers: { 'access-control-allow-origin': '*' } })));
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  await ready(page);
  await put(page, 'settings', [{ key: 'homePlace', value: { name: `${P}Zürich`, lat: 47.3769, lon: 8.5417 } }]);
  await put(page, 'bikes', [BIKE]);
  await page.goto('./#/trips/dreams');
  await page.reload();
  await ready(page);
  const sec = page.locator('[data-biwak]');
  await expect(sec.locator('[data-bw-none]')).toBeVisible();
  // nothing asked by itself
  await page.waitForTimeout(800);
  expect(asked).toBe(0);
  await sec.locator('[data-bw-osm]').click();
  const found = sec.locator('[data-bw-osm-spot]');
  await expect(found).toHaveCount(2);
  await expect(found.first()).toContainText(`${P}Waldhütte`);
  await expect(found.nth(1)).toContainText(`${P}Zeltplatz am Bach`);
  await expect(sec.locator('[data-bw-osm-credit]')).toContainText('OpenStreetMap');
  expect(asked).toBe(1);
  await noSideways(page);
  await shot(sec, info, 'FB4-osm');

  // «Plan it» at a found place opens the plan form with its name
  await found.first().locator('[data-bw-plan]').click();
  const dlg = page.getByRole('dialog', { name: T('Plan the tour') });
  await expect(dlg).toBeVisible();
  await expect.poll(() => dlg.locator('input, textarea').evaluateAll((els, n) => els.some((e) => e.value.includes(n)), `${P}Waldhütte`)).toBe(true);
  expect(errors).toEqual([]);
});
