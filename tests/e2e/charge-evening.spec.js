// v0.34.0 B, German UI, phone and desktop:
// L4  the charge list: #/pack?charge opens it over Pack; ticks are saved on the trip (trip.charge).
// L8  the evening on a trip of 2 days: On the way has an evening block on day 1 (night, charge list
//     with its own ticks, what to lay out for tomorrow, tomorrow morning), none on the last day.
// L10 the Data panel has "Send to phone" (download here: the test browser cannot share files).
// Fictional fixture plus test_data_gtp_ items and a trip; nothing leaves the preview server.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const day = (n) => {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Zurich' }));
  d.setDate(d.getDate() + n);
  return iso(d);
};
const MARK = { key: 'test_data_gtp_marker', value: 1 };
const TRIP = 'test_data_gtp_trip-2days';
const GILET = { id: 'test_data_gtp_GI01', name: 'test_data_gtp_ Gilet', nameDe: 'test_data_gtp_ Weste', category: 'onbike', coldBelow: 12, weightG: 90, qty: 1, weightStatus: 'measured', defaultBag: 'top', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'] };
const entry = (itemId, slot = 'seat') => ({ itemId, slot, qty: 1, packed: false });

function fixture(path) {
  const data = structuredClone(base);
  data.tables.items.push(GILET);
  data.tables.trips.push({
    id: TRIP, domain: 'bikepacking', title: 'test_data_gtp_ Two days', days: 2, startDate: day(0), bikeId: 'bike-test', bike: 'Test gravel bike',
    setup: { seat: 'bag-TA01', frame: 'bag-TA02', top: 'bag-TA03' },
    // EL01 bike computer, EL02 power bank, EL03 USB cable (no device), LI01 and LI02 lights.
    entries: [entry('EL01', 'mounted'), entry('EL02', 'frame'), entry('EL03', 'frame'), entry('LI01', 'mounted'), entry('LI02', 'mounted'), entry(GILET.id, 'top')],
    ready: [{ id: 'kit', label: 'Helmet, shoes, gloves', done: false }, { id: 'charged', label: 'Devices charged', done: false }],
    status: 'planned', hours: 4, overnight: 'lodging', wx: { min: 6, max: 10, rain: 'none' },
  });
  data.tables.settings.push(MARK);
  writeFileSync(path, JSON.stringify(data));
}

async function start(page, context, info) {
  const file = info.outputPath('charge-evening.json');
  fixture(file);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript((id) => {
    localStorage.setItem('lang', 'de');
    localStorage.setItem('pack.currentTrip', id);
  }, TRIP);
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await expect.poll(async () => (await table(page, 'settings')).some((s) => s.key === MARK.key)).toBe(true);
}

const table = (page, name) =>
  page.evaluate((s) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(s).objectStore(s).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);
const theTrip = async (page) => (await table(page, 'trips')).find((t) => t.id === TRIP);

const sideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
async function fits(page, info) {
  expect(await sideways(page)).toBe(0);
  if (info.project.name !== 'phone') return;
  const size = page.viewportSize();
  await page.setViewportSize({ width: 320, height: size.height });
  await expect.poll(() => sideways(page)).toBe(0);
  await page.setViewportSize(size);
}
/** B_SHOTS=<folder> saves screenshots there (never into the repo). */
const shot = async (page, info, name) => {
  if (!process.env.B_SHOTS) return;
  mkdirSync(process.env.B_SHOTS, { recursive: true });
  const path = `${process.env.B_SHOTS}/b-${name}-${info.project.name}.png`;
  await page.screenshot({ path });
};

test('charge list from #/pack?charge, ticks on the trip; evening block on day 1 of 2 on Ride', async ({ page, context }, info) => {
  await start(page, context, info);

  // L4: the charge list over Pack. The cable is no device; the address goes back to #/pack.
  await page.goto('./#/pack?charge');
  const sheet = page.getByRole('dialog', { name: T('Charge the evening before') });
  await expect(sheet).toBeVisible();
  await expect(page).toHaveURL(/#\/pack$/);
  const rows = sheet.locator('.rows button');
  await expect(rows).toHaveCount(4);
  await expect(sheet).not.toContainText('USB-C');
  await sheet.getByRole('button', { name: /Bike computer/ }).click();
  await expect(sheet.getByRole('button', { name: /Bike computer/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet).toContainText(T('{done} of {n} charged', { done: 1, n: 4 }));
  await expect.poll(async () => (await theTrip(page)).charge).toEqual({ EL01: true });
  await fits(page, info);
  await shot(page, info, 'charge-list');
  await sheet.getByRole('button', { name: T('Close') }).click();
  await expect(sheet).toBeHidden();
  // The entry point in Plan says where it stands; the item records never change.
  await expect(page.locator('.charge-fold summary')).toContainText('1/4');
  expect((await table(page, 'items')).find((i) => i.id === 'EL01').charge).toBeUndefined();

  // L8: On the way, day 1 of 2: the evening, with its own ticks for tonight.
  await page.goto('./#/ride');
  const eve = page.locator('details.eve');
  await expect(eve.locator('summary')).toContainText(T('Evening'));
  await expect(eve.locator('summary')).toContainText(T('Lodging'));
  await expect(eve.locator('summary')).toContainText(T('Charge {done}/{n}', { done: 0, n: 4 }));
  if (!(await eve.evaluate((d) => d.open))) await eve.locator('summary').click();
  await expect(eve).toContainText(T('Lay out for tomorrow'));
  await expect(eve).toContainText('test_data_gtp_ Weste');
  await expect(eve).toContainText(T('Tomorrow morning'));
  await eve.getByRole('button', { name: /Powerbank|Power bank/ }).click();
  await expect.poll(async () => (await theTrip(page)).chargeNight).toEqual({ [day(0)]: { EL02: true } });
  expect((await theTrip(page)).charge).toEqual({ EL01: true });
  await expect(eve.locator('summary')).toContainText(T('Charge {done}/{n}', { done: 1, n: 4 }));
  await fits(page, info);
  await eve.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await page.evaluate(() => window.scrollBy(0, -80));
  await shot(page, info, 'evening');

  // The last day has no evening.
  await page.getByRole('button', { name: new RegExp(`^${T('Day {n}', { n: 2 })}`) }).click();
  await expect(page.locator('details.eve')).toHaveCount(0);

  // L10: "Send to phone" in the Data panel (here it downloads: no share sheet in the test browser).
  await page.goto('./');
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  const send = data.getByRole('button', { name: info.project.name === 'phone' ? T('Send to computer') : T('Send to phone') });
  await expect(send).toBeVisible();
  const download = page.waitForEvent('download');
  await send.click();
  const file = JSON.parse(readFileSync(await (await download).path(), 'utf8'));
  expect(file.lastChange).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  expect(file.tables.trips.find((t) => t.id === TRIP).chargeNight).toEqual({ [day(0)]: { EL02: true } });
  await send.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await shot(page, info, 'send');
});
