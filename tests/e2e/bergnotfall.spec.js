// Paket J «Berg, Schnee und Notfall» (Noah 19.10.2026 «1a und b … 2a 3a 4a, 5 nicht»): freezing level and
// fresh snow on the Skitouren page and in a ski tour's planning, the page «Berg und Notfall» with the Swiss
// sources, the emergency page with the position, the emergency QR with a .vcf, and the swisstopo map.
// German UI, fictional data (test_data_gtp_, Piz Beispiel, Testdorf, Erika Beispiel); the clock stands on
// Saturday 12 December 2026, 09:00. Open-Meteo answers from the test; every other host is cut off.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { mountainLinks } from '../../src/lib/mountain/sos.js';
import { importAndSettle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const D0 = '2026-12-12';
const day = (n) => new Date(Date.parse(`${D0}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const NEXT = 'test_data_gtp_j_next';
const PLACE = { name: 'test_data_gtp_ Testdorf', lat: 46.81, lon: 9.84 };

function fixture(path) {
  const data = structuredClone(base);
  data.tables.trips = [
    { id: NEXT, domain: 'ski', title: 'test_data_gtp_ Piz Beispiel', startDate: day(1), days: 1, bikeId: null, bike: null, setup: {}, packs: [{ key: 'pack', name: 'Backpack 30 L', volumeL: 30 }], entries: [], ready: [], status: 'planned', place: PLACE },
  ];
  data.tables.debriefs = [];
  writeFileSync(path, JSON.stringify(data));
}

/** Open-Meteo's answer: 3 days back, 16 ahead; fresh snow 5 cm a day before, 0 °C at 2100 m in the day. */
function meteo() {
  const days = Array.from({ length: 19 }, (_, n) => day(n - 3));
  const time = [];
  const fl = [];
  const depth = [];
  for (const d of days)
    for (let h = 0; h < 24; h++) {
      time.push(`${d}T${String(h).padStart(2, '0')}:00`);
      fl.push(h >= 6 && h <= 18 ? 1800 + h * 10 : 900);
      depth.push(0.6);
    }
  return { elevation: 1650, daily: { time: days, snowfall_sum: days.map((d) => (d < D0 ? 5 : d === day(1) ? 2 : 0)) }, hourly: { time, freezing_level_height: fl, snow_depth: depth } };
}

async function open(page, context, info, hash) {
  page.on('dialog', (d) => d.accept());
  if (process.env.J_DEBUG) page.on('console', (m) => console.log('CONSOLE', m.type(), m.text().slice(0, 300)));
  if (process.env.J_DEBUG) page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) =>
    /api\.open-meteo\.com/.test(route.request().url()) && /freezing_level_height/.test(route.request().url())
      ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(meteo()) })
      : route.abort(),
  );
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.setFixedTime(new Date(`${D0}T09:00:00+01:00`));
  const file = info.outputPath('j-fixture.json');
  fixture(file);
  await page.goto('./');
  await importAndSettle(page, file);
  await page.goto(`./${hash}`);
  await expect(page.locator('h1').first()).toBeVisible();
}

const table = (page, name) =>
  page.evaluate(async (n) => {
    const req = indexedDB.open('pack-generator');
    const db = await new Promise((r) => (req.onsuccess = () => r(req.result)));
    const tx = db.transaction(n).objectStore(n).getAll();
    const all = await new Promise((r) => (tx.onsuccess = () => r(tx.result)));
    db.close();
    return all;
  }, name);
/** J_SHOTS=<folder> saves the pages as pictures (phone 390, computer 1440) for a look. */
async function shot(page, info, name) {
  if (!process.env.J_SHOTS) return;
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${process.env.J_SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
}
const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

test('Skitouren: the snow line for the next tour, the row Berg und Notfall and the emergency numbers', async ({ page, context }, info) => {
  await open(page, context, info, '#/ski');
  const line = page.locator('[data-snow-line]');
  // 0 °C: the highest daytime level, 1800 + 18 h × 10 = 1980 → 2’000 m; fresh snow 5 + 5 + 0 cm in the 3 days before
  await expect(line).toContainText(T('Freezing level {m}', { m: '2’000 m' }));
  await expect(line).toContainText(T('Fresh snow {n} days: {cm}', { n: 3, cm: '10 cm' }));
  const saved = (await table(page, 'trips')).find((x) => x.id === NEXT).snow;
  expect(saved.place).toEqual(PLACE);
  expect(saved.elevation).toBe(1650);
  await expect(page.locator('[data-sos-line] a[data-call="1414"]')).toHaveAttribute('href', 'tel:1414');
  await expect(page.locator('[data-sos-line] a[data-call="112"]')).toHaveAttribute('href', 'tel:112');
  await shot(page, info, 'skitouren');
  await page.locator('[data-row="mountain"]').click();
  await expect(page.locator('h1')).toHaveText(T('Mountain and emergency'));
  expect(await noSideScroll(page)).toBe(true);
});

test('Pack Plan of a ski tour: the snow box, hide and show again, buttons to the map and the emergency', async ({ page, context }, info) => {
  await context.addInitScript((id) => localStorage.setItem('pack.currentTrip', id), NEXT);
  await open(page, context, info, '#/pack');
  // a ski tour has no bike: the route and the forecast sit behind the trip conditions' «Wetter»
  await page.getByRole('region', { name: T('Trip conditions') }).getByRole('button', { name: new RegExp(`^${T('Weather')}`) }).click();
  const box = page.locator('[data-snow]');
  await expect(box).toBeVisible();
  await expect(box.locator('li')).toHaveCount(1);
  await expect(box).toContainText(T('0° at {m}', { m: '2’000 m' }));
  await expect(box.locator('[data-fresh]')).toContainText('10 cm');
  await box.locator('[data-snow-off]').click();
  await expect(page.locator('[data-snow]')).toHaveCount(0);
  expect((await table(page, 'trips')).find((x) => x.id === NEXT).snowOff).toBe(true);
  await page.locator('[data-snow-on]').click();
  await expect(page.locator('[data-snow]')).toBeVisible();
  await shot(page, info, 'pack-schnee');
  await expect(page.locator('[data-mountain] [data-to="map"]')).toHaveAttribute('href', `#/mountain/map?trip=${NEXT}`);
  await expect(page.locator('[data-mountain] [data-to="sos"]')).toHaveAttribute('href', '#/mountain/sos');
});

test('Berg und Notfall: hide a Swiss source and show it again; emergency page with the position in LV95', async ({ page, context }, info) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 46.95108, longitude: 7.43864, accuracy: 8 });
  await open(page, context, info, '#/mountain');
  const links = mountainLinks('de');
  await expect(page.locator('[data-links] [data-link]')).toHaveCount(links.length);
  await page.locator('[data-hide="whiterisk"]').click();
  await expect(page.locator('[data-links] [data-link]')).toHaveCount(links.length - 1);
  await expect(page.locator('[data-link="whiterisk"]')).toHaveCount(0);
  await page.locator('[data-links-back]').click();
  await expect(page.locator('[data-link="whiterisk"]')).toHaveCount(1);
  await shot(page, info, 'berg-notfall');
  expect(await noSideScroll(page)).toBe(true);

  await page.locator('[data-to="sos"]').click();
  await expect(page.locator('h1')).toHaveText(T('Emergency'));
  await expect(page.locator('a[data-call="1414"]').first()).toHaveAttribute('href', 'tel:1414');
  await expect(page.locator('[data-wgs]')).toContainText('46.95108');
  await expect(page.locator('[data-lv95]')).toContainText(/2’6\d\d’\d{3} \/ 1’\d{3}’\d{3}/);
  await shot(page, info, 'notfall');
  await page.goto('./#/mountain/scales');
  await expect(page.locator('[data-sign]')).toHaveCount(3);
  await shot(page, info, 'skalen');
  expect(await noSideScroll(page)).toBe(true);
});

test('Notfall-QR: fill in, take a contact from a .vcf, the QR code shows, delete with Undo', async ({ page, context }, info) => {
  await open(page, context, info, '#/mountain/qr');
  await expect(page.locator('[data-qr]')).toHaveCount(0);
  await page.locator('[data-vcf]').setInputFiles({ name: 'kontakt.vcf', mimeType: 'text/vcard', buffer: Buffer.from('BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Erika Beispiel\r\nTEL;TYPE=CELL:+41 79 000 00 00\r\nEND:VCARD\r\n') });
  await expect(page.locator('[data-card="contact"]')).toHaveValue('Erika Beispiel');
  await expect(page.locator('[data-card="phone"]')).toHaveValue('+41 79 000 00 00');
  await page.locator('[data-card="allergies"]').fill('test_data_gtp_ Penicillin');
  await page.getByRole('button', { name: T('Save card') }).click();
  await expect(page.locator('[data-qr]')).toBeVisible();
  await expect(page.locator('[data-qr-text]')).toContainText(T('EMERGENCY / ICE'));
  await expect(page.locator('[data-qr-text]')).toContainText('Erika Beispiel');
  await shot(page, info, 'notfall-qr');
  const card = (await table(page, 'settings')).find((x) => x.key === 'sos.card').value;
  expect(card).toEqual({ contact: 'Erika Beispiel', phone: '+41 79 000 00 00', allergies: 'test_data_gtp_ Penicillin' });
  if (info.project.name === 'desktop') {
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('[data-image]').click()]);
    expect(download.suggestedFilename()).toBe(T('emergency-lock-screen.png'));
  }
  await page.locator('[data-clear]').click();
  await page.getByRole('dialog').getByRole('button', { name: T('Delete') }).click();
  await expect(page.locator('[data-qr]')).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo') }).click();
  await expect(page.locator('[data-qr]')).toBeVisible();
  await expect(page.locator('[data-card="contact"]')).toHaveValue('Erika Beispiel');
});

test('Karte: the swisstopo map opens at the tour place, layers switch and are remembered', async ({ page, context }, info) => {
  await open(page, context, info, `#/mountain/map?trip=${NEXT}`);
  await expect(page.locator('h1')).toHaveText(T('Map with steep slopes'));
  const map = page.locator('[data-swiss-map]');
  await expect(map.locator('.leaflet-tile-pane')).toHaveCount(1);
  await expect(page.locator('[data-layer="slope"]')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('[data-layer="hike"]')).toHaveAttribute('aria-checked', 'false');
  // December: the winter map
  await expect(page.locator('[data-base="winter"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-layer="hike"]').click();
  await expect(page.locator('[data-layer="hike"]')).toHaveAttribute('aria-checked', 'true');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mountain.map')));
  expect(saved.on).toEqual(['slope', 'ski', 'hike']);
  await shot(page, info, 'karte');
  expect(await noSideScroll(page)).toBe(true);
});
