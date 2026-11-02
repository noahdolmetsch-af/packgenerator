// «Wegweiser statt Katalog» PR 9 (Noah 01.11.2026 «1a 2a 3a 4a 5a», answer 3a): right after an action, one line «As next»
// with 1–2 functions that fit now: a saved ride, «All packed», a care job done. A tap opens the function.
// Fictional data only (test_data_gtp_). The lists come from src/lib/alsnaechstes.js, read as text (it needs Svelte).
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { makeGpx } from '../test_data_gtp_gpx.js';
import { ready, openData, settle } from './settle.js';
import { openHome, homeFixture, trip, entries, day } from './home0460-fixture.js';

const SRC = readFileSync(fileURLToPath(new URL('../../src/lib/alsnaechstes.js', import.meta.url)), 'utf8');
const ids = (moment) => SRC.match(new RegExp(`${moment}: \\[([^\\]]*)\\]`))[1].match(/'f\.[a-z]+'/g).map((s) => s.slice(1, -1));
const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const tap = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const noErrors = (page) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
};

test('Ride saved: the card shows As next, a tap opens the wear page', async ({ page, context }, info) => {
  const errors = noErrors(page);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const file = info.outputPath('test_data_gtp_abend.gpx');
  writeFileSync(file, makeGpx({ name: 'test_data_gtp_ Abendrunde', start: `${day(-1)}T15:00:00Z`, legs: [{ km: 18, kmh: 24 }, { stopMin: 25 }, { km: 16, kmh: 20, gainM: 380 }] }));
  await page.goto('./#/debrief/ride');
  await ready(page);
  const main = page.locator('main');
  await main.locator('.pickbtn input[type=file]').setInputFiles(file);
  await main.getByRole('button', { name: T('Save ride') }).click();
  const line = main.locator('[data-saved-card] [data-als-naechstes="ride"]');
  await expect(line).toContainText(T('As next'));
  await expect(line.locator('[data-naechstes-item]')).toHaveCount(ids('ride').length);
  await noSideways(page);
  await tap(line.locator(`[data-naechstes-item="${ids('ride')[0]}"]`), info);
  await expect(page).toHaveURL(/#\/bikes\?tab=care&view=wear/);
  expect(errors).toEqual([]);
});

test('All packed: the message shows As next with the weather', async ({ page, context }, info) => {
  const errors = noErrors(page);
  const d = homeFixture();
  const hike = trip('Wanderung', day(0), { domain: 'hiking', bikeId: null, bike: null, setup: {}, packs: [{ key: 'pack', name: 'test_data_gtp_ Rucksack', volumeL: 20 }], entries: entries(4, 4).map((e) => ({ ...e, slot: 'pack' })) });
  d.tables.trips = [hike, ...d.tables.trips.filter((x) => !/Herbstrunde|TEST/.test(x.id))];
  const TT = await openHome(page, context, info, { data: d, hour: 7 });
  await page.evaluate((id) => localStorage.setItem('trip.current', id), hike.id);
  await page.goto('./#/pack?day');
  await page.getByRole('button', { name: TT('Finish packing') }).first().click();
  const note = page.locator('.packed-toast');
  await expect(note).toContainText(TT('All packed. Have a good trip!'));
  const line = note.locator('[data-als-naechstes="packed"]');
  await expect(line).toContainText(TT('As next'));
  await expect(line.locator('[data-naechstes-item]')).toHaveCount(ids('packed').length);
  await noSideways(page);
  await tap(line.locator('[data-naechstes-item="f.weather"]'), info);
  await expect(page).toHaveURL(/#\/wetter/);
  expect(errors).toEqual([]);
});

test('Care job done: the saved message shows As next with the setup log', async ({ page, context }, info) => {
  const errors = noErrors(page);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (dl) => dl.accept());
  const raw = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
  const fix = JSON.parse(raw.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  const path = info.outputPath('naechstes-care.json');
  writeFileSync(path, JSON.stringify(fix));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel('Backup importieren').setInputFiles(path);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  await page.goto('./#/bikes?tab=care');
  const DONE = T('Done|task');
  const row = page.locator('li.dcard').filter({ has: page.getByRole('button', { name: DONE, exact: true }) }).first();
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: DONE, exact: true }).click();
  const notice = page.locator('p.notice[role="status"]');
  await expect(notice).toContainText('Gespeichert:');
  const line = notice.locator('[data-als-naechstes="care"]');
  await expect(line).toContainText(T('As next'));
  await expect(line.locator('[data-naechstes-item]')).toHaveCount(ids('care').length);
  await noSideways(page);
  await tap(line.locator('[data-naechstes-item="f.setuplog"]'), info);
  await expect(page).toHaveURL(/tab=rig/);
  expect(errors).toEqual([]);
});
