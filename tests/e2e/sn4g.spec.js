// SN4g–SN4i «Touren-Seite, Runde 2» (mockups seiten-neu-touren-2, Noah 13.10.2026 22:24 «SN4g–SN4i
// freigegeben»), German UI, phone 390 and desktop 1440, fictional data (sn4plus-fixture.js plus one uploaded
// ride on its own):
// a) the band «Packmodus» in both states, «Geplant» as a short list, a tap on the band opens Packmodus;
// b) «Packmodus» (AT1, 14.10.2026: was «Abgeschlossene Touren», the values moved to the Strava activities):
//    all trips of the period by month, «Bewerten» / «Kurz bewerten» on the grey rows, every trip a card on a phone;
// c) «Filter»: a dialog / sheet with counts, the active filters as chips to tap away, «Filter löschen», a saved
//    filter under «Meine Filter» (remembered after a reload);
// d) «In Zahlen»: all five groups open, the jump bar, «Alle zuklappen»;
// e) the tiles with a filter: «Offene Rückblicke» and «Karte aller Touren» follow it, «Gute Tage» does not.
// (Rows with power values need the activities of the Training PR: tests/sn4g.test.js covers them.)
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { TOUR_GROUPS } from '../../src/lib/review/pastcols.js';
import { SK_BIG } from '../../src/lib/sk/tiles.js';
import { sn4plusData, P, D0, day } from './sn4plus-fixture.js';
import { openData, settle } from './settle.js';

const SHOTS = '/tmp/claude-0/sn-shots/sn4g';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const shot = async (page, info, name, fullPage = true) => {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

const SOLO = `${P}ride-solo`;
/** The SN4 plus data, plus one uploaded ride without a trip (it shows as «Fahrt aus GPX» with «Kurz bewerten»). */
function data({ nothingOpen = false } = {}) {
  const d = sn4plusData();
  const T0 = d.tables;
  const base = T0.rides.find((r) => r.id === `${P}ride-see-0`);
  T0.rides.push({ ...base, id: SOLO, tripId: null, name: 'Feierabend Seeufer', date: day(-5), startAt: `${day(-5)}T16:00:00.000Z`, km: 41, gainM: 520 });
  if (nothingOpen) T0.trips = T0.trips.filter((x) => x.status !== 'planned');
  return d;
}
const DATA = data();
const NEXT = DATA.tables.trips.find((x) => x.status === 'planned');
const ROAD = DATA.tables.bikes.find((b) => b.id === 'bike-road');
const ROAD_TRIPS = DATA.tables.trips.filter((x) => x.bikeId === ROAD.id && x.status === 'done');

async function start(page, context, info, d = DATA) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/sn4g-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(d));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  // in the morning: no trip of the fixture opens «Tour beendet» by itself
  await page.clock.setFixedTime(new Date(`${D0}T10:00:00+02:00`));
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('dialog', (x) => x.accept());
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel('Backup importieren').setInputFiles(file);
  await panel.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  await page.goto('./#/trips');
  await expect(page.getByRole('heading', { level: 1, name: T('Trips|place') })).toBeVisible();
  await expect(page.locator('[data-trip-list] [data-row]').first()).toBeVisible();
  return errors;
}
const list = (page) => page.locator('[data-trip-list]');
const rowOf = (page, title) => list(page).locator('li[data-row]').filter({ has: page.getByRole('link', { name: title, exact: true }) });

test('a) the band «Packmodus» above the list in both states, «Geplant» as a short list', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const band = page.locator('[data-pack-band]');
  await expect(band).toHaveAttribute('data-pack-band', 'draft');
  await expect(band).toContainText(T('Pack mode'));
  await expect(band).toContainText(T('pack draft exists'));
  await expect(band).toContainText(NEXT.title);
  await expect(band).toContainText(T('{done} of {n} packed', { done: NEXT.entries.filter((e) => e.packed).length, n: NEXT.entries.length }));
  // the band stands above «Geplant», «Geplant» above the finished trips
  const y = async (l) => (await l.boundingBox()).y;
  const planned = page.locator('section[data-planned]');
  expect(await y(band)).toBeLessThan(await y(planned));
  expect(await y(planned)).toBeLessThan(await y(page.locator('section[data-finished]')));
  await expect(planned.getByRole('heading', { level: 2, name: T('Planned|group') })).toBeVisible();
  const card = planned.locator(`li[data-trip="${NEXT.id}"]`);
  await expect(card).toContainText(NEXT.title);
  await expect(card.locator('[data-in-pack-mode]')).toHaveText(T('in pack mode'));
  await expect(card.locator('.tst[data-state="plan"]')).toBeVisible();
  await shot(page, info, 'SN4g-touren-liste-entwurf');
  await noSideways(page);
  // a tap on the band opens Packmodus (the packing day of that trip)
  await band.getByRole('link', { name: new RegExp(esc(T('Open pack mode'))) }).click();
  await expect(page).toHaveURL(/#\/pack\?day$/);
  expect(await page.evaluate(() => localStorage.getItem('pack.currentTrip'))).toBe(NEXT.id);
  expect(errors).toEqual([]);
});

test('a2) nothing open: «Gerade wird keine Tour gepackt» with «Neue Tour» and «Aus einer Vorlage»; the band can be hidden', async ({ page, context }, info) => {
  const errors = await start(page, context, info, data({ nothingOpen: true }));
  const band = page.locator('[data-pack-band]');
  await expect(band).toHaveAttribute('data-pack-band', 'none');
  await expect(band).toContainText(T('nothing open'));
  await expect(band).toContainText(T('No trip is being packed right now'));
  await expect(band.getByRole('button', { name: T('New trip') })).toBeVisible();
  await expect(band.getByRole('link', { name: T('From a template|band') })).toHaveAttribute('href', '#/pack/templates');
  await expect(page.locator('[data-in-pack-mode]')).toHaveCount(0);
  // «Geplant» says it quietly
  await expect(page.locator('[data-no-plan]')).toContainText(T('No trip planned.'));
  await shot(page, info, 'SN4g-touren-liste-nichts-offen');
  // a suggestion: «×» hides it, the quiet link brings it back (kept in the settings)
  await band.getByRole('button', { name: T('Hide the pack mode band') }).click();
  await expect(band).toHaveCount(0);
  await page.reload();
  await expect(page.locator('[data-pack-band]')).toHaveCount(0);
  await page.getByRole('button', { name: T('Show the pack mode band') }).click();
  await expect(page.locator('[data-pack-band]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('b) every Packmodus trip of the period by month; grey rows keep «Bewerten» / «Kurz bewerten»', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const phone = info.project.name === 'phone';
  // AT1 (Noah 14.10.2026 21:19): «Abgeschlossene Touren» lists the Strava activities (tests/e2e/at1.spec.js);
  // the trips packed in the app are the section «Packmodus»
  await expect(page.locator('section[data-finished]').getByRole('heading', { level: 2, name: T('Pack mode|section') })).toBeVisible();
  // the month heads, newest first
  const heads = await list(page).locator('h3.mh').allTextContents();
  expect(heads.length).toBeGreaterThan(3);
  // a rated trip: highlighted, no button; AT1: the values moved to «Abgeschlossene Touren», a Packmodus row says
  // what was packed and which Strava activity belongs to it (none in this fixture)
  const herbst = rowOf(page, 'Herbsttour Hochland');
  await expect(herbst).toHaveAttribute('data-state', 'rated');
  await expect(herbst.locator('[data-values]')).toHaveCount(0);
  await expect(herbst.locator('[data-strava-of="0"]')).toHaveText(T('no Strava activity'));
  await expect(herbst.locator('[data-rate]')).toHaveCount(0);
  // grey: a trip whose Rückblick is missing keeps «Bewerten», the uploaded ride on its own «Kurz bewerten»
  const abend = rowOf(page, 'Abendrunde Hügel');
  await expect(abend).toHaveAttribute('data-state', 'done');
  await expect(abend.getByRole('link', { name: `${T('Rate|debrief')}: Abendrunde Hügel` })).toHaveAttribute('href', `#/debrief/${encodeURIComponent(`${P}abend`)}`);
  const solo = rowOf(page, 'Feierabend Seeufer');
  await expect(solo).toContainText(T('Ride from GPX|kind'));
  await expect(solo.getByRole('link', { name: `${T('Rate briefly')}: Feierabend Seeufer` })).toBeVisible();
  if (phone) {
    expect((await abend.locator('[data-rate]').boundingBox()).width).toBeGreaterThan(300);
  }
  await expect(page.getByText(T('highlighted: with a Rückblick (Rated)'))).toBeVisible();
  await shot(page, info, 'SN4g-touren-werte');
  // «Alle» shows more trips than 12 months (the 2025 ones)
  const n12 = await list(page).locator('li[data-row]').count();
  await page.locator('section[data-finished] .tools').getByRole('button', { name: T('All|period'), exact: true }).click();
  await expect.poll(() => list(page).locator('li[data-row]').count()).toBeGreaterThan(n12);
  // a row opens its trip
  await herbst.getByRole('link', { name: 'Herbsttour Hochland', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`#/debrief/${esc(encodeURIComponent(`${P}herbst`))}`));
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('c) «Filter»: counts, the active filters as chips, «Filter löschen», a saved filter under «Meine Filter»', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const all = await list(page).locator('li[data-row]').count();
  await page.getByRole('button', { name: T('Filter'), exact: true }).click();
  const dlg = page.getByRole('dialog', { name: T('Filter') });
  await expect(dlg).toBeVisible();
  for (const fl of ['FL1', 'FL2', 'FL3', 'FL4', 'FL5', 'FL6', 'FL7', 'FL8']) await expect(dlg.locator(`[data-fs="${fl}"]`)).toBeVisible();
  // FL2: every bike with its number; FL7 with its number
  const road = dlg.locator('[data-fs="FL2"] [data-value="bike-road"]');
  await expect(road).toContainText(`${ROAD.name}${ROAD_TRIPS.length}`);
  await expect(dlg.locator('[data-fs="FL7"]')).toContainText(T('{n} trips with a power meter', { n: 0 }));
  await expect(dlg.locator('[data-apply]')).toHaveText(T('Show {n} trips', { n: all }));
  await road.click();
  await expect(road).toHaveAttribute('aria-pressed', 'true');
  await expect(dlg.locator('[data-apply]')).toHaveText(T('Show {n} trip', { n: ROAD_TRIPS.length }));
  if (info.project.name === 'phone') {
    const b = await dlg.boundingBox();
    expect(Math.round(b.y + b.height)).toBeGreaterThanOrEqual(page.viewportSize().height - 1);
  }
  await shot(page, info, 'SN4g-touren-filter', false);
  // FL8: save it under a name
  await dlg.locator('[data-save-name]').fill('Rennrad allein');
  await dlg.locator('[data-save]').click();
  await expect(dlg.locator('.saved')).toContainText('Rennrad allein');
  await dlg.locator('[data-apply]').click();
  await expect(dlg).toBeHidden();
  // the chip, the number on «Filter», the list «1 von n · gefiltert»
  await expect(page.locator('[data-filter-n]')).toHaveText('1');
  const chip = page.locator('section[data-finished] [data-active-filters] [data-chip="bike:bike-road"]');
  await expect(chip).toHaveText(T('Bike: {name}', { name: ROAD.name }));
  await expect(list(page).locator('li[data-row]')).toHaveCount(ROAD_TRIPS.length);
  await expect(page.locator('[data-list-sub]')).toHaveText(T('{n} of {all} · filtered', { n: ROAD_TRIPS.length, all }));
  await expect(page.locator('[data-my-filters] [data-saved="Rennrad allein"]')).toHaveAttribute('aria-pressed', 'true');
  await shot(page, info, 'SN4g-touren-filter-aktiv');
  // a tap on the chip takes it away
  await chip.click();
  await expect(list(page).locator('li[data-row]')).toHaveCount(all);
  await expect(page.locator('[data-filter-n]')).toHaveCount(0);
  // the saved filter is kept: after a reload one tap sets it again, «Filter löschen» clears it
  await page.reload();
  const saved = page.locator('[data-my-filters] [data-saved="Rennrad allein"]');
  await expect(saved).toHaveAttribute('aria-pressed', 'false');
  await saved.click();
  await expect(list(page).locator('li[data-row]')).toHaveCount(ROAD_TRIPS.length);
  await page.locator('section[data-finished] [data-clear-filters]').click();
  await expect(list(page).locator('li[data-row]')).toHaveCount(all);
  // FL4 several days and FL6 rain together («and»): only multi-day trips with rain
  await page.getByRole('button', { name: T('Filter'), exact: true }).click();
  await dlg.locator('[data-fs="FL4"]').getByRole('button', { name: new RegExp(`^${T('Several days|duration')}`) }).click();
  await dlg.locator('[data-fs="FL6"] [data-value="rain"]').click();
  await dlg.locator('[data-apply]').click();
  await expect(page.locator('[data-filter-n]')).toHaveText('2');
  for (const r of await list(page).locator('li[data-row]').all()) await expect(r.locator('.rs')).toContainText(/\d+ Tage/);
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('d) «In Zahlen»: all five groups open, a jump bar, «Alle zuklappen»', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const iz = page.locator('section[data-in-numbers][data-tours]');
  await expect(iz.getByRole('heading', { level: 2, name: T('In numbers') })).toBeVisible();
  await expect(iz.locator('[data-group]')).toHaveCount(TOUR_GROUPS.length);
  for (const g of TOUR_GROUPS) {
    await expect(iz.locator(`[data-group="${g.key}"] .gh button`)).toHaveAttribute('aria-expanded', 'true');
    await expect(iz.locator(`[data-group="${g.key}"] [data-block]`).first()).toBeVisible();
  }
  // the map is the tile at the end, not a block
  await expect(iz.locator('[data-block="V7"]')).toHaveCount(0);
  // the new blocks: Tempo über die Monate, Geplant und gefahren, Abnutzung, Vergleichsgruppen
  await expect(iz.locator('[data-block="T1"] .bars li[data-month]').first()).toBeAttached();
  await expect(iz.locator('[data-block="T3"] [data-pr]').first()).toBeVisible();
  await expect(iz.locator('[data-block="C1"] [data-cmp]').first()).toBeVisible();
  const jump = iz.locator('[data-jump]');
  await expect(jump.getByRole('button')).toHaveText(TOUR_GROUPS.map((g) => T(g.name)));
  await shot(page, info, 'SN4h-touren-analysen');
  // the jump bar stays on top while scrolling
  await iz.locator('[data-group="records"]').scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 400);
  await expect.poll(async () => (await jump.boundingBox()).y).toBeLessThan(200);
  // «Alle zuklappen», then a jump opens its group again
  await iz.locator('[data-fold-all]').click();
  for (const g of TOUR_GROUPS) await expect(iz.locator(`[data-group="${g.key}"] .gh button`)).toHaveAttribute('aria-expanded', 'false');
  await expect(iz.locator('[data-fold-all]')).toHaveText(T('Open all'));
  await jump.locator('[data-jump-to="body"]').click();
  await expect(iz.locator('[data-group="body"] .gh button')).toHaveAttribute('aria-expanded', 'true');
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('e) the tiles: «Offene Rückblicke» and «Karte» follow a filter, «Gute Tage» does not', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const tiles = page.locator('[data-tour-tiles]');
  await expect(tiles.locator('[data-tile]')).toHaveCount(SK_BIG.trips.length);
  const o1 = tiles.locator('[data-tile="o1"]');
  const o2 = tiles.locator('[data-tile="o2"]');
  const o5 = tiles.locator('[data-tile="o5"]');
  await expect(o1.getByRole('heading', { name: T('Good days for a trip') })).toBeVisible();
  // no home place in the fixture and no internet: a quiet line
  await expect(o1).toContainText(T('Set your home place, then the best days for a ride show here.'));
  // without a filter: every trip shown without a Rückblick (the grey rows), each with «Kurz bewerten»
  const grey = await list(page).locator('li[data-row][data-state="done"]').count();
  expect(grey).toBeGreaterThanOrEqual(2);
  await expect(o2.locator('[data-open]')).toHaveCount(Math.min(4, grey));
  await expect(o2.getByRole('link', { name: `${T('Rate briefly')}: Abendrunde Hügel` })).toBeVisible();
  const routes = await o5.locator('svg line').count();
  expect(routes).toBeGreaterThan(0);
  await expect(tiles.locator('[data-filtered]')).toHaveCount(0);
  // a filter: Velo Rennrad Blau (its one trip has a Rückblick)
  await page.getByRole('button', { name: T('Filter'), exact: true }).click();
  const dlg = page.getByRole('dialog', { name: T('Filter') });
  await dlg.locator('[data-fs="FL2"] [data-value="bike-road"]').click();
  await dlg.locator('[data-apply]').click();
  await expect(tiles.locator('[data-active-filters] [data-chip="bike:bike-road"]')).toBeVisible();
  await expect(o2.locator('[data-open]')).toHaveCount(0);
  await expect(o2.locator('[data-filtered]')).toHaveText(T('filtered: {what}', { what: T('Bike: {name}', { name: ROAD.name }) }));
  await expect(o5.locator('[data-filtered]')).toBeVisible();
  await expect.poll(() => o5.locator('svg line').count()).toBeLessThan(routes);
  await expect(o1.locator('[data-filtered]')).toHaveCount(0);
  await o5.scrollIntoViewIfNeeded();
  await shot(page, info, 'SN4i-touren-kacheln');
  // «Filter löschen» above the tiles clears it
  await tiles.locator('[data-clear-filters]').click();
  await expect(o2.locator('[data-open]')).toHaveCount(Math.min(4, grey));
  // a tile can be hidden (Undo) and shown again
  await o1.getByRole('button', { name: T('More for {what}', { what: T('Good days for a trip') }) }).click();
  await page.getByRole('menuitem', { name: new RegExp(`^${esc(T('Hide'))}`) }).click();
  await expect(o1).toHaveCount(0);
  await tiles.locator('[data-show-tile="o1"]').click();
  await expect(tiles.locator('[data-tile="o1"]')).toBeVisible();
  await noSideways(page);
  expect(errors).toEqual([]);
});
