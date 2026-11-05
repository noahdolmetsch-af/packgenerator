// «Tour-Ampel» (Noah 05.11.2026, Touren 3a): the card «Bereit zur Abfahrt?» on Pack before a trip: four lines
// (packed, weather, bike, devices), each with a sign and a word, a tap leads to what is open.
// German UI, fictional data (tests/e2e/fixture.json), nothing leaves the preview server.
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const TRIP = 'trip-test_data_gtp_ampel';

/** Today in Zurich, calendar-day arithmetic (never Date.now() + n days). */
const zurich = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const plusDays = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

function fixture(path, { packed = 6, weather = true } = {}) {
  const data = structuredClone(base);
  const bike = data.tables.bikes[0];
  const day = plusDays(zurich(), 5);
  const ids = ['EL01', 'EL02', 'LI01', 'LI02', 'RA01', 'RA02', 'TO01', 'TO02', 'TO03', 'HY02'];
  data.tables.trips.push({
    id: TRIP, domain: 'bikepacking', title: 'test_data_gtp_ Jura Runde', startDate: day, days: 1, bikeId: bike.id, bike: bike.name, setup: { ...bike.setup },
    entries: ids.map((itemId, i) => ({ itemId, slot: ['top', 'frame', 'seat'][i % 3], qty: 1, packed: i < packed })),
    ready: [{ id: 'wallet', label: 'Phone, wallet, keys', done: false }], charge: { EL01: true }, ride: null, hours: null, sets: {}, purpose: {}, status: 'planned', copiedFrom: null, createdAt: '2026-10-01T08:00:00.000Z',
    wx: { min: 15, max: 15, rain: 'none' },
    ...(weather ? { forecast: { at: `${zurich()}T08:00:00.000Z`, days: [{ date: day, min: 4, max: 9, rainMm: 0, rainPct: 0 }] } } : {}),
  });
  const today = zurich();
  data.tables.settings.push({ key: 'homeWindows', value: { eve: { done: today }, week: { done: today } } });
  writeFileSync(path, JSON.stringify(data));
}

async function start(page, context, info, opts) {
  const file = info.outputPath('tour-ampel.json');
  fixture(file, opts);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), TRIP);
  await page.goto('./#/pack');
  await page.reload();
  await expect(page.locator('main')).toBeVisible();
}

test('Tour-Ampel: four lines with sign and word; a tap on the packed line leads to the packing day', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info);
  const card = page.locator('[data-ampel]');
  await expect(card).toBeVisible();
  await expect(card.getByRole('heading', { name: T('Ready to go?') })).toBeVisible();
  await expect(card).toContainText(T('Almost ready'));
  await expect(card.locator('[data-ampel-row="pack"]')).toContainText(T('Packed {n} %', { n: '60' }));
  await expect(card.locator('[data-ampel-row="pack"]')).toContainText(T('To do|ampel'));
  await expect(card.locator('[data-ampel-row="weather"]')).toContainText(T('The forecast differs from your list'));
  await expect(card.locator('[data-ampel-row="power"]')).toContainText(T('Charged {done} of {total} devices', { done: '1', total: '4' }));
  await expect(card.locator('[data-ampel-row="bike"]')).toBeVisible();
  await card.locator('[data-ampel-row="pack"] button').click();
  await expect(page).toHaveURL(/#\/pack\?day/);
  expect(errors).toEqual([]);
});

test('Tour-Ampel: everything packed, no gap: the packed line turns green, the card is not ready while the devices are open', async ({ page, context }, info) => {
  await start(page, context, info, { packed: 10, weather: false });
  const card = page.locator('[data-ampel]');
  await expect(card.locator('[data-ampel-row="pack"]')).toContainText(T('Everything is packed'));
  await expect(card.locator('[data-ampel-row="weather"]')).toContainText(T('No forecast for these days yet'));
  await expect(card.locator('[data-ampel-row="pack"] button')).toHaveCount(0);
  // the devices are still open, so the card is not «Bereit» yet
  await expect(card).toContainText(T('Almost ready'));
});
