// v0.30.2 (Rundgang L5, L6, L9): the walk through Today.
// v0.46.0 (Noah 34b): "Also to do" and "Good to know" became "Important today".
// L5: each thing once: the backup, the Inbox and bike care due now are lines in "Also to do", Good to
//     know does not repeat them; event preparation opens the trip and is ticked off there.
// L6: a trip within 14 days leads; an open debrief older than 7 days waits in "Also to do" with "All good".
// L9: a first start: the browser's language, "First steps" until bike, gear and trip have data, and no
//     tip that needs data the app does not have yet.
// Fictional fixture plus test_data_gtp_ records; nothing leaves the preview.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const tr = (lang) => (en, vars) => {
  const text = (lang === 'de' ? DE[en] : null) ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const day = (n) => new Date(Date.now() + n * 864e5).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });

const trip = (id, start, extra = {}) => ({
  id: `test_data_gtp_${id}`, title: `test_data_gtp_ ${id}`, domain: 'bikepacking', startDate: start, days: 1, bikeId: 'bike-test', bike: 'Test gravel bike',
  setup: { seat: 'bag-TA01', frame: 'bag-TA02', top: 'bag-TA03' },
  entries: base.tables.items.slice(3, 6).map((i) => ({ itemId: i.id, slot: 'seat', qty: 1, packed: false })), ready: [], status: 'planned', ...extra,
});

/** Opens Today with the language set (or not), optionally after importing data. */
async function start(page, context, info, { lang = null, data = null } = {}) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  if (lang) await context.addInitScript((l) => localStorage.setItem('lang', l), lang);
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  if (data) await importData(page, info, data, lang ?? 'en');
}

async function importData(page, info, data, lang) {
  const T = tr(lang);
  const file = info.outputPath(`rundgang-${Math.random().toString(36).slice(2)}.json`);
  writeFileSync(file, JSON.stringify(data));
  const panel = page.locator('details.data');
  await expect(async () => {
    if (!(await panel.evaluate((d) => d.open))) await panel.locator('summary').click();
    expect(await panel.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await expect(panel.getByText(/importiert|Imported/)).toBeVisible();
  await page.goto('./#/');
}

/** A record straight from IndexedDB. */
const stored = (page, table, id) =>
  page.evaluate(([table, id]) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(table).objectStore(table).get(id);
      q.onsuccess = () => { r.result.close(); ok(q.result ?? null); };
    };
  }), [table, id]);

const noSideScroll = async (page, what) => {
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, `no sideways scroll: ${what}`).toBeLessThanOrEqual(page.viewportSize().width);
};
/** On the phone also at 320 px. */
async function narrow(page, info, what) {
  await noSideScroll(page, what);
  if (info.project.name !== 'phone') return;
  const vp = page.viewportSize();
  await page.setViewportSize({ width: 320, height: vp.height });
  await noSideScroll(page, `${what} at 320 px`);
  await page.setViewportSize(vp);
}

/** v0.46.0 (Noah 34b): "Also to do" and "Good to know" are rows of "Important today" (all shown). */
async function imp(page, T) {
  const sec = page.getByRole('region', { name: T('Important today') });
  await expect(sec.locator('li').first()).toBeVisible();
  const more = sec.locator('button.more');
  if ((await more.count()) && (await more.getAttribute('aria-expanded')) === 'false') await more.click();
  return sec;
}

/* ---------- L5: each thing once; event preparation in the trip ---------- */

const TASK = 'test_data_gtp_ Startnummer abholen';
function l5Fixture() {
  const data = structuredClone(base);
  const T = data.tables;
  // the gravel bike: chain due now (200 km since the last wax, every 150 km)
  T.bikes[0] = { ...T.bikes[0], name: 'test_data_gtp_ Faellig', type: 'Gravel', km: 2100, parts: [{ key: 'chain', model: '', history: [{ date: day(-40), km: 1900, action: 'service', result: 'done' }] }] };
  // a second bike: the chain due in about 10 km (the forecast may say so, it is not due yet)
  T.bikes.push({ ...base.tables.bikes[0], id: 'test_data_gtp_bike2', name: 'test_data_gtp_ Bald', type: 'Gravel', km: 2040, parts: [{ key: 'chain', model: '', history: [{ date: day(-30), km: 1900, action: 'service', result: 'done' }] }] });
  T.trips = [trip('Rennen', day(5), { days: 2, event: true, bikeId: 'test_data_gtp_bike2', bike: 'test_data_gtp_ Bald' })];
  T.maintenance = [{ id: 9101, subject: 'test_data_gtp_ setup', area: 'Preparation', task: TASK, leadWeeks: 0, status: 'open' }];
  T.notes = [{ id: 'test_data_gtp_note', text: 'test_data_gtp_ Notiz', status: 'open', at: `${day(0)}T07:00:00.000Z` }];
  return data;
}

for (const lang of ['en', 'de']) {
  test(`L5: Today says each thing once; event preparation is ticked off in the trip, ${lang}`, async ({ page, context }, info) => {
    const T = tr(lang);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await start(page, context, info, { lang, data: l5Fixture() });

    // Important today: the backup (none saved yet), the Inbox and the event preparation, each once.
    const also = await imp(page, T);
    await expect(also).toContainText(T('Time for a backup'));
    await expect(also).toContainText(T('{n} note to sort', { n: 1 }));
    await expect(also).toContainText(T('Event preparation: {n} open', { n: 1 }));
    const prep = also.getByRole('link', { name: T('Tick off in the trip') });
    await expect(prep).toHaveAttribute('href', '#/pack');
    await expect(also.getByRole('link', { name: T('Tick off in Bike care') })).toHaveCount(0);

    // each thing once
    await expect(also.locator('[data-row="backup"]')).toHaveCount(1);
    await expect(also.locator('[data-row="inbox"]')).toHaveCount(1);
    await expect(also.locator('[data-row="prep"]')).toHaveCount(1);
    await narrow(page, info, 'Today');

    // The link opens the trip's Plan with "Before the trip" open; the task is ticked off right there.
    await prep.click();
    await expect(page).toHaveURL(/#\/pack$/);
    await expect(page.locator('.trip-band h1')).toHaveText('test_data_gtp_ Rennen');
    const before = page.locator('details.calm-extra').filter({ hasText: T('Before the trip') });
    await expect(before).toHaveJSProperty('open', true);
    await expect(before.getByText(TASK)).toBeVisible();
    const done = before.getByRole('button', { name: T('Done: {task}', { task: TASK }) });
    const box = await done.boundingBox();
    expect(box.height, 'Done is a 44 px target').toBeGreaterThanOrEqual(44);
    await narrow(page, info, 'Before the trip');
    const entries = (await stored(page, 'trips', 'test_data_gtp_Rennen')).entries;
    await done.click();
    const note = before.getByRole('status').filter({ hasText: T('Ticked off: {task}', { task: TASK }) });
    await expect(note).toBeVisible();
    await expect(before.getByRole('button', { name: T('Done: {task}', { task: TASK }) })).toHaveCount(0);
    expect((await stored(page, 'trips', 'test_data_gtp_Rennen')).prep[9101]).toMatchObject({ result: 'done', date: day(0) });

    // Undo opens it again; nothing else of the trip changes.
    await note.getByRole('button', { name: T('Undo') }).click();
    await expect(before.getByRole('button', { name: T('Done: {task}', { task: TASK }) })).toBeVisible();
    const after = await stored(page, 'trips', 'test_data_gtp_Rennen');
    expect(after.prep ?? {}).toEqual({});
    expect(after.entries).toEqual(entries);

    // Ticked off for good: Today no longer lists the preparation as open.
    await before.getByRole('button', { name: T('Done: {task}', { task: TASK }) }).click();
    await expect(note).toBeVisible();
    await page.goto('./#/');
    await expect(await imp(page, T)).not.toContainText(T('Event preparation: {n} open', { n: 1 }));
    expect(errors).toEqual([]);
  });
}

/* ---------- L6: an old open debrief does not push the next trip away ---------- */

test('L6: a trip within 14 days leads; an old open debrief waits in Important today with All good', async ({ page, context }, info) => {
  const T = tr('de');
  const data = structuredClone(base);
  data.tables.trips = [trip('Alt', day(-20), { days: 2 }), trip('Bald', day(10))];
  await start(page, context, info, { lang: 'de', data });

  // the hero is the trip in 10 days, not "How was …?"
  await expect(page.locator('#next-h')).toHaveText('test_data_gtp_ Bald');
  await expect(page.getByRole('region', { name: T('How was {trip}?', { trip: 'test_data_gtp_ Alt' }) })).toHaveCount(0);
  const also = await imp(page, T);
  const row = also.getByRole('listitem').filter({ hasText: T('Debrief still open: {title}', { title: 'test_data_gtp_ Alt' }) });
  await expect(row).toBeVisible();
  const good = row.getByRole('button', { name: T('All good') });
  expect((await good.boundingBox()).height, 'All good is a 44 px target').toBeGreaterThanOrEqual(44);
  await narrow(page, info, 'Today with an open debrief');

  // "All good" saves the debrief at once, with Undo; the hero stays with the next trip.
  await good.click();
  const saved = page.getByRole('status').filter({ hasText: T('Saved: {trip}.', { trip: 'test_data_gtp_ Alt' }) });
  await expect(saved).toBeVisible();
  await expect(row).toHaveCount(0);
  expect(await stored(page, 'debriefs', 'test_data_gtp_Alt')).toMatchObject({ status: 'done', amount: 'right' });
  await expect(page.locator('#next-h')).toHaveText('test_data_gtp_ Bald');
  await saved.getByRole('button', { name: T('Undo') }).click();
  await expect(row).toBeVisible();
  expect(await stored(page, 'debriefs', 'test_data_gtp_Alt')).toBe(null);
});

test('L6: nothing planned and an old debrief: no hero question, the line in Important today', async ({ page, context }, info) => {
  const T = tr('en');
  const data = structuredClone(base);
  data.tables.trips = [trip('Herbst', day(-12))];
  await start(page, context, info, { lang: 'en', data });
  await expect(page.locator('#next-h')).toHaveText(T('No trip planned'));
  await expect((await imp(page, T)).getByText(T('Debrief still open: {title}', { title: 'test_data_gtp_ Herbst' }))).toBeVisible();
});

test('L6: a fresh debrief and no trip within 14 days still asks in the hero', async ({ page, context }, info) => {
  const T = tr('en');
  const data = structuredClone(base);
  data.tables.trips = [trip('Gestern', day(-2)), trip('Spaeter', day(20))];
  await start(page, context, info, { lang: 'en', data });
  await expect(page.getByRole('region', { name: T('How was {trip}?', { trip: 'test_data_gtp_ Gestern' }) })).toBeVisible();
  const also = await imp(page, T);
  await expect(also).toContainText(T('Next trip: {title}', { title: 'test_data_gtp_ Spaeter' }));
  await expect(also.getByText(/Debrief still open/)).toHaveCount(0);
});

/* ---------- L9: the first start ---------- */

test.describe('L9: first start on a German browser', () => {
  test.use({ locale: 'de-CH' });

  test('German by itself, First steps until bike, gear and trip have data, no tip without its data', async ({ page, context }, info) => {
    const T = tr('de');
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await start(page, context, info); // no language chosen
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');

    const first = page.getByRole('region', { name: T('First steps') });
    await expect(first).toBeVisible();
    await expect(first.getByRole('link', { name: T('Add your bike') })).toHaveAttribute('href', '#/bikes');
    await expect(first.getByRole('button', { name: T('Import backup') })).toBeVisible();
    await expect(first.getByRole('button', { name: T('Add item') })).toBeVisible();
    await expect(first.getByRole('button', { name: T('Plan your first trip') })).toBeVisible();
    for (const b of await first.locator('.step').all()) expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(44);
    // in place of "No trip planned"; no "No bikes yet" line besides step 1
    await expect(page.locator('#next-h')).toHaveCount(0);
    await expect(page.locator('[data-row="nobike"]')).toHaveCount(0);
    await narrow(page, info, 'First steps');

    // v0.46.0: "Tried it yet?" offers a first function with one button.
    await expect(page.getByRole('region', { name: T('Tried it yet?') }).locator('.tryb')).toHaveCount(1);

    // Plan your first trip opens the New trip window.
    await first.getByRole('button', { name: T('Plan your first trip') }).click();
    await expect(page.getByRole('dialog', { name: T('New trip') })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.goto('./#/');

    // A bike only: step 1 done, the card stays.
    const bikeOnly = structuredClone(base);
    bikeOnly.tables.items = [];
    bikeOnly.tables.containers = [];
    await importData(page, info, bikeOnly, 'de');
    await expect(first).toBeVisible();
    await expect(first.getByRole('img', { name: T('Done|task') })).toHaveCount(1);
    await expect(first.getByRole('link', { name: T('Add your bike') })).toHaveCount(0);
    await expect(first.getByRole('button', { name: T('Add item') })).toBeVisible();

    // Bike, gear and a trip: the card is gone, also after a reload.
    const all = structuredClone(base);
    all.tables.trips = [trip('Erste', day(30))];
    await importData(page, info, all, 'de');
    await expect(page.locator('#next-h')).toHaveText('test_data_gtp_ Erste');
    await expect(first).toHaveCount(0);
    await page.reload();
    await expect(page.locator('#next-h')).toHaveText('test_data_gtp_ Erste');
    await expect(first).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('a language chosen once still wins', async ({ page, context }, info) => {
    await start(page, context, info, { lang: 'en' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('region', { name: 'First steps' })).toBeVisible();
  });
});

test('L9: first start on an English browser is English', async ({ page, context }, info) => {
  await start(page, context, info);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('region', { name: 'First steps' })).toBeVisible();
});
