// Sportart statt Tourart (mockups SA1–SA3, Noah 14.10.2026 «SA1–SA3 freigegeben», «1a 2a 3a 4b 5b»):
// SA1  New trip: one sports list (Fahrrad, Gravel, Cross Country, Downhill, Bikepacking, Skitouren,
//      Wandern, + Andere), Fahrrad chosen (1a), the ones used most first (5b); a bike sport brings its own
//      standard bike (2a), «Als Standard für …» keeps a tapped one for that sport.
// SA2  A night with a day sport: the quiet hint «Zu Bikepacking»; nothing changes without a tap (3a).
// SA3  Touren: a quiet band opens «Sportart für deine alten Touren», suggested by bike and days (4b).
// Fictional data only (test_data_gtp_), German UI, Europe/Zurich, service workers blocked (config).
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { SPORTS } from '../../src/lib/sportlist.js';
import { openData, settle } from './settle.js';
import { newButton } from './newbutton.js';
import { table } from './gesamttest/lib.js';

const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const day = (n = 0) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const GRAVEL = 'test_data_gtp_ Gravel Grinder';
const SCALE = 'test_data_gtp_ Scott Scale 940';
const SPARK = 'test_data_gtp_ Scott Spark 960';
const XC = T(SPORTS.find((s) => s.key === 'xc').name);

function fixtureFile(info, edit) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const path = `${info.project.outputDir}/sa-fixture-${info.testId}.json`;
  const data = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  edit?.(data);
  writeFileSync(path, JSON.stringify(data));
  return path;
}

async function start(page, context, info, edit) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(fixtureFile(info, edit));
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  return errors;
}

async function newTrip(page) {
  await page.goto('./#/');
  await (await newButton(page, T('New'))).click();
  await page.locator('dialog.new').getByRole('button', { name: new RegExp(`^${T('Plan a trip')}`) }).click();
  const dlg = page.locator('dialog.trip-dlg');
  await expect(dlg).toBeVisible();
  return dlg;
}
const sportChips = (dlg) => dlg.locator('fieldset.area .tp-chip');
const bikeChips = (dlg) => dlg.locator('fieldset.ctx', { has: dlg.page().getByText(T('Bike'), { exact: true }) }).locator('.tp-chip');

test('SA1: one sports list, Fahrrad chosen; a bike sport brings its own standard bike', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const dlg = await newTrip(page);
  // no trip has a sport yet: the fixed order (5b), then «+ Andere»
  await expect(sportChips(dlg)).toHaveText([...SPORTS.map((s) => T(s.name)), T('Other|sport')]);
  await expect(sportChips(dlg).filter({ hasText: T('Cycling|sport') })).toHaveAttribute('aria-pressed', 'true');
  await expect(bikeChips(dlg).filter({ hasText: GRAVEL })).toHaveAttribute('aria-pressed', 'true');
  // Cross Country: the hardtail (first bike of its kind) with «Standard für Cross Country» and the line
  await sportChips(dlg).filter({ hasText: XC }).click();
  await expect(bikeChips(dlg).filter({ hasText: SCALE })).toHaveAttribute('aria-pressed', 'true');
  await expect(bikeChips(dlg).filter({ hasText: SCALE }).locator('.sa-std')).toHaveText(T('Standard for {sport}', { sport: XC }));
  await expect(dlg.locator('.sa-pre')).toHaveText(T('standard bike for {sport} · you can change it', { sport: XC }));
  // another bike counts for this trip; «Als Standard für Cross Country» keeps it for the sport
  await bikeChips(dlg).filter({ hasText: SPARK }).click();
  await expect(dlg.locator('.sa-pre')).toHaveCount(0);
  await dlg.locator('.sa-set').getByRole('button', { name: T('Make standard for {sport}', { sport: XC }) }).click();
  await expect(bikeChips(dlg).filter({ hasText: SPARK }).locator('.sa-std')).toBeVisible();
  await expect.poll(async () => (await table(page, 'settings')).find((s) => s.key === 'sportBikes')?.value).toEqual({ xc: 'test_data_gtp_spark' });
  // back to Fahrrad: the general standard bike is the one with the plain «Standard»
  await sportChips(dlg).filter({ hasText: T('Cycling|sport') }).click();
  await expect(bikeChips(dlg).filter({ hasText: GRAVEL }).locator('.sv-pill')).toHaveText(T('Standard'));
  expect(errors).toEqual([]);
});

test('SA2: a night with Gravel shows «Zu Bikepacking»; the trip keeps the sport chosen', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const dlg = await newTrip(page);
  await sportChips(dlg).filter({ hasText: T('Gravel') }).click();
  await dlg.getByRole('button', { name: T('2 days'), exact: true }).click();
  await dlg.getByRole('button', { name: T('Hotel/hut'), exact: true }).click();
  const hint = dlg.locator('.sa-hint');
  await expect(hint).toContainText(T('A night out? Bikepacking may fit better.'));
  // only a suggestion: Gravel stays until the tap
  await expect(sportChips(dlg).filter({ hasText: T('Gravel') })).toHaveAttribute('aria-pressed', 'true');
  await hint.getByRole('button', { name: T('Switch to Bikepacking') }).click();
  await expect(sportChips(dlg).filter({ hasText: T('Bikepacking') })).toHaveAttribute('aria-pressed', 'true');
  await expect(hint).toHaveCount(0);
  await dlg.getByLabel(T('Name'), { exact: true }).fill('test_data_gtp_ SA2 Tour');
  await dlg.getByRole('button', { name: new RegExp(`^${T('Create trip')}`) }).click();
  await expect(dlg).toBeHidden();
  await expect.poll(async () => (await table(page, 'trips')).find((x) => x.title === 'test_data_gtp_ SA2 Tour')?.sport).toBe('bikepacking');
  expect(errors).toEqual([]);
});

test('SA3: Touren offers a sport for the old trips, by bike and days; «Alle übernehmen» keeps them', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/trips');
  const band = page.locator('.sa-band');
  await expect(band).toContainText(T('New: every trip has a sport'));
  await band.click();
  const sheet = page.locator('dialog.sa-old');
  await expect(sheet.getByRole('heading', { name: T('A sport for your old trips') })).toBeVisible();
  // the event (2 days) → Bikepacking; the autumn loop on the gravel bike → Gravel
  const pick = (title) => sheet.getByLabel(T('Sport for {name}', { name: title }));
  await expect(pick('test_data_gtp_ Jura event')).toHaveValue('bikepacking');
  await expect(pick('test_data_gtp_ Autumn loop')).toHaveValue('gravel');
  await pick('test_data_gtp_ Autumn loop').selectOption('cycling');
  await expect(sheet.locator('.sa-row', { hasText: 'Autumn loop' })).toContainText(T('changed by you'));
  await sheet.getByRole('button', { name: T('Take all') }).click();
  await expect(sheet).toBeHidden();
  await expect(band).toHaveCount(0);
  const trips = await table(page, 'trips');
  expect(Object.fromEntries(trips.map((x) => [x.id, x.sport]))).toEqual({ test_data_gtp_event: 'bikepacking', test_data_gtp_past: 'cycling' });
  // asked once: after a reload the band stays away
  await page.reload();
  await expect(page.locator('.trips h1')).toBeVisible();
  await expect(band).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('SA3: «Später» hides the band until the app is opened again', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/trips');
  await page.locator('.sa-band').click();
  await page.locator('dialog.sa-old').getByRole('button', { name: T('Later') }).click();
  await expect(page.locator('dialog.sa-old')).toBeHidden();
  await expect(page.locator('.sa-band')).toHaveCount(0);
  expect((await table(page, 'trips')).every((x) => !x.sport)).toBe(true);
  await page.reload();
  await expect(page.locator('.sa-band')).toBeVisible();
  expect(errors).toEqual([]);
});
