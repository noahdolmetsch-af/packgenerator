// v0.125.0 TZ-1 «Zustand sichtbar» (mockups TZ1–TZ2, Noah 13.10.2026 «1-5 a», «TZ1–TZ3 freigegeben»):
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

// SN4g «Touren-Seite, Runde 2» (Noah 13.10.2026 «SN4g–SN4i freigegeben»): the planned trips stand as cards in
// «Geplant», the finished ones as rows of «Abgeschlossene Touren» with the chips Abgeschlossen / Bewertet and a
// legend of the two colours; every card and row keeps its pill (icon + word, never colour alone).
const LIST_STATES = STATES.filter((s) => s !== 'plan');

test('Touren: the three states on cards and rows, chips with numbers, a pill on every trip, the legend', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context);
  await page.goto('./#/trips');
  await expect(page.getByRole('heading', { level: 1, name: T('Trips|place') })).toBeVisible();
  expect(counts.plan * counts.done * counts.rated, 'the fixture has trips in every state').toBeGreaterThan(0);
  // 0.161.0 (Bugfixes 0.132.2 B1, Noah 2a): completed and rated count the chosen period and say which (checked below)
  await expect(page.locator('.trips .ph .cnt[data-counts]')).toContainText(T('{n} planned', { n: counts.plan }));
  await expect(page.locator('.trips .ph .cnt[data-counts]')).toContainText(T('in 12 months'));

  // «Geplant»: every card carries the pill «Geplant»; the next trip says «Morgen»
  const planned = page.locator('section[data-planned]');
  const more = planned.getByRole('button', { name: new RegExp(esc(T('All {n} planned trips', { n: 'X' })).replace('X', '\\d+')) });
  if (await more.count()) await more.click();
  const cards = planned.locator('li.pc');
  const nCards = await cards.count();
  expect(nCards).toBeGreaterThan(0);
  await expect(planned.locator('li.pc .tst[data-state="plan"]')).toHaveCount(nCards);
  await expect(planned.locator('li.pc .tst svg')).toHaveCount(nCards);
  await expect(planned.locator('li.pc[data-trip="test_data_gtp_trip27"] .tst')).toHaveText(`${T('Planned|state')} · ${T('Tomorrow')}`);

  // «Abgeschlossene Touren» over all years: the chips «Alle» and one per state of the list with its number
  const done = page.locator('section[data-finished]');
  await done.getByRole('button', { name: T('All|period'), exact: true }).click();
  const nState = (s) => done.locator(`[data-trip-list] li[data-row][data-state="${s}"]`).count();
  await expect(page.locator('.trips .ph .cnt[data-counts]')).toHaveText([T('{n} planned', { n: counts.plan }), `${T('since the start')}: ${T('{n} completed', { n: await nState('done') })}`, T('{n} rated', { n: await nState('rated') })].join(' · '));
  const chips = done.getByRole('group', { name: T('Show trips') }).getByRole('button');
  await expect(chips).toHaveCount(1 + LIST_STATES.length);
  await expect(chips.first()).toHaveAttribute('aria-pressed', 'true');
  const rows = done.locator('[data-trip-list] li[data-row]');
  await expect(chips.first()).toContainText(String(await rows.count()));
  for (const [i, s] of LIST_STATES.entries()) {
    const n = await done.locator(`[data-trip-list] li[data-row][data-state="${s}"]`).count();
    expect(n).toBeGreaterThan(0);
    await expect(chips.nth(i + 1)).toHaveText(new RegExp(`${esc(T(STATE_NAMES[s]))}\\s*${n}`));
    // every row carries the pill of its own state: icon + word
    await expect(done.locator(`[data-trip-list] li[data-row][data-state="${s}"] .tst[data-state="${s}"]`)).toHaveCount(n);
    await expect(done.locator(`[data-trip-list] li[data-row][data-state="${s}"] .tst svg`)).toHaveCount(n);
  }
  // a date passed without an end, and the trip from an uploaded ride
  await expect(done.locator('li[data-row="test_data_gtp_trip28"] .tst')).toHaveText(`${T('Completed|state')} · ${T('date passed')}`);
  await expect(done.locator('li[data-row="test_data_gtp_trip90"] .tst')).toHaveText(`${T('Completed|state')} · GPX`);

  // the legend of the two colours under the list
  await expect(done.getByRole('list', { name: T('What the colours mean') }).getByRole('listitem')).toHaveCount(LIST_STATES.length);

  // one chip shows one state only; tapping it again shows all
  const all = await rows.count();
  await chips.nth(1 + LIST_STATES.indexOf('done')).click();
  await expect(chips.nth(1 + LIST_STATES.indexOf('done'))).toHaveAttribute('aria-pressed', 'true');
  await expect(done.locator('[data-trip-list] li[data-row]:not([data-state="done"])')).toHaveCount(0);
  await chips.nth(1 + LIST_STATES.indexOf('done')).click();
  await expect(rows).toHaveCount(all);
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
