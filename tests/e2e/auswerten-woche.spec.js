// «Auswerten neu» Teil 2 (Noah 24.11.2026 «1b 2a 3b 4a 5a», Entwurf B «Wochenbericht»): the tab «Woche» at #/auswerten/woche.
// German, phone + desktop, fictional Fitbit days and Strava rides, the clock on Friday 9 October 2026.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const P = 'test_data_wo_';

function rows() {
  const healthDays = [];
  for (let i = 0; i < 150; i++) {
    const date = addDays(TODAY, -i);
    healthDays.push({ date, azm: 20, restingHr: 50 + (i % 4), hrvMs: 70 + (i % 9), steps: 9000, sleep: { asleepMin: 400 + (i % 6) * 12, deepMin: 70, remMin: 90, lightMin: 230, awakeMin: 25, start: '23:05', end: '06:55', efficiency: 90 }, spo2: 95, breath: 14, kcal: 2300, kcalActive: 600, hrMax: 150, src: 'google', at: `${date}T08:00:00Z` });
  }
  const act = (id, day, kind, type, km, movingS) => ({
    id: `${P}${id}`, day, time: '07:10', start: `${day}T05:10:00Z`, name: `${P}${id}`, type, kind, km, hm: 300, movingS, elapsedS: movingS + 300, gearId: null,
    hrAvg: 140, hrMax: 165, commute: false, trainer: false, wAvg: null, wMax: null, wDevice: false, spdAvg: null, spdMax: null, cad: 84, hist: { 120: movingS / 2, 150: movingS / 2 },
    tempAvg: 8, wNorm: null, kj: null, effort: 70, line: null, workout: null, prs: 0, achv: 0, elevHigh: null, elevLow: null, kcal: Math.round(movingS / 6),
  });
  const activities = [act('a', addDays(TODAY, -1), 'bike', 'Ride', 40, 7200), act('b', addDays(TODAY, -3), 'bike', 'Ride', 25, 4500), act('c', addDays(TODAY, -9), 'bike', 'Ride', 60, 10800), act('d', addDays(TODAY, -2), 'run', 'Run', 8, 2700)];
  return { healthDays, activities };
}

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  await put(page, rows());
  await page.goto(`./${hash}`);
  await page.reload();
  await ready(page);
  return errors;
}

test('Woche: the sentence, the bars, the recovery and the longest units', async ({ page, context }) => {
  const errors = await open(page, context, '#/auswerten/woche');
  await expect(page.locator('[data-page="auswerten-woche"]')).toBeVisible();
  // content first: the period and its sentence stand first
  const rep = page.locator('[data-woche-report]');
  await expect(rep).toBeVisible();
  await expect(rep.locator('[data-woche-hours]')).toContainText('h');
  await expect(rep.locator('[data-woche-before]')).toContainText(T('The period before: {h} h in {n} units ({p}).').split('{h}')[0]);
  await expect(page.locator('[data-woche-chart]')).toBeVisible();
  await expect(page.locator('[data-woche-recovery] [data-value]')).toHaveCount(3);
  await expect(page.locator('[data-woche-recovery] [data-normal-band]').first()).toBeVisible();
  await expect(page.locator('[data-woche-longest] li').first()).toBeVisible();
  const w = page.viewportSize().width;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
  await page.screenshot({ path: `/tmp/claude-0/work/shots/woche-${w}.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test('Woche: the tab is lit and the old pages stay chips beside it', async ({ page, context }) => {
  await open(page, context, '#/auswerten/woche');
  const chips = page.locator('nav.psubs');
  await expect(chips.locator('a[data-sub="woche"]')).toHaveAttribute('aria-current', 'page');
  await expect(chips.locator('a[data-sub="rides"]')).toHaveCount(1);
  await expect(page.locator('[data-page="auswerten-heute"]')).toHaveCount(0);
});

test('Heute: the question «What did I do?» leads to Woche', async ({ page, context }) => {
  await open(page, context, '#/auswerten');
  await page.locator('[data-question="trained"]').click();
  await expect(page.locator('[data-page="auswerten-woche"]')).toBeVisible();
});
