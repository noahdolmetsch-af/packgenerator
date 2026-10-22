// «Aktiv neu» (Noah 20.10.2026 «1a 2a 3a 4b 5b»), German, phone + desktop, fictional Fitbit days and
// Strava activities written into the app's IndexedDB, the clock on Friday 9 October 2026.
// 1. Aktiv: small tiles (no second line), «Deine Woche in Zahlen» with six values, a tap shows 12 weeks;
//    «Was zeigen die Ringe?» and «Wi gaht's?» explain themselves.
// 2. Verlauf: one card per day with the Fitbit values and the activities as whole rows (time, km, pulse,
//    power) that open the activity; no weight card, no «Wer diesen Verlauf liest».
// 3. Auswertung: «Deine Messwerte» with sleep, resting pulse, HRV, steps, minutes, pulse and power.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';
import { openOverview } from './ov-fold.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const P = 'test_data_an_';

function rows() {
  const healthDays = [];
  for (let i = 0; i < 40; i++) {
    const date = addDays(TODAY, -i);
    healthDays.push({ date, azm: 20 + (i % 5) * 5, restingHr: 52 + (i % 3), hrvMs: 40 + (i % 4), steps: 8000 + i * 10, sleep: { asleepMin: 400 + (i % 6) * 5 }, src: 'google', at: `${date}T08:00:00Z` });
  }
  const act = (id, day, kind, type, km, hm, movingS, hrAvg, wAvg) => ({
    id, day, time: '07:10', start: `${day}T05:10:00Z`, name: `${P}${id}`, type, kind, km, hm, movingS, elapsedS: movingS + 300, gearId: null,
    hrAvg, hrMax: hrAvg + 25, commute: false, trainer: false, wAvg, wMax: wAvg ? wAvg * 3 : null, wDevice: !!wAvg, spdAvg: null, spdMax: null, cad: null,
    tempAvg: null, wNorm: null, kj: null, effort: null, line: null, workout: null, prs: 0, achv: 0, elevHigh: null, elevLow: null,
  });
  const activities = [
    act('gravel1', TODAY, 'bike', 'GravelRide', 21, 250, 3900, 138, 185),
    act('run1', addDays(TODAY, -2), 'run', 'Run', 8, 90, 2700, 150, null),
    act('gravel2', addDays(TODAY, -15), 'bike', 'GravelRide', 40, 600, 7200, 135, 180),
  ];
  return { healthDays, activities };
}

async function open(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  await put(page, rows());
  return errors;
}
async function go(page, hash) {
  await page.goto(`./${hash}`);
  await page.reload();
  await ready(page);
}
async function fits(page, where) {
  const w = page.viewportSize().width;
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, `${where}: no sideways scroll`).toBeLessThanOrEqual(w);
}

test('Aktiv: small tiles, the week in numbers, the rings and «Wi gaht\'s?» explained', async ({ page, context }) => {
  const errors = await open(page, context);
  await go(page, '#/flow');
  const tick = page.locator('section[aria-labelledby="tick-h"]');
  await expect(tick.locator('.tg.compact')).toBeVisible();
  const tile = tick.locator('[data-act="run"]');
  expect((await tile.boundingBox()).height).toBeLessThan(60);

  // «Aktiv neu» (Noah 22.10.2026): the rings stay in Aktiv; «Überblick», «Letzte 7 Tage» and «Wi gaht's?» are on the start of Auswerten
  await page.locator('[data-ring-help] summary').click();
  await expect(page.locator('[data-ring-help]')).toContainText(T('What counts for what?'));
  await expect(page.locator('[data-ring-help] a[href="#/flow/sports"]')).toBeVisible();
  await fits(page, '#/flow');

  await go(page, '#/auswerten');
  await openOverview(page);
  const wn = page.locator('[data-section="week-numbers"]');
  await expect(wn.locator('[data-wn]')).toHaveCount(6);
  // Garmin-Übersicht (20.10.2026, changed on purpose): the week in numbers sits under «Letzte 7 Tage»
  await expect(page.getByRole('heading', { name: T('Last 7 days'), exact: true })).toBeVisible();
  // 21 km gravel today + 8 km run two days ago
  await expect(wn.locator('[data-wn="km"]')).toContainText('29');
  await expect(wn.locator('[data-wn="sleep"]')).toContainText(' h ');
  await wn.locator('[data-wn="rhr"]').click();
  await expect(wn.locator('[data-wn-detail="rhr"] .bar')).toHaveCount(12);
  await expect(wn.locator('[data-wn-detail="rhr"]')).toContainText(T('Source: Fitbit.'));

  await expect(page.locator('[data-check-why]')).toContainText(T('Where you see it'));
  await expect(page.locator('[data-check-why] a[href="#/me/history"]')).toBeVisible();
  await fits(page, '#/auswerten');
  expect(errors).toEqual([]);
});

test('Verlauf: a diary with Fitbit and whole activity rows; Auswertung with the measured values', async ({ page, context }) => {
  const errors = await open(page, context);
  await go(page, '#/me/history');
  const day = page.locator(`[data-day="${TODAY}"]`);
  await expect(day.locator(`[data-fit="${TODAY}"] [data-fit-k="rhr"]`)).toContainText('52');
  await expect(day.locator(`[data-fit="${TODAY}"] [data-fit-k="sleep"]`)).toContainText('6 h 40');
  const row = day.locator('[data-act-link="gravel1"]');
  await expect(row).toContainText(`${P}gravel1`);
  await expect(row).toContainText('21 km');
  await expect(row).toContainText('138');
  await expect(row).toContainText('185 W');
  await expect(page.getByText(T('Who reads this history'))).toHaveCount(0);
  await expect(page.getByRole('heading', { name: T('Weight') })).toHaveCount(0);
  await fits(page, '#/me/history');
  await row.click();
  await expect(page).toHaveURL(/#\/flow\/training\/a\/gravel1$/);

  await go(page, '#/me/analysis');
  const mw = page.locator('[data-section="messwerte"]');
  for (const k of ['sleep', 'rhr', 'hrv', 'steps', 'azm', 'hr', 'watt']) await expect(mw.locator(`[data-mw="${k}"]`)).toBeVisible();
  await expect(mw.locator('[data-mw="watt"]')).toContainText('W');
  await fits(page, '#/me/analysis');
  expect(errors).toEqual([]);
});
