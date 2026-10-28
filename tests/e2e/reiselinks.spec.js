// «Reise-Links» (Noah 19.10.2026 «1b 2b 3a 4a 5b»): at a trip, «Anreise und Unterkunft» with Booking.com,
// Airbnb and Hostelworld for its nights, the flight number for Flightradar24 and the links for abroad; the page
// Touren › Reise-Links. German UI, fictional data (test_data_gtp_), no outside site is reached.
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
// calendar days in Europe/Zurich
const day = (n = 0) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const PLACE = { name: 'test_data_gtp_ Lisboa', detail: 'Lisboa, Portugal', lat: 38.72, lon: -9.14 };

function fixtureFile(info) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const path = `${info.project.outputDir}/reiselinks-${info.testId}.json`;
  const data = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  for (const tr of data.tables.trips) Object.assign(tr, { place: PLACE, overnight: 'lodging', days: 2 });
  writeFileSync(path, JSON.stringify(data));
  return path;
}

async function start(page, context, info, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(fixtureFile(info));
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  await page.goto(hash);
  return errors;
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

test('a trip abroad with a hotel night: stay links for its nights, a flight number gives Flightradar24', async ({ page, context }, info) => {
  const errors = await start(page, context, info, './#/pack?weather');
  const sheet = page.locator('dialog[open]');
  await expect(sheet.getByRole('heading', { name: T('Edit trip conditions') })).toBeVisible();
  const box = sheet.locator('[data-travel-links]');
  await box.scrollIntoViewIfNeeded();
  await expect(sheet.getByText(T('Getting there and staying'), { exact: true })).toBeVisible();
  const booking = box.locator('[data-sk-link="xbk"]');
  await expect(booking).toHaveAttribute('target', '_blank');
  await expect(booking).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(booking).toHaveAttribute('href', /^https:\/\/www\.booking\.com\/searchresults\.de\.html\?ss=test_data_gtp_%20Lisboa&checkin=\d{4}-\d\d-\d\d&checkout=\d{4}-\d\d-\d\d&group_adults=1&no_rooms=1$/);
  for (const kind of ['xab', 'xhw', 'xgf', 'xcar', 'xr2r', 'xeda', 'xwv']) await expect(box.locator(`[data-sk-link="${kind}"]`)).toHaveCount(1);
  await expect(box.locator('[data-sk-link="xfr"]')).toHaveCount(0);
  // the flight number: a wrong one says how, a right one is stored and gives the link
  const input = box.getByLabel(T('Flight number (if you fly)'));
  await input.fill('hallo');
  await expect(box.getByRole('alert')).toHaveText(T('Two letters and the number, e.g. LX 1234.'));
  await input.fill('lx 1234');
  await input.press('Enter');
  await input.blur();
  await expect(box.locator('[data-sk-link="xfr"]')).toHaveAttribute('href', 'https://www.flightradar24.com/data/flights/lx1234');
  await expect.poll(async () => (await trips(page)).some((x) => x.flight === 'LX1234')).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test('Touren › Reise-Links: all links in groups, a flight number gives the link at once', async ({ page, context }, info) => {
  const errors = await start(page, context, info, './#/travel');
  await expect(page.getByRole('heading', { level: 1, name: T('Travel links') })).toBeVisible();
  for (const g of ['stay', 'fly', 'go', 'abroad', 'wx']) await expect(page.locator(`[data-travel-group="${g}"]`)).toBeVisible();
  for (const kind of ['xbk', 'xab', 'xhw', 'xsac', 'xws', 'xfr', 'xgf', 'x3s', 'xcar', 'xr2r', 'xeda', 'xwv', 'x3m', 'x16', 'x10', 'x12']) await expect(page.locator(`[data-sk-link="${kind}"]`)).toHaveCount(1);
  await page.getByLabel(T('Follow a flight: flight number')).fill('EZY 1234');
  await expect(page.locator('[data-sk-link="xfr"]')).toHaveAttribute('href', 'https://www.flightradar24.com/data/flights/ezy1234');
  // «…» switches a link off, as everywhere
  const wo = page.locator('[data-sk-woanders]').filter({ has: page.locator('[data-sk-link="xbk"]') });
  await tap(wo.getByRole('button', { name: T('Options for the links elsewhere') }), info);
  await expect(page.getByRole('menuitem').first()).toBeVisible();
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
