// v0.113.0 «Rahmenbedingungen» (Noah 12.10.2026, mockups B1–B3 approved «b1 ok», «b3 ok», «b2 b4 b5 ok»):
// the window for a new trip. Title «Rahmenbedingungen» without the hint line, «Sportart» with Fahrrad first
// and «+ Andere», no «Letzte Tour» (the bug: a future test trip showed up as a start), «Vorlage wählen»
// folded with Standard, own templates and two examples as buttons, the weather from a start postcode
// (Open-Meteo, answered here by page.route), the event with its hint, the list in four groups and the
// button counting the bag items only. Fictional data only (test_data_gtp_), German UI.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

// the group names from the app source (packgroups.js imports the app's i18n, so it is read as text)
const GROUPS = [...readFileSync(fileURLToPath(new URL('../../src/lib/packgroups.js', import.meta.url)), 'utf8').matchAll(/\{ key: '\w+', name: '([^']+)', color/g)].map((m) => m[1]);
const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const day = (n = 0) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
const tap = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};

function fixtureFile(info) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const path = `${info.project.outputDir}/rahmen-fixture-${info.testId}.json`;
  const data = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  // one item with a long name (the phone must wrap it, the weight stays on the right) and one race item
  data.tables.items.push(
    { id: 'test_data_gtp_LONG', name: 'test_data_gtp_ Ultraleichte Daunenjacke mit Kapuze Grösse M', category: 'offbike', weightG: 260, qty: 1, weightStatus: 'measured', defaultBag: 'seat', ownership: 'owned', role: 'standard', sets: [], kits: [], domains: ['bikepacking'] },
    { id: 'test_data_gtp_RACE', name: 'test_data_gtp_ Startnummer-Halter', category: 'bike', weightG: 20, qty: 1, weightStatus: 'measured', defaultBag: 'top', ownership: 'owned', role: null, sets: ['race'], kits: [], domains: ['bikepacking'] },
  );
  writeFileSync(path, JSON.stringify(data));
  return path;
}

/** Open-Meteo: the place search finds «test_data_gtp_ Bern» for 3011; 16 days of 6–14 °C, dry. */
function meteo() {
  const day0 = new Date(`${day(0)}T00:00:00Z`);
  const time = Array.from({ length: 16 }, (_, n) => new Date(day0.getTime() + n * 864e5).toISOString().slice(0, 10));
  return { daily: { time, temperature_2m_min: time.map(() => 6.2), temperature_2m_max: time.map(() => 13.8), precipitation_sum: time.map(() => 0), precipitation_probability_max: time.map(() => 10) } };
}

async function start(page, context, info) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  const asked = [];
  await page.route(/api\.open-meteo\.com\/v1\/forecast/, (route) => (asked.push(route.request().url()), route.fulfill({ json: meteo() })));
  await page.route(/geocoding-api\.open-meteo\.com/, (route) => route.fulfill({ json: { results: [{ name: 'test_data_gtp_ Bern', admin1: 'Bern', country: 'Schweiz', latitude: 46.95, longitude: 7.45 }] } }));
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
  return { errors, asked };
}

async function openNew(page, info) {
  await tap(page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }), info);
  await tap(page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Plan a trip') }), info);
  const dlg = page.getByRole('dialog', { name: T('Conditions|newtrip') });
  await expect(dlg).toBeVisible();
  return dlg;
}

const allTrips = (page) =>
  page.evaluate(() => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('trips').objectStore('trips').getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }));

test('Rahmenbedingungen: Sportart, no past trip, templates as buttons, weather by postcode, event, four groups', async ({ page, context }, info) => {
  const { errors, asked } = await start(page, context, info);
  const dlg = await openNew(page, info);

  // the title and no hint line; Sportart with Fahrrad pressed, «+ Andere» opens the other areas
  await expect(dlg.getByRole('heading', { name: T('Conditions|newtrip') })).toBeVisible();
  await expect(dlg.getByText(T('Name, date, bike and packing list. Everything can be changed later.'))).toHaveCount(0);
  const sport = dlg.getByRole('group', { name: T('Sport') });
  await expect(sport.getByRole('button', { name: T('Cycling|sport') })).toHaveAttribute('aria-pressed', 'true');
  await expect(sport.getByRole('button', { name: T('World trip') })).toHaveCount(0);
  await tap(sport.getByRole('button', { name: T('Other|sport') }), info);
  await expect(sport.getByRole('button', { name: T('World trip') })).toBeVisible();
  await expect(sport.getByRole('button', { name: T('Cycling|sport') })).toHaveAttribute('aria-pressed', 'true');

  // no KI-Helfer and no building blocks in the window
  await expect(dlg.getByText(T('Ask the helper'))).toHaveCount(0);
  await expect(dlg.getByText(T('Suggested for this ride'))).toHaveCount(0);

  // the bug: no «Letzte Tour», no past or future trip as a start
  await expect(dlg.getByText(T('Last trip'), { exact: true })).toHaveCount(0);
  await expect(dlg.getByText('test_data_gtp_ Jura event')).toHaveCount(0);

  // the weather: the start place from the settings; a postcode brings its forecast as a suggestion
  const place = dlg.getByRole('textbox', { name: T('Start postcode or place') });
  await expect(place).toHaveValue('test_data_gtp_ Home');
  await expect(dlg.getByText(T('Forecast suggestion: {min}–{max}°, {rain}', { min: 6, max: 14, rain: T('dry') }))).toBeVisible();
  await place.fill('3011');
  await place.press('Enter');
  await expect(place).toHaveValue('test_data_gtp_ Bern');
  await expect(dlg.getByText(T('{place} · free from Open-Meteo', { place: 'test_data_gtp_ Bern' }))).toBeVisible();
  expect(asked.some((u) => u.includes('latitude=46.95'))).toBe(true);

  // the event: the hint names the race items; ticked, the block «Rennen» shows its items
  await expect(dlg.getByText(T('Ticked, the block «Race» comes along ({names}).', { names: 'test_data_gtp_ Startnummer-Halter' }))).toBeVisible();
  await tap(dlg.getByRole('checkbox', { name: T('Event: a race or organised ride') }), info);
  await expect(dlg.getByText(T('Block «Race»'), { exact: true })).toBeVisible();

  // «Vorlage wählen» folded; open: Standard, the own template, two examples
  const head = dlg.getByRole('button', { name: new RegExp(T('Choose a template')) });
  await expect(head).toHaveAttribute('aria-expanded', 'false');
  await tap(head, info);
  const own = dlg.getByRole('group', { name: T('Your templates') });
  await expect(own.getByRole('button', { name: T('Standard'), exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(own.getByRole('button', { name: 'test_data_gtp_ Evening loop' })).toBeVisible();
  const weekend = dlg.getByRole('group', { name: T('Examples') }).getByRole('button', { name: T('Weekend'), exact: true });
  await tap(weekend, info);
  await expect(weekend).toHaveAttribute('aria-pressed', 'true');
  await expect(dlg.getByRole('button', { name: T('2 days') })).toHaveAttribute('aria-pressed', 'true');

  // the list in groups (names from the source), the long name on the list, the button counts bag items
  const list = dlg.getByRole('region', { name: T('Your packing list') });
  await expect(list.getByRole('heading', { name: new RegExp(`^${T(GROUPS[0])}`) })).toBeVisible();
  await expect(list.getByText('test_data_gtp_ Ultraleichte Daunenjacke mit Kapuze Grösse M')).toBeVisible();
  const submit = dlg.getByRole('button', { name: new RegExp(`^${T('Create trip')}`) });
  const n = Number((await submit.textContent()).match(/(\d+)/)[1]);
  const shown = await list.locator('.grp li').count();
  expect(n).toBe(shown);

  // nothing runs sideways on the phone
  const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(wide).toBe(0);
  const vp = page.viewportSize();
  await page.setViewportSize({ width: vp.width, height: 4200 });
  await dlg.screenshot({ path: `qa/rahmen-${info.project.name}.png` });
  await page.setViewportSize(vp);

  // the trip: the start place, the event, Repair and Charging not by themselves
  await dlg.getByRole('textbox', { name: T('Name') }).fill('test_data_gtp_ Rahmen');
  await tap(submit, info);
  await expect(dlg).toBeHidden();
  const made = (await allTrips(page)).find((x) => x.title === 'test_data_gtp_ Rahmen');
  expect(made.place?.name).toBe('test_data_gtp_ Bern');
  expect(made.event).toBe(true);
  expect(made.sets?.repair).toBe(false);
  expect(made.sets?.charge).toBe(false);
  expect(errors).toEqual([]);
});
