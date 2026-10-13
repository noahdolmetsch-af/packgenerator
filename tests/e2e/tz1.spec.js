// v0.126.0 TZ-1 «Zustand sichtbar» (mockups TZ1–TZ2, Noah 13.10.2026 «1-5 a», «TZ1–TZ3 freigegeben»):
// every trip shows its state Geplant / Abgeschlossen / Bewertet: on Touren (groups, filter chips, the pill
// on every tile, the legend), in the trip header and on Heute. Fictional fixture (test_data_gtp_) plus one
// trip made from an uploaded ride, German, phone + desktop, no horizontal scroll. The expected numbers come
// from the app's own rule (src/lib/tripstate.js), not from a copy.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { tripStates, stateCounts, STATES, STATE_NAMES } from '../../src/lib/tripstate.js';
import { importAndSettle, settle } from './settle.js';

// the groups of Touren are the states in their order (tests/tripsoverview.test.js checks GROUPS against STATES)
const GROUPS = STATES.map((key) => ({ key }));

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const TODAY = '2026-10-13'; // a Tuesday without a ride: Today does not move on to «On the way»
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wide = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);

// one trip made from an uploaded ride (gpx.js tripFromRide), written straight into IndexedDB
const GPX_TRIP = { id: 'test_data_gtp_trip90', title: 'test_data_gtp_ Gravel ride', domain: 'bikepacking', startDate: '2026-10-11', days: 1, entries: [], ready: [], status: 'done', finished: '2026-10-11', fromRide: 'ride-gtp-09', route: { km: 94 }, createdAt: '2026-10-11T18:00:00.000Z' };
const tables = JSON.parse(readFileSync(FIX, 'utf8')).tables;
const trips = [...tables.trips, GPX_TRIP];
const infos = tripStates(trips, { debriefs: tables.debriefs, rides: tables.rides, today: TODAY });
const counts = stateCounts(infos);

async function start(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.clock.setFixedTime(new Date(`${TODAY}T10:00:00+02:00`));
  await page.goto('./');
  await importAndSettle(page, FIX);
  await page.evaluate(
    (trip) =>
      new Promise((ok, no) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => no(r.error);
        r.onsuccess = () => {
          const tx = r.result.transaction('trips', 'readwrite');
          tx.objectStore('trips').put(trip);
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = () => no(tx.error);
        };
      }),
    GPX_TRIP,
  );
  await page.reload();
  await settle(page);
}

async function openTrip(page, id) {
  await page.evaluate((x) => localStorage.setItem('pack.currentTrip', x), id);
  await page.goto('./#/pack');
  await page.reload();
  await expect(page.locator('.trip-band h1')).toBeVisible();
}

test('Touren: the three states as groups, chips with numbers, a pill on every tile, the legend', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context);
  await page.goto('./#/trips');
  await expect(page.getByRole('heading', { level: 1, name: T('Trips|place') })).toBeVisible();
  expect(counts.plan * counts.done * counts.rated, 'the fixture has trips in every state').toBeGreaterThan(0);
  await expect(page.locator('.trips .ph .cnt')).toHaveText([T('{n} planned', { n: counts.plan }), T('{n} completed', { n: counts.done }), T('{n} rated', { n: counts.rated })].join(' · '));

  // the chips: «Alle» and one per state with its number; «Alle» is on
  const chips = page.getByRole('group', { name: T('Show trips') }).getByRole('button');
  await expect(chips).toHaveCount(1 + STATES.length);
  await expect(chips.first()).toHaveAttribute('aria-pressed', 'true');
  await expect(chips.first()).toContainText(String(counts.all));
  for (const [i, s] of STATES.entries()) await expect(chips.nth(i + 1)).toHaveText(new RegExp(`${esc(T(STATE_NAMES[s]))}\\s*${counts[s]}`));

  // the groups in the order of the states, each heading with its word and number
  await expect(page.locator('section.grp')).toHaveCount(GROUPS.length);
  for (const g of GROUPS) {
    const sec = page.locator(`section.grp[data-group="${g.key}"]`);
    await expect(sec.locator('h2')).toContainText(T(STATE_NAMES[g.key]));
    // every tile carries the pill of its own group's state: icon + word, never colour alone
    const tiles = sec.locator('li.tile:not(.add)');
    const n = await tiles.count();
    expect(n).toBeGreaterThan(0);
    await expect(sec.locator(`li.tile:not(.add) .tst[data-state="${g.key}"]`)).toHaveCount(n);
    await expect(sec.locator('li.tile:not(.add) .tst svg')).toHaveCount(n);
  }
  // the next trip (tomorrow), a date passed without an end, and the trip from an uploaded ride
  await expect(page.locator('li.tile[data-trip="test_data_gtp_trip27"] .tst')).toHaveText(`${T('Planned|state')} · ${T('Tomorrow')}`);
  await expect(page.locator('li.tile[data-trip="test_data_gtp_trip28"] .tst')).toHaveText(`${T('Completed|state')} · ${T('date passed')}`);
  await expect(page.locator('li.tile[data-trip="test_data_gtp_trip90"] .tst')).toHaveText(`${T('Completed|state')} · GPX`);
  await expect(page.locator('section.grp[data-group="rated"]').getByRole('link', { name: new RegExp(esc(T('All {n} rated trips', { n: counts.rated }))) })).toBeVisible();

  // the legend: on the side of a computer, folded under the chips on a phone
  if (info.project.name === 'phone') {
    await expect(page.locator('.lgbox')).toBeHidden();
    await page.getByText(T('What do the three states mean?')).click();
    await expect(page.locator('.lgfold .lg li')).toHaveCount(STATES.length);
  } else {
    await expect(page.getByRole('heading', { name: T('Three states') })).toBeVisible();
    await expect(page.locator('.lgbox .lg li')).toHaveCount(STATES.length);
  }

  // one chip shows one state only; tapping it again shows all
  await chips.nth(1 + STATES.indexOf('done')).click();
  await expect(chips.nth(1 + STATES.indexOf('done'))).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('section.grp')).toHaveCount(1);
  await expect(page.locator('section.grp[data-group="done"]')).toBeVisible();
  await chips.nth(1 + STATES.indexOf('done')).click();
  await expect(page.locator('section.grp')).toHaveCount(GROUPS.length);
  expect(await wide(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('Tour-Kopf: the pill with its extra in each state', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context);
  const head = page.locator('.trip-band .kline .tst');
  // planned, tomorrow
  await openTrip(page, 'test_data_gtp_trip27');
  await expect(head).toHaveAttribute('data-state', 'plan');
  await expect(head).toHaveText(`${T('Planned|state')} · ${T('Tomorrow')}`);
  // completed: ended in the app, the debrief still missing (trip28: the date passed, never ended)
  await openTrip(page, 'test_data_gtp_trip28');
  await expect(head).toHaveAttribute('data-state', 'done');
  await expect(head).toHaveText(`${T('Completed|state')} · ${T('date passed')}`);
  // rated: the day the debrief was saved
  await openTrip(page, 'test_data_gtp_trip01');
  await expect(head).toHaveAttribute('data-state', 'rated');
  await expect(head).toHaveText(new RegExp(`^\\s*${esc(T('Rated|state'))} · 28\\. Sept`));
  expect(await wide(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('Heute: the next trip with «Geplant», an open debrief with «Abgeschlossen»', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context);
  await page.goto('./#/');
  await settle(page);
  const card = page.locator('section.trip');
  await expect(card.locator('.kl .tst')).toHaveAttribute('data-state', 'plan');
  await expect(card.locator('.kl .tst')).toHaveText(T('Planned|state'));
  const imp = page.locator('section.imp');
  const more = imp.getByRole('button', { name: new RegExp(esc(T('Show all {n}', { n: 'X' })).replace('X', '\\d+')) });
  if (await more.count()) await more.click();
  const row = imp.locator('li[data-row="debrief"]');
  await expect(row).toHaveCount(1);
  await expect(row.locator('.tst')).toHaveAttribute('data-state', 'done');
  await expect(row.locator('.tst')).toHaveText(T('Completed|state'));
  expect(await wide(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});
