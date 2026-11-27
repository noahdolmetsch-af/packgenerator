// «Haken-Analysen an einem Ort» (Noah 27.11.2026 «1a 2a 3a 4a 5a», Paket A): one period switch, «Tagestotal» and «Wochenpensum» on
// Auswerten › Woche. German, phone + desktop, fictional gym sessions, the clock on Friday 9 October 2026.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

// Friday 9 Oct: this week (from Mon 5 Oct) 45 + 60 + 30 = 135 min; last week (28 Sep to 4 Oct) 60 + 90 + 60 = 210 min, up to Fri 2 Oct 60 min;
// the week before 120 min. Seven training days in the last 90: typical 60 min, longest 120 min.
function sessions() {
  const flowLog = [];
  [[0, 45], [2, 60], [3, 30], [5, 90], [6, 60], [8, 60], [14, 120]].forEach(([back, min]) => flowLog.push({ id: `test_hz_${back}`, actId: 'gym', day: addDays(TODAY, -back), at: `${addDays(TODAY, -back)}T18:00:00+02:00`, min, n: 1 }));
  return { flowLog };
}

async function open(page, context, rows) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  if (rows) await put(page, rows);
  await page.goto('./#/auswerten/woche');
  await page.reload();
  await ready(page);
  return errors;
}

test('Haken-Analysen: one switch on top, then the cards, Tagestotal against the typical day', async ({ page, context }) => {
  const errors = await open(page, context, sessions());
  const sw = page.locator('[data-haken-zeitraum]');
  await expect(sw).toBeVisible();
  await expect(sw.getByRole('heading', { name: T('Period for everything here') })).toBeVisible();
  // the order: switch, tick history, day total, week volume, hints
  const order = await page.evaluate(() => ['[data-haken-zeitraum]', '[data-haken-verlauf]', '[data-tagestotal]', '[data-wochenpensum]', '[data-haken-hinweise]'].map((s) => document.querySelector(s)).map((e, i, a) => (i ? !!(a[i - 1].compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING) : !!e)));
  expect(order.every(Boolean)).toBe(true);
  const card = page.locator('[data-tagestotal]');
  await expect(card.getByRole('heading', { name: T('Day total') })).toBeVisible();
  await expect(card.locator('[data-plot]')).toHaveAttribute('data-n', '10');
  const sentence = card.locator('[data-tt-sentence]');
  await expect(sentence).toContainText('Heute bisher 45 Min');
  await expect(sentence).toContainText('hat 60 Min');
  await expect(sentence).toContainText('120 Min');
  const w = page.viewportSize().width;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
  expect(errors).toEqual([]);
});

test('Haken-Analysen: Wochenpensum shows this week, last week at the same point and the whole last week', async ({ page, context }) => {
  const errors = await open(page, context, sessions());
  const card = page.locator('[data-wochenpensum]');
  await expect(card.getByRole('heading', { name: T('Week volume') })).toBeVisible();
  await expect(card.locator('[data-plot]')).toHaveAttribute('data-n', '12');
  await expect(card.locator('[data-wp-cur]')).toHaveText(/^2[.,]3 h$/); // 135 min
  await expect(card.locator('[data-wp-prev]')).toHaveText(/^3[.,]5 h$/); // 210 min
  await expect(card.locator('[data-wp-kpis]')).toContainText('+75 %'); // 210 against 120
  await expect(card.locator('[data-wp-sentence]')).toContainText('+125 %'); // 135 against 60 at the same point
  expect(errors).toEqual([]);
});

test('Haken-Analysen: the switch drives every card, the days stop at 90, and the choice stays', async ({ page, context }) => {
  const errors = await open(page, context, sessions());
  const chip = (name) => page.locator('[data-haken-zeitraum]').getByRole('radio', { name });
  await chip(T('30 days|hv')).click();
  await expect(page.locator('[data-haken-verlauf] [data-hv-grid]')).toHaveAttribute('data-hv-span-days', '30');
  await expect(page.locator('[data-tagestotal] [data-plot]')).toHaveAttribute('data-n', '30');
  await expect(page.locator('[data-wochenpensum] [data-plot]')).toHaveAttribute('data-n', '12');
  await chip(T('Year|hv')).click();
  await expect(page.locator('[data-haken-verlauf] [data-hv-grid]')).toHaveAttribute('data-hv-span-days', '365');
  await expect(page.locator('[data-tagestotal] [data-plot]')).toHaveAttribute('data-n', '90'); // a year of days is too thin to read
  await expect(page.locator('[data-tagestotal]')).toContainText(T('Minutes of movement per day, all activities together. The last 90 days; weeks are in «Week volume».'));
  await expect(page.locator('[data-wochenpensum] [data-plot]')).toHaveAttribute('data-n', '52');
  const w = page.viewportSize().width;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-wochenpensum] [data-plot]')).toHaveAttribute('data-n', '52');
  expect(errors).toEqual([]);
});

test('Haken-Analysen: without any movement both cards say so and point to Aktiv', async ({ page, context }) => {
  const errors = await open(page, context, null);
  await expect(page.locator('[data-tt-none]')).toBeVisible();
  await expect(page.locator('[data-wp-none]')).toBeVisible();
  await expect(page.locator('[data-tagestotal] [data-plot]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

// «Was Bewegung mit dir macht» (Paket B): 28 weeks of fictional Fitbit days, the resting pulse of a week is lower after a week with more active zone minutes.
function health() {
  const monday = '2026-10-05';
  const healthDays = [];
  const azmOf = (j) => (((j * 3) % 5) + 1) * 15;
  for (let j = 0; j < 28; j++) {
    const start = addDays(monday, -7 * (28 - j));
    for (let i = 0; i < 7; i++) healthDays.push({ date: addDays(start, i), restingHr: 62 - (j ? azmOf(j - 1) / 15 : 3), azm: azmOf(j), hrvMs: 40 + (j ? azmOf(j - 1) / 15 : 3), src: 'file' });
  }
  return { healthDays };
}

test('Haken-Analysen: health card sets the active zone minutes against the resting pulse and says it is a pattern', async ({ page, context }) => {
  const errors = await open(page, context, { ...sessions(), ...health() });
  const card = page.locator('[data-gesundheit]');
  await expect(card.getByRole('heading', { name: T('What movement does for you'), level: 2 })).toBeVisible();
  await expect(card.locator('[data-chart="gesundheit-azm"] [data-plot]')).toHaveAttribute('data-n', '12');
  await expect(card.locator('[data-chart="gesundheit-line"] [data-plot]')).toHaveAttribute('data-n', '12');
  const s = card.locator('[data-gk-sentence]');
  await expect(s).toContainText('Ruhepuls');
  await expect(s).toContainText('tiefer');
  await expect(s).toContainText(T('A pattern, not a cause.'));
  // HRV is set against it too, and the line changes with the chip
  await card.getByRole('radio', { name: 'HRV' }).click();
  await expect(card.locator('[data-gk-sentence]')).toContainText('HRV');
  await expect(card.locator('[data-gk-sentence]')).toContainText('höher');
  await page.locator('[data-haken-zeitraum]').getByRole('radio', { name: T('Year|hv') }).click();
  await expect(card.locator('[data-chart="gesundheit-azm"] [data-plot]')).toHaveAttribute('data-n', '52');
  const w = page.viewportSize().width;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
  expect(errors).toEqual([]);
});

test('Haken-Analysen: without Fitbit days the health card says where they come from', async ({ page, context }) => {
  const errors = await open(page, context, sessions());
  await expect(page.locator('[data-gk-none]')).toBeVisible();
  await expect(page.locator('[data-gesundheit] [data-plot]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Haken-Analysen: Garmin against Fitbit lists the sessions both recorded, the Garmin pulse first', async ({ page, context }) => {
  const rows = health();
  const day = (back) => addDays(TODAY, -back);
  const ex = (hr) => [{ type: 'OUTDOOR_BIKE', name: 'Radfahren im Freien', start: '18:05', end: '19:00', min: 55, hr }];
  const garmin = (back, hr) => ({ id: `test_hp_${back}`, day: day(back), time: '18:00', start: `${day(back)}T16:00:00Z`, name: `Abendrunde ${back}`, type: 'Ride', kind: 'bike', km: 30, movingS: 3300, elapsedS: 3600, hrAvg: hr, device: 'Garmin Edge 1040' });
  // four rides, the Fitbit shows 10 beats less on each; the Fitbit days exist already from health(), the workouts are added to them
  const backs = [6, 8, 10, 12]; // days inside the seeded Fitbit weeks (they end on Sunday 4 October)
  rows.healthDays = rows.healthDays.map((h) => (backs.some((b) => h.date === day(b)) ? { ...h, exercises: ex(130) } : h));
  rows.activities = backs.map((b) => garmin(b, 140));
  const errors = await open(page, context, rows);
  const card = page.locator('[data-gesundheit]');
  const box = card.locator('[data-gk-pulse]');
  await expect(box).toBeVisible();
  await expect(box.getByRole('heading', { name: T('Garmin against Fitbit') })).toBeVisible();
  await expect(box.locator('[data-gk-pulse-sentence]')).toContainText('10');
  await expect(box.locator('[data-gk-pulse-sentence]')).toContainText('weniger');
  await expect(box.locator('[data-gk-pairs] li:not(.ph)')).toHaveCount(4);
  await expect(box.locator('[data-gk-pairs] li:not(.ph)').first()).toContainText('140');
  const w = page.viewportSize().width;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
  expect(errors).toEqual([]);
});

test('Haken-Analysen: no block for Garmin against Fitbit without double recordings', async ({ page, context }) => {
  const errors = await open(page, context, { ...sessions(), ...health() });
  await expect(page.locator('[data-gesundheit]')).toBeVisible();
  await expect(page.locator('[data-gk-pulse]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
