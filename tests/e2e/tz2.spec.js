// TZ-2 «Fest nach der Fahrt» (mockup TZ2 Tour-Kopf and Heute, Noah 13.10.2026 «1-5 a», «TZ1–TZ3 freigegeben»):
// the packing list of a completed or rated trip is fixed («so bist du gefahren»), «Wieder öffnen» asks once
// and makes it planned again (with Undo), and a trip whose date passed without an end asks «Bist du
// gefahren?» in its header and on Heute. Fictional fixture (test_data_gtp_), German, phone + desktop, no
// horizontal scroll. Which trip is in which state comes from the app's own rule (src/lib/tripstate.js).
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { tripStates, STATE_NAMES } from '../../src/lib/tripstate.js';
import { isFixed, asksRide } from '../../src/lib/trip/fixed.js';
import { importAndSettle, settle } from './settle.js';

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const TODAY = '2026-10-13'; // a Tuesday without a ride
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wide = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);

const tables = JSON.parse(readFileSync(FIX, 'utf8')).tables;
const infos = tripStates(tables.trips, { debriefs: tables.debriefs, rides: tables.rides, today: TODAY });
const of = (test) => tables.trips.filter((x) => test(infos[x.id])).sort((a, b) => b.startDate.localeCompare(a.startDate));
// a completed trip with its packing list (the debrief only started), a rated one, a planned one, one that asks
const DONE = of((i) => i.state === 'done' && !asksRide(i)).find((x) => x.entries?.length);
const RATED = of((i) => i.state === 'rated').find((x) => x.entries?.length);
const PLAN = of((i) => i.state === 'plan' && !i.early).find((x) => x.entries?.length && x.domain === 'bikepacking');
const ASK = of(asksRide)[0];

async function start(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.setFixedTime(new Date(`${TODAY}T10:00:00+02:00`));
  await page.goto('./');
  await importAndSettle(page, FIX);
}

async function openTrip(page, id, hash = '#/pack') {
  await page.evaluate((x) => localStorage.setItem('pack.currentTrip', x), id);
  await page.goto(`./${hash}`);
  await page.reload();
  await expect(page.locator('.trip-band h1')).toBeVisible();
}

test('the fixture has a trip in each case', () => {
  for (const x of [DONE, RATED, PLAN, ASK]) expect(x).toBeTruthy();
  expect(isFixed(infos[DONE.id]) && isFixed(infos[RATED.id]) && !isFixed(infos[PLAN.id])).toBe(true);
});

test('Tour-Kopf: the band of each state, the fixed list, «Wieder öffnen» with one question and Undo', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context);
  const note = page.locator('.trip-band .stn');

  // planned: everything stays changeable, «Als Vorlage speichern»
  await openTrip(page, PLAN.id);
  await expect(note).toHaveAttribute('data-state', 'plan');
  await expect(note.locator('h2')).toHaveText(T('Everything stays changeable until you set off.')); // Impeccable Planen 3: one line
  await expect(note.getByRole('button', { name: T('Save as template') })).toBeVisible();
  if (info.project.name === 'desktop') await expect(page.locator('.add-mat')).toBeVisible(); // on a phone it is the + below

  // completed: «so bist du gefahren», the list fixed, «Rückblick ausfüllen» and «Wieder öffnen»
  await openTrip(page, DONE.id);
  await expect(note).toHaveAttribute('data-state', 'done');
  await expect(note.locator('h2')).toContainText(T('Completed on {date}: this is how you rode.', { date: 'X' }).split('X')[0]);
  await expect(note.getByText(T('The packing list is fixed now.'), { exact: false })).toBeVisible();
  await expect(note.getByRole('link', { name: T('Fill in the debrief') })).toHaveAttribute('href', new RegExp(`#/debrief/${esc(encodeURIComponent(DONE.id))}$`));
  await expect(page.locator('.add-mat')).toHaveCount(0);
  await expect(page.getByRole('button', { name: T('Add material') })).toHaveCount(0);
  await expect(page.locator('.bag-group').first()).toBeVisible();
  await page.locator('.bag-group .bag-heading').first().click();
  await expect(page.locator('.planning-row').first()).toBeVisible();
  await expect(page.locator('button.row-main')).toHaveCount(0); // the rows are to read only
  await expect(page.locator('.addrow')).toHaveCount(0);
  // the menu «…»: «Wieder öffnen», nothing that changes the list
  await page.locator('.list-menu summary').click();
  await expect(page.locator('.list-menu-content').getByRole('button', { name: T('Reopen') })).toBeVisible();
  await expect(page.locator('.list-menu-content').getByRole('button', { name: T('Edit trip') })).toHaveCount(0);
  await expect(page.locator('.list-menu-content').getByRole('button', { name: T('Save as template') })).toHaveCount(0);
  await page.locator('.list-menu summary').click();
  expect(await wide(page)).toBeLessThanOrEqual(0);

  // «Wieder öffnen» asks once; «Fest lassen» keeps it
  await note.getByRole('button', { name: T('Reopen') }).click();
  const sheet = page.getByRole('dialog', { name: T('Reopen this trip?') });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: T('Keep it fixed') }).click();
  await expect(sheet).toHaveCount(0);
  await expect(note).toHaveAttribute('data-state', 'done');
  // … «Wieder öffnen» makes it planned: the list opens, Undo for a moment
  await note.getByRole('button', { name: T('Reopen') }).click();
  await page.getByRole('dialog', { name: T('Reopen this trip?') }).getByRole('button', { name: T('Reopen') }).click();
  await expect(note).toHaveAttribute('data-state', 'plan');
  await expect(page.locator('.trip-band .kline .tst')).toHaveAttribute('data-state', 'plan');
  await expect(note.getByText(T('Reopened: the trip is planned again.'))).toBeVisible();
  await expect(page.locator('button.row-main').first()).toBeVisible();
  // Undo: completed again
  await note.getByRole('button', { name: T('Undo') }).click();
  await expect(note).toHaveAttribute('data-state', 'done');
  await expect(page.locator('button.row-main')).toHaveCount(0);

  // rated: debrief saved, «Rückblick ändern», a template may come from here
  await openTrip(page, RATED.id);
  await expect(note).toHaveAttribute('data-state', 'rated');
  await expect(note.locator('h2')).toContainText(T('Rated|state'));
  await expect(note.getByRole('link', { name: T('Change debrief') })).toBeVisible();
  await expect(page.locator('.add-mat')).toHaveCount(0);
  expect(await wide(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('Tour-Kopf: «Datum vorbei. Bist du gefahren?» – Ja closes the trip, Undo takes it back', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context);
  const note = page.locator('.trip-band .stn');
  await openTrip(page, ASK.id);
  await expect(note).toHaveAttribute('data-ask', '');
  await expect(note.locator('h2')).toHaveText(T('Date passed. Did you ride?'));
  await note.getByRole('button', { name: T('Yes|rode'), exact: true }).click();
  await expect(note).not.toHaveAttribute('data-ask', '');
  await expect(note.locator('h2')).toContainText(T('Completed on {date}: this is how you rode.', { date: 'X' }).split('X')[0]);
  await expect(page.locator('.trip-band .kline .tst')).not.toContainText(T('date passed'));
  await note.getByRole('button', { name: T('Undo') }).click();
  await expect(note).toHaveAttribute('data-ask', '');
  expect(await wide(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('Packen: a fixed list is to read, no ticks', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context);
  await openTrip(page, DONE.id, '#/pack?day');
  await expect(page.locator('.trip-band .stn')).toHaveAttribute('data-state', 'done');
  await expect(page.locator('.trip-band .kick')).toHaveText(T('Packing list as ridden'));
  const items = page.locator('.pbag.cur .items button.it');
  await expect(items.first()).toBeVisible();
  await expect(items.first()).toBeDisabled();
  await expect(page.getByRole('button', { name: T('Whole bag packed') })).toHaveCount(0);
  await expect(page.getByRole('button', { name: T('Everything is packed') })).toHaveCount(0);
  expect(await wide(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('Heute: «Rückblick ausfüllen» and «Bist du gefahren?» with Ja · Nicht gefahren and Undo', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context);
  await page.goto('./#/');
  await settle(page);
  const imp = page.locator('section.imp');
  const more = imp.getByRole('button', { name: new RegExp(esc(T('Show all {n}', { n: 'X' })).replace('X', '\\d+')) });
  // v0.155.0 «Heute neu geordnet» (2a, changed on purpose): one line with two rows; «Show all» opens the rest
  await expect(more).toBeVisible();
  await more.click();
  // the open debrief: «… (date): Rückblick ausfüllen · 2 Min.» with «Rückblick»; «Alles gut» stays beside it
  const deb = imp.locator('li[data-row="debrief"]');
  await expect(deb).toHaveCount(1);
  await expect(deb.locator('.tst')).toHaveText(T(STATE_NAMES.done));
  await expect(deb).toContainText(T('{title} ({date}): fill in the debrief · 2 min.', { title: 'X', date: 'Y' }).split('Y)')[1]);
  await expect(deb.getByRole('button', { name: T('Debrief'), exact: true })).toBeVisible();
  await expect(deb.getByRole('button', { name: T('All good') })).toBeVisible();
  // the question: the newest trip whose date passed without an end
  const ask = imp.locator('li[data-row="ride"]');
  await expect(ask).toHaveCount(1);
  await expect(ask).toContainText(ASK.title);
  await expect(ask.locator('.tst')).toHaveAttribute('data-state', 'done');
  const yes = ask.getByRole('button', { name: T('Yes|rode'), exact: true });
  const no = ask.getByRole('button', { name: T('Not ridden|answer') });
  for (const b of [yes, no]) expect((await b.boundingBox()).height, '44 px target').toBeGreaterThanOrEqual(44 - 0.5);
  expect(await wide(page)).toBeLessThanOrEqual(0);
  await no.click();
  await expect(imp.locator('li[data-row="ride"]').filter({ hasText: ASK.title })).toHaveCount(0);
  const notice = imp.getByRole('status').filter({ hasText: T('{trip}: marked as not ridden.', { trip: ASK.title }) });
  await expect(notice).toBeVisible();
  await notice.getByRole('button', { name: T('Undo') }).click();
  await expect(imp.locator('li[data-row="ride"]').filter({ hasText: ASK.title })).toHaveCount(1);
  expect(errors).toEqual([]);
});
