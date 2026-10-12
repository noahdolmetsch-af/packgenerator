// v0.109.0 Design-Refresh P6 «Rückblick, Auswerten, Fahrten» (T14–T23, approved 12.10.2026): «Tour beendet»,
// the debrief in two columns, the saved debrief, Rückblick, Gelernt, Dein Tempo, Logbuch, Vergangene Touren,
// Fahrten and one ride. Fictional fixture (test_data_gtp_), German, phone + desktop, no horizontal scroll,
// 44 px tap targets.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const wide = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
// the fixture: a 3-day trip ended on 10 October, its debrief still open; an older trip with a saved debrief
const ENDED = 'test_data_gtp_trip24';
const SAVED = 'test_data_gtp_trip02';
const RIDE = 'ride-gtp-01';

async function start(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  // a fixed time in Europe/Zurich, so the days of the trips do not drift
  await page.clock.setFixedTime(new Date('2026-10-12T10:00:00+02:00'));
  await page.goto('./');
  await importAndSettle(page, FIX);
  await page.evaluate((x) => localStorage.setItem('pack.currentTrip', x), ENDED);
}

/** No horizontal scroll, also on a small phone (320 px). */
async function fits(page, info) {
  expect(await wide(page)).toBeLessThanOrEqual(0);
  if (info.project.name === 'phone') {
    await page.setViewportSize({ width: 320, height: 760 });
    await expect.poll(() => page.evaluate(() => innerWidth)).toBe(320);
    expect(await wide(page)).toBeLessThanOrEqual(0);
  }
}

/** The new rows, chips, path links and buttons are at least 44 px high. */
async function targets(page) {
  const small = await page.evaluate(() =>
    [...document.querySelectorAll('main a.rv-row, main button.rv-row, main label.rv-row, main .rv-chip, main .crumb a, main label.btn, main a.btn, main button.btn')]
      .filter((el) => el.offsetParent !== null)
      .map((el) => ({ h: el.getBoundingClientRect().height, text: el.textContent.trim().slice(0, 40) }))
      .filter((x) => x.h < 43.5),
  );
  expect(small).toEqual([]);
}

/** Two columns on a computer: the second column starts to the right of the first. */
async function twoColumns(page, info, left, right) {
  if (info.project.name !== 'desktop') return;
  const a = await page.locator(left).first().boundingBox();
  const b = await page.locator(right).first().boundingBox();
  expect(b.x).toBeGreaterThan(a.x + a.width - 1);
}

test('Tour beendet (T14): the number tile in the card, the notes of the way as rows', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context);
  await page.goto(`./#/trip/${ENDED}/ended`);
  await expect(page.getByRole('heading', { level: 1, name: T('Trip ended') })).toBeVisible();
  await expect(page.locator('section.hero .tally')).toBeVisible();
  const notes = page.locator('section.until');
  if (await notes.count()) await expect(notes.locator('li.rv-row').first()).toBeVisible();
  await expect(page.locator('main .mainbar .btn.hi')).toHaveCount(1);
  await targets(page);
  await fits(page, info);
  expect(errors).toEqual([]);
});

test('Rückblick ausfüllen (T15): chips by bag, «Was hat gefehlt?», notes on the way and «Mehr» in two columns', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context);
  await page.goto(`./#/debrief/${ENDED}`);
  const unneeded = page.locator('section.unneeded');
  await expect(unneeded.getByRole('heading', { level: 2 })).toBeVisible();
  // one tap on a chip marks it «not used», a second tap back
  const chip = unneeded.locator('button.chip').first();
  await expect(chip).toHaveAttribute('aria-pressed', 'false');
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('section.miss-fold textarea')).toBeVisible();
  await expect(page.locator('details.how-fold > summary')).toBeVisible();
  await twoColumns(page, info, 'section.unneeded', 'section.ridenotes, details.how-fold');
  await targets(page);
  await fits(page, info);
  expect(errors).toEqual([]);
});

test('Rückblick gespeichert (T16): «Fertig. Gute Tour!» with four number tiles, the next trip on the right', async ({ page, context }, info) => {
  await start(page, context);
  await page.goto(`./#/debrief/${SAVED}`);
  const ride = page.locator('section.ride');
  await expect(ride.getByRole('heading', { level: 2 })).toHaveText(T('Done. Good trip!'));
  await expect(ride.locator('.rv-tiles > div')).toHaveCount(4);
  await expect(page.getByRole('button', { name: T('Change answers') })).toHaveCount(1);
  await targets(page);
  await fits(page, info);
});

test('Rückblick (T17): the last trip with tiles, 12 months and the comparison left, pace and «Mehr» right', async ({ page, context }, info) => {
  await start(page, context);
  await page.goto('./#/debrief');
  await expect(page.locator('section.lastride .rv-tiles')).toBeVisible();
  await expect(page.locator('section.period')).toBeVisible();
  await expect(page.locator('#compare table.tt')).toBeVisible();
  await expect(page.locator('.below section.sub')).toBeVisible();
  await twoColumns(page, info, 'section.lastride', '.below');
  await targets(page);
  await fits(page, info);
});

test('Gelernt (T18): the search, every topic as a section of rows', async ({ page, context }, info) => {
  await start(page, context);
  await page.goto('./#/debrief/learnings');
  const learned = page.locator('#learnings');
  const topics = learned.locator('section.topic');
  await expect(topics.first()).toBeVisible();
  const all = await learned.locator('li.rv-row').count();
  await learned.getByRole('searchbox').fill('gloves');
  await expect.poll(() => learned.locator('li.rv-row').count()).toBeLessThan(all);
  await expect(page.locator('main .crumb [aria-current="page"]')).toBeVisible();
  await targets(page);
  await fits(page, info);
});

test('Dein Tempo (T19): the rule as a card and the charts left, «Deine Fahrten» right', async ({ page, context }, info) => {
  await start(page, context);
  await page.goto('./#/debrief/pace');
  await expect(page.locator('section.rule .rv-box h2')).toBeVisible();
  await expect(page.locator('section.rule [role="status"]')).toBeVisible();
  await expect(page.locator('section.rides-c input[type=file]')).toHaveCount(1);
  await twoColumns(page, info, 'section.rule', 'section.rides-c');
  await targets(page);
  await fits(page, info);
});

test('Logbuch (T20): Reiseart as chips, the list in a card, the best values on the right', async ({ page, context }, info) => {
  await start(page, context);
  await page.goto('./#/debrief/logbook');
  const log = page.locator('#logbook');
  const rows = log.locator('ul.log > li');
  await expect(rows.nth(5)).toBeVisible();
  const all = await rows.count();
  expect(all).toBeGreaterThan(5);
  const areas = log.getByRole('group', { name: T('Area') });
  await expect(areas.getByRole('button', { name: T('All|period') })).toHaveAttribute('aria-pressed', 'true');
  const other = areas.getByRole('button').nth(2);
  await other.click();
  await expect(other).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => rows.count()).toBeLessThan(all);
  await expect(page.getByRole('heading', { level: 2, name: T('Best values') })).toBeVisible();
  await twoColumns(page, info, '#logbook', 'section.best');
  await targets(page);
  await fits(page, info);
});

test('Vergangene Touren (T21): «In diesem Zeitraum» as tiles, the table in a white card', async ({ page, context }, info) => {
  await start(page, context);
  await page.goto('./#/pack/past');
  await expect(page.getByRole('heading', { level: 1, name: T('Past trips') })).toBeVisible();
  await expect(page.locator('section.sums .rv-tile')).toHaveCount(5);
  await expect(page.locator('table.tt tbody th[scope="row"]').first()).toBeVisible();
  await expect(page.getByRole('searchbox', { name: T('Search trips and learnings') })).toBeVisible();
  await targets(page);
  await fits(page, info);
});

test('Fahrten (T22): the dashed card to choose a file, the saved rides, «Gut zu wissen» and «Mehr»', async ({ page, context }, info) => {
  await start(page, context);
  await page.goto('./#/debrief/ride');
  await expect(page.getByRole('heading', { level: 1, name: T('Upload ride') })).toBeVisible();
  await expect(page.locator('.drop .pickbtn input[type=file]')).toHaveCount(1);
  const saved = page.getByRole('list', { name: T('Saved rides') });
  await expect(saved.locator('a.rv-row').first()).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: T('Good to know') })).toBeVisible();
  await twoColumns(page, info, '.drop', 'section[aria-labelledby="know-h"]');
  await targets(page);
  await fits(page, info);
});

test('Fahrt (T23): numbered sections, where it is saved and «counts for your pace» on the right', async ({ page, context }, info) => {
  await start(page, context);
  await page.goto(`./#/debrief/ride/${RIDE}`);
  await expect(page.getByRole('heading', { level: 2, name: `1 · ${T('Numbers')}` })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: `2 · ${T('Pauses')}` })).toBeVisible();
  await expect(page.locator('.rv-tiles.nums .rv-tile')).toHaveCount(4);
  await expect(page.getByRole('heading', { level: 2, name: T('Saved with') })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: new RegExp(T('Counts for your pace')) })).toBeVisible();
  await expect(page.getByRole('button', { name: T('Delete ride') })).toBeVisible();
  await targets(page);
  await fits(page, info);
});
