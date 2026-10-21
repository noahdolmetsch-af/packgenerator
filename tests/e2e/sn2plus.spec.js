// SN2+ «SN2 plus» (mockups SN2e–SN2i approved 13.10.2026: 1a 2b 3 «a und sonst b» 4b 5b), German UI,
// phone 390 and desktop 1440, fictional data (sn2plus-fixture.js):
// a) a trip's Rückblick: «Puls und Leistung» right under «Fertig. Gute Tour!», the heart rate from the ride
//    ledger (no activities yet: no zones, no power); «Aus Vorlage» per unused item, with Undo;
// b) Logbuch: chips Velo and Reiseart with counts, combinable, «Filter löschen», every row names its bike;
// c) Dein Tempo: per bike and surface from 5 rides, the surface changed per ride; planned and ridden;
//    the months since the first ride and «Deine Pulszonen» with «Zonen ändern».
// The numbers are read from the fixture, not copied.
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { sn2plusData, P, D0, day, TPL, HERBST } from './sn2plus-fixture.js';
import { openData, settle } from './settle.js';

const SHOTS = '/tmp/claude-0/sn-shots/sn2plus';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const DATA = sn2plusData();
const shot = async (page, info, name) => {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
/** Phone: every button and select of the new parts (scope) is at least 44 px high and wide. */
async function targets(page, info, scope) {
  if (info.project.name !== 'phone') return;
  const small = await page.evaluate((sel) =>
    [...document.querySelectorAll(sel)]
      .filter((el) => el.getBoundingClientRect().width > 1)
      .map((el) => ({ el: `${el.tagName} ${el.className} ${el.textContent.trim().slice(0, 30)}`, r: el.getBoundingClientRect() }))
      .filter((x) => x.r.height < 43.5 || x.r.width < 43.5)
      .map((x) => `${x.el} ${Math.round(x.r.width)}×${Math.round(x.r.height)}`),
  scope);
  expect(small).toEqual([]);
}
const table = (page, name) =>
  page.evaluate((s) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(s).objectStore(s).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);
const setting = async (page, key) => (await table(page, 'settings')).find((s) => s.key === key)?.value;

async function start(page, context, info) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/sn2plus-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(DATA));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  // in the morning: no trip of the fixture opens «Tour beendet» by itself
  await page.clock.setFixedTime(new Date(`${D0}T10:00:00+02:00`));
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel('Backup importieren').setInputFiles(file);
  await panel.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  return errors;
}

test('a) Rückblick: «Puls und Leistung» from the ride ledger, «Aus Vorlage» with Undo', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/debrief/${encodeURIComponent(HERBST)}`);
  // SN2x (answer 1a, folding groups): the card stands first in the group «Körper und Leistung»
  await page.locator('section[data-group="body"] button.gb').click();
  const card = page.locator('section[data-group="body"] section[data-heart-power]');
  await expect(card.getByRole('heading', { level: 2, name: T('Heart rate and power') })).toBeVisible();
  // the heart rate of the trip's Strava rides: the average weighted by km, the highest max
  const trip = DATA.tables.trips.find((x) => x.id === HERBST);
  const mine = DATA.tables.kmBook.filter((e) => e.date >= trip.startDate && e.date <= day(-13 + trip.days - 1) && e.bikeId === trip.bikeId);
  expect(mine.length).toBe(2);
  const avg = Math.round(mine.reduce((s, e) => s + e.hrAvg * e.km, 0) / mine.reduce((s, e) => s + e.km, 0));
  const max = Math.max(...mine.map((e) => e.hrMax));
  await expect(card.locator('[data-hr] .rv-tile').nth(0)).toContainText(String(avg));
  await expect(card.locator('[data-hr] .rv-tile').nth(0)).toContainText(T('Ø heart rate'));
  await expect(card.locator('[data-hr] .rv-tile').nth(1)).toContainText(String(max));
  // no activities yet: no zones and no power, the source says Strava
  await expect(card.locator('.zbar')).toHaveCount(0);
  await expect(card.getByText(T('Ø power'))).toHaveCount(0);
  await expect(card.locator('.src')).toHaveText(T('Strava'));

  // «Nicht gebraucht»: an item of the template has «Aus Vorlage», one only on this trip has none
  // SN2x: it sits in the folding group «Gepäck und Velo»
  await page.locator('section[data-group="pack"] button.gb').click();
  const tpl = (await setting(page, 'templates')).find((x) => x.id === TPL);
  const book = page.locator('[data-unused="LX01"]');
  await expect(book.getByRole('button', { name: new RegExp(T('Out of template')) })).toBeVisible();
  // not used on Drei-Täler-Loop and Sommertour before (the fixture's debriefs)
  await expect(book).toContainText(T('also not used on {n} trips before', { n: 2 }));
  const hoodie = page.locator('[data-unused="OF01"]');
  await expect(hoodie).toContainText(T('only on this trip, not in the template'));
  await expect(hoodie.getByRole('button')).toHaveCount(0);
  await targets(page, info, '.saved button, .saved select');
  await noSideways(page);
  await shot(page, info, 'SN2e-rueckblick-werte');

  await book.getByRole('button', { name: new RegExp(T('Out of template')) }).click();
  await expect(book).toContainText(T('Taken out of «{tpl}» · stays in Material and on this trip', { tpl: tpl.name }));
  const toast = page.locator('.toast[role="status"]');
  await expect(toast).toBeVisible();
  await expect.poll(async () => (await setting(page, 'templates')).find((x) => x.id === TPL).entries.map((e) => e.itemId)).not.toContain('LX01');
  // it stays in Material and on this trip
  expect((await table(page, 'items')).some((i) => i.id === 'LX01')).toBe(true);
  expect((await table(page, 'trips')).find((x) => x.id === HERBST).entries.some((e) => e.itemId === 'LX01')).toBe(true);
  await shot(page, info, 'SN2f-rueckblick-nicht-gebraucht');
  await toast.getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await setting(page, 'templates')).find((x) => x.id === TPL).entries.map((e) => e.itemId)).toContain('LX01');
  await expect(book.getByRole('button', { name: new RegExp(T('Out of template')) })).toBeVisible();
  // and again with the row's own «Rückgängig»
  await book.getByRole('button', { name: new RegExp(T('Out of template')) }).click();
  await expect.poll(async () => (await setting(page, 'templates')).find((x) => x.id === TPL).entries.length).toBe(tpl.entries.length - 1);
  await book.getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await setting(page, 'templates')).find((x) => x.id === TPL).entries.length).toBe(tpl.entries.length);
  expect(errors).toEqual([]);
});

test('b) Logbuch: Velo and Reiseart with counts, combinable, «Filter löschen»', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/debrief/logbook');
  const log = page.locator('#logbook');
  const rows = log.locator('ul.log > li');
  await expect(rows.first()).toBeVisible();
  // Gesamttest 21.10.2026 (C5): first 10 entries, then «n weitere zeigen»
  if (await log.locator('[data-log-more]').count()) await log.locator('[data-log-more]').click();
  await expect(log.locator('[data-log-more]')).toHaveCount(0);
  const all = await rows.count();
  const bikes = log.getByRole('group', { name: T('Bike') });
  const kinds = log.getByRole('group', { name: T('Area') });
  await expect(bikes.getByRole('button', { name: T('All|period') })).toHaveAttribute('aria-pressed', 'true');
  // the road bike: one trip in the fixture
  const roadTrips = DATA.tables.trips.filter((x) => x.bikeId === 'bike-road').length;
  const road = bikes.getByRole('button', { name: new RegExp('^Rennrad Blau') });
  await expect(road).toContainText(String(roadTrips));
  await road.click();
  await expect(road).toHaveAttribute('aria-pressed', 'true');
  await expect(rows).toHaveCount(roadTrips);
  await expect(rows.first()).toContainText('Rennrad Blau');
  await expect(log.locator('.count')).toContainText(T('of {n}', { n: all }));
  // combined with a kind that the road bike has no trip of: nothing
  await kinds.getByRole('button').nth(2).click();
  await expect(log.locator('li.none')).toBeVisible();
  await shot(page, info, 'SN2g-logbuch-filter');
  await log.getByRole('button', { name: T('Clear filters') }).click();
  await expect(rows).toHaveCount(all);
  await expect(bikes.getByRole('button', { name: T('All|period') })).toHaveAttribute('aria-pressed', 'true');
  await expect(log.getByRole('button', { name: T('Clear filters') })).toHaveCount(0);
  // every bike trip names its bike in the row
  await expect(rows.first()).toContainText('Gravel Grau');
  await targets(page, info, '#logbook button');
  await noSideways(page);
  // the chips are not remembered
  await road.click();
  await page.reload();
  await expect(log.getByRole('group', { name: T('Bike') }).getByRole('button', { name: T('All|period') })).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

test('c) Dein Tempo: per bike and surface from 5 rides, planned and ridden, the months, the zones', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/debrief/pace');
  const grid = page.locator('[data-pace-grid]');
  await expect(grid.getByRole('heading', { level: 2, name: T('Per bike and surface') })).toBeVisible();
  const paceRides = (await setting(page, 'pace')).rides;
  const rideBike = (r) => DATA.tables.trips.find((x) => x.id === DATA.tables.rides.find((y) => y.id === r.id)?.tripId)?.bikeId;
  const gravel = paceRides.filter((r) => rideBike(r) === 'bike-test');
  expect(gravel.length).toBeGreaterThanOrEqual(5);
  const cell = (bike, s) => grid.locator(`[data-bike="${bike}"] [data-surface="${s}"]`);
  await expect(cell('bike-test', 'gravel')).toHaveAttribute('data-counts', '1');
  await expect(cell('bike-test', 'gravel')).toContainText(T('km/h · {n} rides', { n: gravel.length }));
  await expect(cell('bike-road', 'road')).toHaveAttribute('data-counts', '0');
  await expect(cell('bike-road', 'road')).toContainText(T('Rule|pace'));
  await expect(cell('bike-road', 'road')).toContainText(T('only {n} ride', { n: 1 }));
  await expect(grid.locator('.rv-note')).toContainText(T('A new trip with {bike} on {surface}: {kmh} km/h instead of {rule}.', { bike: 'Gravel Grau', surface: T('Gravel|surface'), kmh: 'X', rule: 'Y' }).split(':')[0]);

  // planned and ridden: the newest trip first, the difference without a colour
  const pr = page.locator('[data-planned-ridden]');
  const shown = pr.locator(info.project.name === 'phone' ? '.ph-only li' : '.pc-only tbody tr');
  await expect(shown).toHaveCount(5);
  const abend = DATA.tables.rides.find((r) => r.tripId === `${P}abend`);
  const mins = Math.round((abend.movingH - abend.plan.hours) * 60);
  await expect(shown.first()).toContainText(`${mins < 0 ? '−' : '+'}0:${String(Math.abs(mins)).padStart(2, '0')}`);
  const withPlan = new Set(DATA.tables.rides.map((r) => r.tripId)).size;
  await pr.getByRole('button', { name: T('All {n} trips', { n: withPlan }) }).click();
  await expect(shown).toHaveCount(withPlan);

  // the months since the first ride (answer 5b), no toggle
  const first = DATA.tables.rides.map((r) => r.date).sort()[0];
  const months = (Number(D0.slice(0, 4)) - Number(first.slice(0, 4))) * 12 + Number(D0.slice(5, 7)) - Number(first.slice(5, 7)) + 1;
  await expect(page.locator('[data-months] .bars li')).toHaveCount(months);
  await expect(page.locator('[data-months-values] [data-row="hrAvg"]')).toBeVisible();

  // the zones: the standard from the highest heart rate of the ledger, then your own
  const zones = page.locator('[data-zones]');
  const max = Math.max(...DATA.tables.kmBook.map((e) => e.hrMax));
  await expect(zones).toContainText(T('standard from your highest heart rate, {n} bpm', { n: max }));
  await expect(zones).toContainText(T('up to {n} bpm', { n: Math.round(max * 0.6) }));
  await targets(page, info, '.tempo button, .tempo select');
  await noSideways(page);
  await shot(page, info, 'SN2h-tempo');
  await zones.getByRole('button', { name: T('Change zones') }).click();
  const inputs = zones.locator('input[type=number]');
  for (const [i, v] of [117, 137, 153, 168].entries()) await inputs.nth(i).fill(String(v));
  await zones.getByRole('button', { name: T('Save') }).click();
  await expect(zones).toContainText(T('entered by you'));
  await expect(zones).toContainText(T('up to {n} bpm', { n: 117 }));
  expect((await setting(page, 'training.zones')).own).toEqual([118, 138, 154, 169]);
  await zones.scrollIntoViewIfNeeded();
  await shot(page, info, 'SN2i-tempo-monate');

  // the surface changed per ride: three gravel rides become trail, the gravel value falls under 5
  for (const r of gravel.slice(0, 3)) await page.locator(`li[data-ride="${r.id}"] select`).selectOption('trail');
  await expect(cell('bike-test', 'trail')).toContainText(T('only {n} rides', { n: 3 }));
  await expect(cell('bike-test', 'gravel')).toHaveAttribute('data-counts', gravel.length - 3 >= 5 ? '1' : '0');
  // stored on the ride in the ledger
  const book = await table(page, 'kmBook');
  expect(book.filter((e) => e.surface === 'trail')).toHaveLength(3);
  expect(errors).toEqual([]);
});
