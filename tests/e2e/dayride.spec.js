// v0.25.1 (Noah 1a, 2a, 3a): a day ride in one tap ('pg:dayride', the Home button of nav.js
// dayRide), the New trip dialog that creates without typing, and the weather preset from the
// forecast at the home place (Open-Meteo mocked; nothing leaves the preview server).
// Fictional fixture plus test_data_gtp_ items.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const tr = (lang) => (en, vars) => {
  const text = (lang === 'de' ? DE[en] : null) ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const HOME = { name: 'test_data_gtp_ Heimat', lat: 47.37, lon: 8.54 };

const item = (id, name, f) => ({ id, name: `test_data_gtp_ ${name}`, category: 'other', weightG: 50, qty: 1, weightStatus: 'measured', defaultBag: 'top', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'], ...f });
const NIGHT = ['CX01', 'CX03', 'CX04', 'CX05']; // base, sleep, warm, cook
function fixture(path, { home = false } = {}) {
  const data = structuredClone(base);
  data.tables.items.push(
    item('CX01', 'Badetuch', { sets: ['base'] }),
    item('CX03', 'Biwaksack', { sets: ['sleep'], defaultBag: 'seat' }),
    item('CX04', 'Daunenjacke', { sets: ['warm'], defaultBag: 'seat' }),
    item('CX05', 'Kocher', { sets: ['cook'], defaultBag: 'seat' }),
    item('CX07', 'Gel', { role: 'standard', defaultBag: 'frame', perHours: 1, maxQty: 6, category: 'food' }),
  );
  if (home) data.tables.settings.push({ key: 'homePlace', value: HOME });
  writeFileSync(path, JSON.stringify(data));
}

/** Open-Meteo answer: 16 days from today (Zurich), 17–25 °C and dry (→ "Warm"). */
function meteo() {
  const day0 = new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T00:00:00Z`);
  const time = Array.from({ length: 16 }, (_, n) => new Date(day0.getTime() + n * 864e5).toISOString().slice(0, 10));
  return { daily: { time, temperature_2m_min: time.map(() => 17), temperature_2m_max: time.map(() => 25), precipitation_sum: time.map(() => 0), precipitation_probability_max: time.map(() => 5) } };
}

async function start(page, context, info, lang, opts = {}) {
  const file = info.outputPath('dayride-fixture.json');
  fixture(file, opts);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  // page.route wins over context.route: the forecast answers, everything else outside stays blocked.
  if (opts.home) await page.route(/api\.open-meteo\.com\/v1\/forecast/, (route) => route.fulfill({ json: meteo() }));
  await context.addInitScript((l) => localStorage.setItem('lang', l), lang);
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel(tr(lang)('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: tr(lang)('Replace all data') }).press('Enter');
  await expect(data.getByText(/importiert|Imported/)).toBeVisible();
}

/** All stored trips, straight from IndexedDB. */
const allTrips = (page) =>
  page.evaluate(() => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('trips').objectStore('trips').getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }));
/** The day a ride starts in the browser: today before 14:00, else tomorrow. */
const rideDay = (page) => page.evaluate(() => {
  const d = new Date();
  if (d.getHours() >= 14) d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
});
const dM = (iso) => `${Number(iso.slice(8, 10))}.${Number(iso.slice(5, 7))}.`;

for (const lang of ['de', 'en']) {
  test(`day ride in one tap: list without night items, bar with Change and Undo, ${lang}`, async ({ page, context }, info) => {
    const T = tr(lang);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await start(page, context, info, lang);
    const day = await rideDay(page);
    const title = T('{bike} day ride {date}', { bike: 'Test gravel', date: dM(day) });

    // One tap on Home (the "Day ride" button sends this event).
    const t0 = Date.now();
    await page.evaluate(() => window.dispatchEvent(new Event('pg:dayride')));
    const bar = page.locator('.dayride-bar');
    await expect(bar).toContainText(T('Day ride created: {bike} · {hours} h · {weather}.', { bike: 'Test gravel bike', hours: '2', weather: T('Chilly') }));
    await expect(page.locator('.planning-row').filter({ hasText: 'test_data_gtp_ Gel' })).toContainText('× 2');
    const ms = Date.now() - t0;
    info.annotations.push({ type: 'clicks', description: '1' }, { type: 'seconds', description: (ms / 1000).toFixed(1) });
    console.log(`[dayride] ${info.project.name} ${lang}: 1 tap, ${(ms / 1000).toFixed(1)} s from Home to the list`);
    expect(page.url()).toContain('#/pack');

    const trips = await allTrips(page);
    expect(trips).toHaveLength(1);
    expect(trips[0]).toMatchObject({ title, startDate: day, days: 1, bikeId: 'bike-test', hours: 2, overnight: 'none', cook: false, wx: { min: 6, max: 12, rain: 'none' }, event: false });
    expect(trips[0].wxFrom).toBeUndefined();
    const on = trips[0].entries.map((e) => e.itemId);
    expect(on.length).toBeGreaterThan(3);
    for (const id of NIGHT) expect(on).not.toContain(id);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();

    // Change: the Edit trip dialog of the new trip.
    await bar.getByRole('button', { name: T('Change') }).click();
    const edit = page.getByRole('dialog', { name: T('Trip details') });
    await expect(edit.getByLabel(T('Name'))).toHaveValue(title);
    await edit.getByRole('button', { name: T('Cancel') }).click();
    await expect(edit).toBeHidden();

    // Undo: the trip is gone, no question asked.
    await bar.getByRole('button', { name: T('Undo') }).click();
    await expect.poll(async () => (await allTrips(page)).length).toBe(0);
    await expect(bar).toHaveCount(0);

    // A second day ride starts like the first: two in a row from Pack itself (the event while Pack is open).
    await page.evaluate(() => window.dispatchEvent(new Event('pg:dayride')));
    await expect(bar).toBeVisible();
    await expect.poll(async () => (await allTrips(page)).length).toBe(1);
    expect(errors).toEqual([]);
  });
}

test('New trip: Create without typing (name, date and bike are filled in)', async ({ page, context }, info) => {
  const T = tr('de');
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info, 'de');
  const day = await rideDay(page);
  let clicks = 0;
  const click = async (loc) => {
    await loc.click();
    clicks++;
  };
  const t0 = Date.now();
  await click(page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }));
  await click(page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Plan a trip') }));
  await click(page.getByRole('dialog', { name: T('Plan a new trip') }).getByRole('button', { name: T('Copy the last trip') }));
  const dlg = page.getByRole('dialog', { name: T('New trip') });
  const name = dlg.getByLabel(T('Name'));
  await expect(name).toHaveValue(T('{bike} day ride {date}', { bike: 'Test gravel', date: dM(day) }));
  await expect(dlg.getByLabel(T('Start date'))).toHaveValue(day);
  // The name follows the days until it is typed in.
  await dlg.getByRole('spinbutton', { name: T('Days') }).fill('3');
  await expect(name).toHaveValue(T('{bike} {n} days {date}', { bike: 'Test gravel', n: 3, date: dM(day) }));
  await dlg.getByRole('spinbutton', { name: T('Days') }).fill('1');
  await click(dlg.getByRole('button', { name: T('Create trip') }));
  await expect(dlg).toBeHidden();
  await expect(page.locator('.planning-row').first()).toBeVisible();
  const ms = Date.now() - t0;
  console.log(`[dayride] ${info.project.name} dialog: ${clicks} clicks, no typing (days changed and back for the name check), ${(ms / 1000).toFixed(1)} s from Home to the list`);
  expect(clicks).toBeLessThanOrEqual(4);
  const [trip] = await allTrips(page);
  expect(trip).toMatchObject({ title: T('{bike} day ride {date}', { bike: 'Test gravel', date: dM(day) }), startDate: day, bikeId: 'bike-test', overnight: 'none' });

  // Typed in: the name stays as written.
  await page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }).click();
  await page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Plan a trip') }).click();
  await page.getByRole('dialog', { name: T('Plan a new trip') }).getByRole('button', { name: T('Standard set') }).click();
  await name.fill('test_data_gtp_ Mein Name');
  await dlg.getByRole('spinbutton', { name: T('Days') }).fill('2');
  await expect(name).toHaveValue('test_data_gtp_ Mein Name');
  await dlg.getByRole('button', { name: T('Cancel') }).click();
  expect(errors).toEqual([]);
});

test('home place: the forecast chooses the weather in the dialog and for the day ride', async ({ page, context }, info) => {
  const T = tr('de');
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info, 'de', { home: true });
  await page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }).click();
  await page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Plan a trip') }).click();
  await page.getByRole('dialog', { name: T('Plan a new trip') }).getByRole('button', { name: T('Standard set') }).click();
  const dlg = page.getByRole('dialog', { name: T('New trip') });
  const warm = dlg.getByRole('button', { name: new RegExp(`^${T('Warm')}`) });
  await expect(warm).toHaveAttribute('aria-pressed', 'true');
  await expect(warm).toContainText(T('from forecast'));
  await expect(dlg).toContainText(T('From the forecast for {place}', { place: HOME.name }));
  // Noah can change it: then the mark goes.
  await dlg.getByRole('button', { name: new RegExp(`^${T('Mild')}`) }).click();
  await expect(dlg.getByText(T('from forecast'))).toHaveCount(0);
  await warm.click(); // back to Warm by hand: the same values as the forecast
  await expect(warm).toHaveAttribute('aria-pressed', 'true');
  await dlg.getByRole('button', { name: T('Create trip') }).click();
  await expect(dlg).toBeHidden();
  await expect.poll(async () => (await allTrips(page)).length).toBe(1);
  const [made] = await allTrips(page);
  expect(made.wx).toEqual({ min: 16, max: 24, rain: 'none' });
  expect(made.wxFrom).toBe('forecast'); // the same values as the forecast: still from it

  // The day ride takes the forecast too, and says so.
  await page.evaluate(() => window.dispatchEvent(new Event('pg:dayride')));
  await expect(page.locator('.dayride-bar')).toContainText(T('{weather} (forecast)', { weather: T('Warm') }));
  await expect.poll(async () => (await allTrips(page)).length).toBe(2);
  const ride = (await allTrips(page)).find((x) => x.id !== made.id);
  expect(ride).toMatchObject({ wx: { min: 16, max: 24, rain: 'none' }, wxFrom: 'forecast', hours: 2 });
  expect(errors).toEqual([]);
});
