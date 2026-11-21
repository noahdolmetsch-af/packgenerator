// «Rückblick pro Sportart» (Noah 21.11.2026 «ich möchte alle entwürfe 1-3 umsetzen», S4): Auswerten › Sportjahr › one sport.
// Fictional data only; the clock stands on Friday 9 October 2026, 09:00 in Europe/Zurich; German UI, phone + desktop.
// SHOTS=<folder> saves pictures (Handy 390 / Computer 1440).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, addDays, put } from './aktiv-fixture.js';
import { flowSeeded } from './wall-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const SHOTS = process.env.SHOTS || '';

/** Fictional rows: two years of runs from «Strava» and some by hand (tennis without minutes). */
function rows() {
  const activities = [];
  const flowLog = [];
  let n = 0;
  for (const [start, count] of [['2025-01-01', 365], ['2026-01-01', 281]]) {
    for (let i = 0; i < count; i++) {
      const day = addDays(start, i);
      if (day > '2026-10-02') continue;
      if (i % 5 === 1) {
        const id = `fx-u${++n}`;
        const sec = 2400 + (i % 7) * 300;
        activities.push({ id, day, time: '07:00', start: `${day}T05:00:00.000Z`, name: 'Fictional run', type: 'Run', kind: 'run', km: 7 + (i % 6), hm: 60, movingS: sec, hrAvg: 150 });
        flowLog.push({ id: `fl-strava-${id}`, actId: 'run', day, at: `${day}T05:00:00.000Z`, n: 1, min: Math.round(sec / 60), via: 'strava', stravaId: id });
      }
      if (i % 3 === 2) flowLog.push({ id: `fx-t${day}`, actId: 'tennis', day, at: `${day}T18:00:00.000Z`, n: 1 }); // no minutes: «ca.»
    }
  }
  return { activities, flowLog };
}

async function open(page, context, hash) {
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

test('Rückblick: the year of one sport against the year before, where it comes from, best values', async ({ page, context }, info) => {
  const errors = await open(page, context, './#/auswerten/sportjahr/run');
  const pg = page.locator('[data-rueckblick="run"]');
  await expect(pg).toBeVisible();
  await expect(pg.locator('h1')).not.toHaveText('');
  await press(pg.locator('[data-period-bar] [data-key="year"]'), info);
  await expect(pg.locator('[data-sr-hours]')).toContainText(/\d+ h/);
  const units = Number((await pg.locator('[data-sr-units]').innerText()).replace(/\D/g, ''));
  expect(units).toBeGreaterThan(30);
  await expect(pg.locator('[data-sr-totals]')).toContainText(T('Year before'));
  await expect(pg.locator('[data-sr-avg]')).toContainText(/\d:\d\d h/);
  await expect(pg.locator('[data-sr-km]')).toContainText('km');
  await expect(pg.locator('[data-chart="sportrueckblick"] [data-plot]')).toHaveAttribute('data-n', '12');
  await expect(pg.locator('[data-sr-from]')).toContainText(T('Strava'));
  await expect(pg.locator('[data-sr-best]')).toContainText(T('Longest unit'));
  await expect(pg.locator('[data-sr-best]')).toContainText(T('Farthest distance'));
  await shot(page, info, 'rueckblick-jahr');
  expect(errors).toEqual([]);
});

test('Rückblick: a sport without distance has no km, ticks without minutes say «ca.»', async ({ page, context }, info) => {
  const errors = await open(page, context, './#/auswerten/sportjahr/tennis');
  const pg = page.locator('[data-rueckblick="tennis"]');
  await press(pg.locator('[data-period-bar] [data-key="year"]'), info);
  await expect(pg.locator('[data-sr-units]')).toBeVisible();
  await expect(pg.locator('[data-sr-km]')).toHaveCount(0);
  await expect(pg.locator('[data-sr-ca]')).toContainText('ca.');
  expect(errors).toEqual([]);
});

test('Sportjahr leads to the year of a sport, the sport page leads there too', async ({ page, context }, info) => {
  const errors = await open(page, context, './#/auswerten/sportjahr');
  const pg = page.locator('[data-sportjahr]');
  await press(pg.locator('[data-period-bar] [data-key="year"]'), info);
  await press(pg.locator('[data-sj-open="run"]'), info);
  await expect(page).toHaveURL(/#\/auswerten\/sportjahr\/run/);
  await expect(page.locator('[data-rueckblick="run"]')).toBeVisible();
  await page.goto('./#/flow/sport/act:run');
  await ready(page);
  const card = page.locator('[data-sport-year]');
  await expect(card).toBeVisible();
  await press(card.locator('a'), info);
  await expect(page).toHaveURL(/#\/auswerten\/sportjahr\/run/);
  expect(errors).toEqual([]);
});

test('Rückblick: an unknown sport is empty and leads back', async ({ page, context }) => {
  const errors = await open(page, context, './#/auswerten/sportjahr/nothing');
  const pg = page.locator('[data-rueckblick="nothing"]');
  await expect(pg.locator('[data-empty]')).toContainText(T('Nothing in this period'));
  await expect(pg.locator('[data-empty] a')).toHaveAttribute('href', '#/auswerten/sportjahr');
  expect(errors).toEqual([]);
});
