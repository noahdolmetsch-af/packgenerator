// «Sportjahr» (Noah 21.11.2026 «1 a dann b», S3): Auswerten › Sportjahr reads Strava and ticks together, in hours.
// Fictional data only; the clock stands on Friday 9 October 2026, 09:00 in Europe/Zurich; German UI, phone + desktop.
// SHOTS=<folder> saves pictures (Handy 390 / Computer 1440).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, addDays } from './aktiv-fixture.js';
import { flowSeeded } from './wall-fixture.js';
import { put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const SHOTS = process.env.SHOTS || '';

/** Fictional rows: two years of rides and runs from «Strava», hikes with no activity, hand ticks without minutes. */
function rows() {
  const activities = [];
  const flowLog = [];
  let n = 0;
  const days = (from, count) => Array.from({ length: count }, (_, i) => addDays(from, i));
  for (const [start, count, k] of [['2025-01-01', 365, 1], ['2026-01-01', 281, 1]]) {
    for (const [i, day] of days(start, count).entries()) {
      if (day > '2026-10-02') continue; // the week of 9 October stays empty (the empty state)
      const month = Number(day.slice(5, 7));
      if (i % 3 === 0) {
        const id = `fx-r${++n}`;
        const mov = (month >= 5 && month <= 9 ? 7200 : 3600) * k;
        activities.push({ id, day, time: '17:00', start: `${day}T15:00:00.000Z`, name: 'Fictional ride', type: 'Ride', kind: 'ride', km: mov / 180, hm: 400, movingS: mov, hrAvg: 138 });
        flowLog.push({ id: `fl-strava-${id}`, actId: 'bike', day, at: `${day}T15:00:00.000Z`, n: 1, min: Math.round(mov / 60), via: 'strava', stravaId: id });
      }
      if (i % 5 === 1) {
        const id = `fx-u${++n}`;
        activities.push({ id, day, time: '07:00', start: `${day}T05:00:00.000Z`, name: 'Fictional run', type: 'Run', kind: 'run', km: 8, hm: 60, movingS: 2700, hrAvg: 150 });
        flowLog.push({ id: `fl-strava-${id}`, actId: 'run', day, at: `${day}T05:00:00.000Z`, n: 1, min: 45, via: 'strava', stravaId: id });
      }
      if (i % 11 === 4) flowLog.push({ id: `fx-t${day}`, actId: 'tennis', day, at: `${day}T18:00:00.000Z`, n: 1 }); // no minutes: «ca.»
      if (i % 30 === 9) {
        const id = `fx-h${++n}`;
        activities.push({ id, day, time: '09:00', start: `${day}T07:00:00.000Z`, name: 'Fictional hike', type: 'Hike', kind: 'other', km: 12, hm: 700, movingS: 14400, hrAvg: 120 }); // no activity «Wandern» in the seed
      }
    }
  }
  return { activities, flowLog };
}

async function open(page, context, hash = './#/auswerten/sportjahr') {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  await page.goto(hash);
  await ready(page);
  await flowSeeded(page);
  await put(page, rows());
  await page.reload();
  await ready(page);
  return errors;
}
async function shot(page, info, name) {
  if (!SHOTS) return;
  const w = info.project.name === 'phone' ? 390 : 1440;
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo(0, 0));
  const vp = page.viewportSize();
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: vp.width, height: Math.max(vp.height, h) });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOTS}/${name}-${w}.png`, fullPage: true });
  await page.setViewportSize(vp);
}
const press = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());

test('Sportjahr: the year in hours, the chart with the year before, where the time went, records', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const pg = page.locator('[data-sportjahr]');
  await expect(pg).toBeVisible();
  await expect(pg.locator('h1')).toHaveText(T('Sports year'));
  await press(pg.locator('[data-period-bar] [data-key="year"]'), info);
  await expect(pg.locator('[data-sj-totals]')).toBeVisible();
  await expect(pg.locator('[data-sj-hours]')).toContainText(/\d+ h/);
  const units = Number((await pg.locator('[data-sj-units]').innerText()).replace(/\D/g, ''));
  expect(units).toBeGreaterThan(100);
  await expect(pg.locator('[data-sj-sports]')).toHaveText('4'); // Velo, Laufen, Tennis spielen and Strava «Hike»
  // the tennis ticks have no minutes: «ca.» with the way to the setting
  await expect(pg.locator('[data-sj-ca]')).toContainText('ca.');
  await expect(pg.locator('[data-sj-ca] a')).toHaveAttribute('href', '#/flow/sports');
  // twelve months and the year before as a line
  await expect(pg.locator('[data-chart="sportjahr"] [data-plot]')).toHaveAttribute('data-n', '12');
  await expect(pg.locator('[data-sj-legend]')).toContainText(T('Year before'));
  // where the time went
  await expect(pg.locator('[data-sj-sport]')).toHaveCount(4);
  await expect(pg.locator('[data-sj-sport="bike"]')).toContainText('h');
  await press(pg.locator('[data-sj-where] [data-key="km"]'), info);
  await expect(pg.locator('[data-sj-sport="tennis"]')).toHaveCount(0); // no distance
  await expect(pg.locator('[data-sj-sport="bike"]')).toContainText('km');
  await press(pg.locator('[data-sj-where] [data-key="hours"]'), info);
  await expect(pg.locator('[data-sj-records]')).toContainText(T('Longest week'));
  await expect(pg.locator('[data-sj-weeks]')).toBeVisible();
  // S5: the analyses of the old ticks page (weekdays, hours, grid, best values, months) read all units here
  await expect(pg.locator('[data-section="analyses"]')).toBeVisible();
  await expect(pg.locator('[data-section="analyses"]')).toContainText(T('Analyses'));
  // a tap on a bar opens the sports of that month
  await pg.locator('[data-chart="sportjahr"] [data-plot]').click({ position: { x: 5, y: 60 } });
  await expect(page.locator('[data-sj-sheet]')).toBeVisible();
  await expect(page.locator('[data-sj-sheet]')).toContainText(/\d h( \d+ min)?|\d+ min/); // exact time, not a rounded hour
  await page.keyboard.press('Escape');
  // «no data instead of 0»: the chart starts on a month with data, a month to come says so
  await expect(pg.locator('[data-chart="sportjahr"] [data-readout]')).not.toContainText('2026 Stunden 0');
  await pg.locator('[data-chart="sportjahr"] [data-plot]').focus();
  await page.keyboard.press('End');
  await expect(pg.locator('[data-chart="sportjahr"] [data-readout-note]')).toHaveText(T('Not yet'));
  await shot(page, info, 'sportjahr-jahr');
  expect(errors).toEqual([]);
});

test('Sportjahr: Everything shows one bar per year, an empty week says so and leads to Aktiv', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const pg = page.locator('[data-sportjahr]');
  await expect(pg.locator('[data-empty]')).toContainText(T('Nothing in this period')); // week of 9 October: nothing in the fixture
  await expect(pg.locator('[data-empty] a')).toHaveAttribute('href', '#/flow');
  await press(pg.locator('[data-period-bar] [data-key="all"]'), info);
  await expect(pg.locator('[data-chart="sportjahr"] [data-plot]')).toHaveAttribute('data-n', '2');
  await expect(pg.locator('[data-sj-weeks]')).toHaveCount(0);
  await shot(page, info, 'sportjahr-alles');
  await press(pg.locator('[data-period-bar] [data-key="month"]'), info);
  await expect(pg.locator('[data-chart="sportjahr"] [data-plot]')).toHaveAttribute('data-n', '9');
  expect(errors).toEqual([]);
});

test('Auswerten leads to Sportjahr with one quiet line', async ({ page, context }, info) => {
  const errors = await open(page, context, './#/auswerten');
  await press(page.locator('[data-sportjahr-link]'), info);
  await expect(page).toHaveURL(/#\/auswerten\/sportjahr/);
  await expect(page.locator('[data-sportjahr] h1')).toHaveText(T('Sports year'));
  expect(errors).toEqual([]);
});

test('Sportjahr: the hours goal shows as a line, in a year you pick it against the year before; a passed goal day says so quietly', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const pg = page.locator('[data-sportjahr]');
  await put(page, { settings: [{ key: 'training.goal', value: { name: 'Fictional alps crossing', hours: 6, until: '2027-01-04' } }] });
  await page.reload();
  await ready(page);
  await press(pg.locator('[data-period-bar] [data-key="year"]'), info);
  await expect(pg.locator('[data-sj-goal]')).toContainText('6');
  await expect(pg.locator('[data-sj-goal]')).toContainText(T('Change the goal'));
  await press(pg.locator('[data-sj-chart] .seg [data-key="goal"]'), info);
  await expect(pg.locator('[data-sj-chart]')).toContainText('6');
  await expect(pg.locator('[data-sj-legend]')).toContainText(T('Goal|sj'));
  await shot(page, info, 'sportjahr-ziel');
  // the goal day is over: a quiet sentence, no line
  await put(page, { settings: [{ key: 'training.goal', value: { name: 'Fictional alps crossing', hours: 6, until: '2026-10-01' } }] });
  await page.reload();
  await ready(page);
  await press(pg.locator('[data-period-bar] [data-key="year"]'), info);
  await expect(pg.locator('[data-sj-goal]')).toContainText(T('Set a new goal'));
  await expect(pg.locator('[data-sj-legend]')).not.toContainText(T('Goal|sj'));
  await shot(page, info, 'sportjahr-ziel-vorbei');
  expect(errors).toEqual([]);
});

test('Sportjahr: Everything puts the years side by side and the sports of summer and winter', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const pg = page.locator('[data-sportjahr]');
  await press(pg.locator('[data-period-bar] [data-key="all"]'), info);
  await expect(pg.locator('[data-sj-years] [data-sj-year]')).toHaveCount(2);
  await expect(pg.locator('[data-sj-year="2026"]')).toContainText(T('best week {w} h · best month {m} h').split('{w}')[0].trim());
  await expect(pg.locator('[data-sj-year="2026"]')).toContainText(/\d+ h/);
  await expect(pg.locator('[data-sj-season-of="summer"] li').first()).toContainText(/\d+ h/);
  await expect(pg.locator('[data-sj-season-of="winter"]')).toBeVisible();
  await shot(page, info, 'sportjahr-jahre');
  // a single year has no side by side
  await press(pg.locator('[data-period-bar] [data-key="year"]'), info);
  await expect(pg.locator('[data-sj-years]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
