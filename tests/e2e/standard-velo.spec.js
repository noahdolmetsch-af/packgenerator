// Standard-Velo (mockups VS1–VS4, Noah 14.10.2026 «VS1–VS4 freigegeben», «1a 2b 3a»):
// VS1  New trip: the standard bike (first in the order) is chosen, with ★ «Standard» and one line
//      «Standard-Velo ist vorgewählt …»; a tap on another bike counts only for this trip.
// VS2  At the very first trip (no trip yet, two bikes or more) the app asks once: standard or last ridden.
// VS3  Velos: ★ on the standard bike; «Standard-Velo und Reihenfolge · Ändern» opens the order with
//      arrows and «Als Standard», and what a new trip brings.
// VS4  A new bike: «Neues Standard-Velo?» right after adding it; «Ja» puts it on top.
// Fictional data only (test_data_gtp_), German UI, Europe/Zurich, service workers blocked (config).
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';
import { newButton } from './newbutton.js';

const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const day = (n = 0) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const GRAVEL = 'test_data_gtp_ Gravel Grinder';
const SCALE = 'test_data_gtp_ Scott Scale 940';
const SPARK = 'test_data_gtp_ Scott Spark 960';

function fixtureFile(info, { noTrips = false } = {}) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const path = `${info.project.outputDir}/sv-fixture-${info.testId}.json`;
  const data = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  if (noTrips) data.tables.trips = [];
  writeFileSync(path, JSON.stringify(data));
  return path;
}

async function start(page, context, info, opts) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(fixtureFile(info, opts));
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

const bikeTabs = (page) => page.locator('section.setup-band [role=tab] .bn');

test('VS3 + VS1: star, order with arrows and «Als Standard»; a new trip brings the standard bike', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/bikes?tab=setup');
  // without an order yet: by name, the first one is the standard bike with a star
  await expect(bikeTabs(page)).toHaveText([GRAVEL, SCALE, SPARK]);
  await expect(page.locator('section.setup-band [role=tab]').first().locator('.sv-star')).toBeVisible();
  await page.locator('.sv-line').getByRole('button', { name: T('Change') }).click();
  const sheet = page.locator('dialog.bo-dlg');
  await expect(sheet.getByRole('heading', { name: T('Standard bike and order') })).toBeVisible();
  // arrows: the Spark one up; then «Als Standard» on the Scale
  await sheet.getByRole('button', { name: T('Move {name} up', { name: SPARK }) }).click();
  await expect(sheet.locator('.bo-name')).toHaveText([GRAVEL, SPARK, SCALE]);
  await expect(sheet.getByRole('button', { name: T('Move {name} up', { name: GRAVEL }) })).toBeDisabled();
  await sheet.locator('.bo-row', { hasText: SCALE }).getByRole('button', { name: T('Make standard') }).click();
  await expect(sheet.locator('.bo-name')).toHaveText([SCALE, GRAVEL, SPARK]);
  await expect(sheet.locator('.bo-row').first().locator('.sv-pill')).toHaveText(T('Standard'));
  await expect(sheet.getByRole('button', { name: T('The standard bike') })).toHaveAttribute('aria-pressed', 'true');
  await sheet.getByRole('button', { name: T('Save') }).click();
  await expect(sheet).toBeHidden();
  await expect(bikeTabs(page)).toHaveText([SCALE, GRAVEL, SPARK]);

  // VS1: the new trip brings the Scale (standard), with ★ «Standard» and the line; another tap counts for this trip
  const dlg = await newTrip(page);
  const chips = dlg.locator('fieldset.ctx', { has: page.getByText(T('Bike'), { exact: true }) }).locator('.tp-chip');
  await expect(chips.filter({ hasText: SCALE })).toHaveAttribute('aria-pressed', 'true');
  await expect(chips.filter({ hasText: SCALE }).locator('.sv-pill')).toHaveText(T('Standard'));
  await expect(dlg.locator('.std-pre')).toContainText(T('is chosen. A tap on another bike counts only for this trip.'));
  await chips.filter({ hasText: SPARK }).click();
  await expect(chips.filter({ hasText: SPARK })).toHaveAttribute('aria-pressed', 'true');
  await expect(dlg.locator('.std-pre')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('VS3: «the one ridden last» brings the bike of the last trip to a new trip', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/bikes?tab=setup');
  await page.locator('.sv-line').getByRole('button', { name: T('Change') }).click();
  const sheet = page.locator('dialog.bo-dlg');
  await sheet.getByRole('button', { name: T('The one ridden last') }).click();
  await sheet.getByRole('button', { name: T('Save') }).click();
  await expect(sheet).toBeHidden();
  // kept: opening the window again shows the choice
  await page.locator('.sv-line').getByRole('button', { name: T('Change') }).click();
  await expect(sheet.getByRole('button', { name: T('The one ridden last') })).toHaveAttribute('aria-pressed', 'true');
  await sheet.getByRole('button', { name: T('Cancel') }).click();
  await expect(sheet).toBeHidden();
  const dlg = await newTrip(page);
  // no standard line with «the one ridden last»
  await expect(dlg.locator('.std-pre')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('VS4: a new bike asks «Neues Standard-Velo?»; «Ja» puts it on top', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/bikes?tab=setup');
  await page.locator('section.setup-band').getByRole('button', { name: T('Add bike') }).click();
  const bd = page.locator('dialog.vdlg', { has: page.locator('#bike-dlg-h') });
  await bd.getByLabel(T('Name'), { exact: true }).fill('test_data_gtp_ Enduro');
  await bd.getByRole('button', { name: T('Add|bike') }).click();
  const ask = page.locator('dialog.nb-std');
  await expect(ask.getByRole('heading', { name: T('New standard bike?') })).toBeVisible();
  await expect(ask.getByRole('button', { name: new RegExp(T('No, {name} stays', { name: GRAVEL })) })).toHaveAttribute('aria-pressed', 'true');
  await ask.getByRole('button', { name: new RegExp(T('Yes, {name} becomes the standard', { name: 'test_data_gtp_ Enduro' })) }).click();
  await ask.getByRole('button', { name: T('Done') }).click();
  await expect(ask).toBeHidden();
  await expect(bikeTabs(page)).toHaveText(['test_data_gtp_ Enduro', GRAVEL, SCALE, SPARK]);
  expect(errors).toEqual([]);
});

test('VS2: at the very first trip the app asks once which bike new trips bring', async ({ page, context }, info) => {
  const errors = await start(page, context, info, { noTrips: true });
  let dlg = await newTrip(page);
  const ask = page.locator('dialog.tb-ask');
  await expect(ask.getByRole('heading', { name: T('Which bike shall new trips bring?') })).toBeVisible();
  await expect(ask.getByRole('button', { name: new RegExp(T('Always the standard bike')) })).toHaveAttribute('aria-pressed', 'true');
  await ask.getByRole('button', { name: new RegExp(T('The bike ridden last')) }).click();
  await ask.getByRole('button', { name: T('Apply') }).click();
  await expect(ask).toBeHidden();
  await expect(dlg).toBeVisible();
  // asked once: closing and opening again asks nothing
  await page.keyboard.press('Escape');
  dlg = await newTrip(page);
  await expect(dlg).toBeVisible();
  await expect(page.locator('dialog.tb-ask')).toHaveCount(0);
  expect(errors).toEqual([]);
});
