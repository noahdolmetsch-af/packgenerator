// v0.34.0 A (L1, L3): Today shows the trip schedule, ONE next step with its button and a timeline;
// two days before the start it is shopping (and charging), the shopping list ticks and shares as text.
// Fictional fixture plus test_data_gtp_ records; nothing leaves the preview.
// Screenshots for the design folder only when A_SHOTS names a directory.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const tr = (lang) => (en, vars) => {
  const text = (lang === 'de' ? DE[en] : null) ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const T = tr('de');
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const NOW = new Date('2026-10-07T10:00:00Z'); // a Wednesday in Zurich
const SHOTS = process.env.A_SHOTS || '';

const GEL = { id: 'FD901', name: 'test_data_gtp_ Gel', category: 'food', ownership: 'owned', weightG: 40 };
const BAR = { id: 'FD902', name: 'test_data_gtp_ Riegel', category: 'food', ownership: 'owned', weightG: 55 };

function fixture(path, trip) {
  const data = structuredClone(base);
  data.tables.items = [...data.tables.items, GEL, BAR];
  data.tables.trips = [trip];
  writeFileSync(path, JSON.stringify(data));
}
const trip = (extra = {}) => ({
  id: 'test_data_gtp_Vorab', title: 'test_data_gtp_ Vorab', domain: 'bikepacking', startDate: '2026-10-09', days: 2, bikeId: 'bike-test', bike: 'Test gravel bike',
  setup: { seat: 'bag-TA01', frame: 'bag-TA02', top: 'bag-TA03' },
  entries: [
    { itemId: 'EL01', slot: 'top', qty: 1, packed: false },
    { itemId: 'TO01', slot: 'seat', qty: 1, packed: false },
    { itemId: GEL.id, slot: 'top', qty: 3, packed: false },
    { itemId: BAR.id, slot: 'frame', qty: 5, packed: false },
  ],
  ready: [{ id: 'r1', label: 'Tyres checked', done: false }],
  wx: { min: 14, max: 22, rain: 'none' },
  status: 'planned',
  ...extra,
});

async function start(page, context, info, data) {
  await page.clock.setFixedTime(NOW);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    // What "Share as text" hands over: the phone's share sheet or the clipboard, caught here.
    window.__sent = [];
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (d) => window.__sent.push(['share', d.text]) });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (s) => window.__sent.push(['copy', s]) } });
  });
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const file = info.outputPath(`schedule-${Math.random().toString(36).slice(2)}.json`);
  fixture(file, data);
  const panel = page.locator('details.data');
  await expect(async () => {
    if (!(await panel.evaluate((d) => d.open))) await panel.locator('summary').click();
    expect(await panel.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await expect(panel.getByText(/importiert/)).toBeVisible();
  await page.goto('./#/');
}

const stored = (page, id) =>
  page.evaluate((id) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('trips').objectStore('trips').get(id);
      q.onsuccess = () => { r.result.close(); ok(q.result ?? null); };
    };
  }), id);

async function noSideScroll(page, info, what) {
  const check = async (w) => expect(await page.evaluate(() => document.documentElement.scrollWidth), `no sideways scroll: ${what} at ${w}`).toBeLessThanOrEqual(w);
  await check(page.viewportSize().width);
  if (info.project.name !== 'phone') return;
  const vp = page.viewportSize();
  await page.setViewportSize({ width: 320, height: vp.height });
  await check(320);
  await page.setViewportSize(vp);
}

const shot = async (page, info, name) => {
  if (!SHOTS) return;
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${SHOTS}/a-${name}-${info.project.name}.png`, fullPage: false });
};

test('Today: two days before, shopping and charging; the list ticks and shares as text', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info, trip());

  // v0.46.0 «Startseite neu»: the compact trip card: ONE main button for the step now, step bars.
  const band = page.getByRole('region', { name: 'test_data_gtp_ Vorab' });
  const main = band.locator('a.main');
  await expect(main).toHaveAttribute('data-step', 'shop');
  await expect(main).toHaveText(T('Shopping list'));
  // one strong button, the charge list as a quiet link (part B makes #/pack?charge work)
  await expect(band.locator('.btn')).toHaveCount(1);
  await expect(band.getByRole('link', { name: T('Charge devices') })).toHaveAttribute('href', '#/pack?charge');
  expect((await main.boundingBox()).height).toBeGreaterThanOrEqual(44);

  // the step bars: the service is not needed (skipped), the weather (set by hand) is done
  const line = band.getByRole('list', { name: T('Trip schedule') });
  await expect(line.getByRole('listitem').nth(0)).toHaveClass(/skip/);
  await expect(line.getByRole('listitem').nth(1)).toHaveClass(/done/);
  await expect(line.locator('li[aria-current="step"]')).toContainText(T('Shop & charge'));
  await noSideScroll(page, info, 'Today with the schedule');
  await shot(page, info, 'today-shop');

  // the button opens the shopping list of this trip
  await main.click();
  const sheet = page.getByRole('dialog', { name: T('Shopping list') });
  await expect(sheet).toBeVisible();
  await expect(page).toHaveURL(/#\/pack$/);
  const rows = sheet.getByRole('listitem');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText('test_data_gtp_ Gel');
  await expect(rows.nth(0)).toContainText('3×');
  await expect(rows.nth(1)).toContainText('test_data_gtp_ Riegel');
  await expect(rows.nth(1)).toContainText('5×');
  const before = (await stored(page, 'test_data_gtp_Vorab')).entries;
  await sheet.getByRole('checkbox', { name: /test_data_gtp_ Gel/ }).check();
  await expect.poll(async () => (await stored(page, 'test_data_gtp_Vorab'))?.shop).toEqual({ FD901: true });
  // the entries stay as they were (only trip.shop changes)
  expect((await stored(page, 'test_data_gtp_Vorab')).entries).toEqual(before);
  await expect(sheet).toContainText(T('{open} of {total} still to buy.', { open: 1, total: 2 }));
  await noSideScroll(page, info, 'the shopping list');
  await shot(page, info, 'shop');

  // Share as text: the share sheet on a phone, the clipboard on a computer
  await sheet.getByRole('button', { name: T('Share as text') }).click();
  const text = [T('Shopping list: {title}', { title: 'test_data_gtp_ Vorab' }), '☐ 5 × test_data_gtp_ Riegel', '', T('Already bought:'), '✓ 3 × test_data_gtp_ Gel'].join('\n');
  await expect.poll(() => page.evaluate(() => window.__sent)).toEqual([[info.project.name === 'phone' ? 'share' : 'copy', text]]);
  if (info.project.name !== 'phone') await expect(sheet.getByRole('status')).toHaveText(T('Copied. Paste it into a message or a note.'));

  // all bought: Today moves on to the next step (pack, from tomorrow)
  await sheet.getByRole('checkbox', { name: /test_data_gtp_ Riegel/ }).check();
  await expect.poll(async () => (await stored(page, 'test_data_gtp_Vorab'))?.shop).toEqual({ FD901: true, FD902: true });
  await sheet.getByRole('button', { name: T('Done') }).click();
  // the row in Plan says it, too
  await expect(page.getByRole('button', { name: new RegExp(`${T('Shopping list')}.*${T('all bought')}`) })).toBeVisible();
  await page.goto('./#/');
  await expect(main).toHaveAttribute('data-step', 'pack');
  await expect(main).toHaveAttribute('href', '#/pack?day');
  await expect(line.getByRole('listitem').nth(2)).toHaveClass(/done/);
  expect(errors).toEqual([]);
});

test('Today: five days before, the weather; its button opens the trip conditions', async ({ page, context }, info) => {
  await start(page, context, info, trip({ startDate: '2026-10-12', wx: null }));
  const band = page.getByRole('region', { name: 'test_data_gtp_ Vorab' });
  await expect(band.locator('a.main')).toHaveAttribute('data-step', 'weather');
  await expect(band.getByRole('list', { name: T('Trip schedule') }).locator('li[aria-current="step"]')).toContainText(T('Weather'));
  await noSideScroll(page, info, 'Today, weather step');
  await shot(page, info, 'today-weather');
  await band.locator('a.main').click();
  await expect(page.getByRole('dialog', { name: T('Edit trip conditions') })).toBeVisible();
  await expect(page).toHaveURL(/#\/pack$/);
});

// v0.67.0 «Übergänge 1» (U009): on the start day, packed, the button is On the way; the open ready
// check becomes the card's side link (it was the button before).
test('Today: start day, all packed: On the way, the ready check as the side link', async ({ page, context }, info) => {
  const t0 = trip({ startDate: '2026-10-07', shop: { FD901: true, FD902: true } });
  // HY01 (sun cream) is one of the things that always come along (trips.js ALWAYS_OLD)
  t0.entries = [...t0.entries, { itemId: 'HY01', slot: 'top', qty: 1 }].map((e) => ({ ...e, packed: true }));
  // the ride view opens by itself on a ride day once; here Today is the point
  await context.addInitScript(() => localStorage.setItem('ride.autoOpened', 'test_data_gtp_Vorab:2026-10-07'));
  await start(page, context, info, t0);
  const band = page.getByRole('region', { name: 'test_data_gtp_ Vorab' });
  await expect(band.locator('a.main')).toHaveAttribute('data-step', 'way');
  await expect(band.locator('a.main')).toHaveAttribute('href', '#/ride');
  await expect(band.locator('a.lk')).toHaveText(T('Ready check'));
  await expect(band.locator('a.lk')).toHaveAttribute('href', '#/pack?day');
});
