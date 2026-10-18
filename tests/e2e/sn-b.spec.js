// SN2 + SN4 «Seiten neu» (mockups approved 13.10.2026, ★ 2a and 4a): Rückblick, Logbuch, Dein Tempo and
// Vergangene Touren with the trip states. The Rückblick: state pills in the head, the trip whose debrief is
// missing on top with «Bewerten» and «Nicht gefahren» (Undo), the long table open under «Alle Kennzahlen» (answer 2b),
// a column Zustand; Logbuch: a pill per row, chips per state, the year as a toggle; Tempo: one line, five
// marks, «Fahrt hochladen»; Vergangene Touren: the card «Dein 2026», chips per state, «Bewerten» in the row,
// cards on a phone. Fictional fixture (test_data_gtp_), German, phone + desktop, no horizontal scroll. The
// numbers are checked against each other (chips, rows, pills, the Rückblick on this year), not against a copy.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const TODAY = '2026-10-13';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wide = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
const SHOTS = '/tmp/claude-0/sn-shots/sn-b';

const yearKey = TODAY.slice(0, 4);
const int = (s) => Number(String(s ?? '').replace(/[^\d]/g, '') || 0);
/** The number after the word of a state chip («Bewertet 20» → 20). */
const chipN = async (chip) => int((await chip.locator('.num').textContent()) ?? '');

async function start(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  // in the morning: no trip of the fixture opens «Tour beendet» by itself
  await page.clock.setFixedTime(new Date(`${TODAY}T10:00:00+02:00`));
  await page.goto('./');
  await importAndSettle(page, FIX);
}
const shot = (page, info, name) => page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });

test('Rückblick: state pills, the missing debrief on top with Undo, the figures folded, a column Zustand', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context);
  await page.goto('./#/debrief');
  await expect(page.getByRole('heading', { level: 1, name: T('Look back|page') })).toBeVisible();

  // the head: the period's states as pills, «12 Monate · n Touren gefahren», n = the tile «Touren»
  const pills = page.locator('.hub .head .pills [data-state]');
  await expect(pills.first()).toContainText(T('Completed|state'));
  await expect(pills.last()).toContainText(T('Rated|state'));
  const tiles = page.locator('section.period .rv-tile');
  await expect(tiles).toHaveCount(4);
  const trips = int(await tiles.first().locator('b').textContent());
  const pillN = async (i) => int((await pills.nth(i).locator('.x').textContent()) ?? '');
  expect((await pillN(0)) + (await pillN(1)), 'Abgeschlossen + Bewertet = the trips of the period').toBe(trips);
  await expect(page.locator('.hub .head .page-sub')).toHaveText(`${T('12 months')} · ${T('{n} trips ridden', { n: trips })}`);

  // the trip whose debrief is missing: one main button «Rückblick schreiben» (Impeccable Rückblick 2), a quiet «Nicht gefahren»
  const hero = page.locator('[data-open-debrief]');
  const name = (await hero.locator('.hname').textContent()).trim();
  expect(name).toMatch(/^test_data_gtp_/);
  await expect(hero.getByRole('link', { name: new RegExp(`^(${esc(T('Write the debrief'))}|${esc(T('Continue the debrief'))}): ${esc(name)}$`) })).toBeVisible();
  await expect(hero.locator('[data-state="done"]')).toBeVisible();
  await expect(page.locator('.hub .btn.hi:visible')).toHaveCount(1);
  await shot(page, info, 'SN2-rueckblick');

  // the long table is open under «Alle Kennzahlen» as before (answer 2b) and can be folded
  const fold = page.getByRole('button', { name: T('All figures') });
  await expect(fold).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.kz')).toBeVisible();
  await expect(page.locator('.kz').getByRole('rowheader', { name: T('Distance') })).toBeVisible();
  await fold.click();
  await expect(page.locator('.kz')).toHaveCount(0);
  await fold.click();
  await expect(page.locator('.kz')).toBeVisible();

  // «Touren im Vergleich»: every row with its state pill (on a phone under the name)
  const rows = page.locator('#compare table.st tbody tr');
  expect(await rows.count()).toBeGreaterThan(1);
  const pillIn = info.project.name === 'phone' ? '.ph-only [data-state]' : 'td [data-state]';
  for (const r of await rows.all()) await expect(r.locator(pillIn)).toBeVisible();
  // the small charts and all columns stay one tap away
  await page.getByRole('button', { name: T('Charts and all columns') }).click();
  await expect(page.locator('#cmp-all .minis .mini').first()).toBeVisible();

  // «Nicht gefahren»: the trip leaves the Rückblick, «Rückgängig» brings it back
  await hero.getByRole('button', { name: T('Not ridden') }).click();
  await expect(page.locator('.hub .undo')).toContainText(T('Not ridden: {title}.', { title: name }));
  await expect(page.locator('main').getByText(name, { exact: true })).toHaveCount(0);
  await page.locator('.hub .undo').getByRole('button', { name: T('Undo') }).click();
  await expect(page.locator('[data-open-debrief] .hname')).toHaveText(name);

  expect(await wide(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('Logbuch: a pill per trip, chips per state, the year as a toggle', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context);
  await page.goto('./#/debrief/logbook');
  await expect(page.getByRole('heading', { level: 1, name: T('Logbook') })).toBeVisible();
  await expect(page.locator('.lbsub')).toContainText(new RegExp(esc(T('{n} debriefs missing', { n: 'X' })).replace('X', '\\d+')));

  // the year is a toggle, no drop-down
  await expect(page.locator('#logbook select')).toHaveCount(0);
  const years = page.getByRole('group', { name: T('Year') });
  await expect(years.getByRole('button', { name: yearKey })).toBeVisible();
  await expect(years.getByRole('button', { name: T('All|period') })).toHaveAttribute('aria-pressed', 'true');

  // every trip row has its pill; the chips count them
  const tripRows = page.locator('#logbook a.row');
  const n = await tripRows.count();
  expect(n).toBeGreaterThan(5);
  await expect(page.locator('#logbook a.row [data-state]')).toHaveCount(n);
  await shot(page, info, 'SN2-logbuch');
  const chips = page.locator('.stchips .sc');
  await expect(chips.nth(1)).toContainText(T('Completed|state'));
  await expect(chips.nth(2)).toContainText(T('Rated|state'));
  const done = await chipN(chips.nth(1));
  const rated = await chipN(chips.nth(2));
  expect(done + rated).toBe(n);
  await expect(page.locator('#logbook a.row[data-state="done"]')).toHaveCount(done);

  // «Bewertet» shows only rated rows, a second tap all again
  await chips.nth(2).click();
  await expect(tripRows).toHaveCount(rated);
  await expect(page.locator('#logbook a.row[data-state="done"]')).toHaveCount(0);
  await chips.nth(2).click();
  await expect(chips.first()).toHaveAttribute('aria-pressed', 'true');
  await expect(tripRows).toHaveCount(n);

  // the year toggle filters
  await years.getByRole('button', { name: yearKey }).click();
  await expect.poll(() => tripRows.count()).toBeLessThan(n);
  expect(await tripRows.count()).toBeGreaterThan(0);

  expect(await wide(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('Dein Tempo: one line, the rule big, five marks, «Fahrt hochladen» as the one main button', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context);
  await page.goto('./#/debrief/pace');
  await expect(page.getByRole('heading', { level: 1, name: T('Your pace') })).toBeVisible();
  await expect(page.locator('.psub')).toHaveText(T('How the app guesses the riding time of a new trip'));
  await expect(page.locator('#rule-h')).toHaveText(new RegExp(`^${esc(T('{kmh} km/h and 1 h per {m} Hm', { kmh: 'K', m: 'M' })).replace('K', '[\\d.]+').replace('M', "[\\d’']+")}$`));
  const main = page.locator('.tempo .btn.hi');
  await expect(main).toHaveCount(1);
  await expect(main).toContainText(T('Upload ride'));
  await expect(main.locator('input[type=file]')).toHaveCount(1);
  // below five rides the five marks show how far it is; else the rule in use
  await expect(page.locator('section.rule [role="status"]')).toBeVisible();
  if (await page.locator('.marks').count()) await expect(page.locator('.marks i')).toHaveCount(5);
  await expect(page.getByRole('heading', { name: T('Where the rides come from') })).toBeVisible();
  await expect(page.locator('.rides-c label.rv-row')).toContainText(T('GPX file'));
  await shot(page, info, 'SN2-tempo');
  expect(await wide(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('Vergangene Touren: «Dein 2026», chips per state, «Bewerten» in the row, cards on a phone', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context);
  await page.goto('./#/pack/past');
  await expect(page.getByRole('heading', { level: 1, name: T('Past trips') })).toBeVisible();

  // the year card
  const card = page.locator('[data-year-card]');
  await expect(card.locator('b')).toContainText(T('Your {year}: {trips}, {km} km, {rain}', { year: yearKey }).split('{trips}')[0]);
  const cardText = (await card.locator('b').textContent()) ?? '';

  // the chips count the rows; Art stands in the same row
  const chips = page.locator('.stchips .sc');
  const rows = page.locator('.tt tbody tr[data-state]');
  const n = await rows.count();
  expect(n).toBeGreaterThan(5);
  expect(await chipN(chips.first())).toBe(n);
  const done = await chipN(chips.nth(1));
  const rated = await chipN(chips.nth(2));
  expect(done + rated).toBe(n);
  await expect(page.locator('.stchips .artpick .rv-chip')).toBeVisible();
  await expect(page.locator('.past .page-sub')).toContainText(T('{n} without a debrief', { n: done }));

  // a pill in every row, «Bewerten» in the rows whose debrief is missing
  await expect(page.locator('.tt tbody tr[data-state] td.stc [data-state]')).toHaveCount(n);
  const rate = page.locator('.tt td.go').getByRole('link', { name: new RegExp(`^${esc(T('Rate|debrief'))}: `) });
  expect(await rate.count()).toBeGreaterThan(0);
  await expect(page.locator('.tt tr[data-state="rated"] td.go .btn')).toHaveCount(0);
  if (info.project.name === 'phone') await expect(page.locator('.tt thead')).toBeHidden();
  await shot(page, info, 'SN4-vergangene-touren');

  // «Bewertet» only
  await chips.nth(2).click();
  await expect(rows).toHaveCount(rated);
  await expect(page.locator('.tt tbody tr[data-state="done"]')).toHaveCount(0);
  expect(await wide(page)).toBeLessThanOrEqual(0);

  // «Ansehen» opens the Rückblick on this year, with the same numbers as the card
  await card.getByRole('link', { name: T('View|review') }).click();
  await expect(page).toHaveURL(/#\/debrief$/);
  await expect(page.getByRole('group', { name: T('Period') }).getByRole('button', { name: yearKey })).toHaveAttribute('aria-pressed', 'true');
  const yTrips = int(await page.locator('section.period .rv-tile').first().locator('b').textContent());
  expect(cardText).toContain(T('{n} trips', { n: yTrips }));
  const yRain = int(await page.locator('section.period .rv-tile').nth(3).locator('b').textContent());
  expect(cardText).toContain(T('{n} with rain', { n: yRain }));
  expect(errors).toEqual([]);
});
