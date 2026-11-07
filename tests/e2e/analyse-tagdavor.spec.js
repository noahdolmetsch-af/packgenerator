// «Cardio-Belastung» Idee F (Noah 07.11.2026 «alle A–F»): the column «Am Tag davor» counts the Fitbit workouts too.
// German, phone + desktop; fictional Fitbit days with one workout; the clock stands on Friday 9 October 2026.
import { test, expect } from './clock.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

test('Cardio load: the day before shows the Fitbit workout of that day', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  const healthDays = [0, 1, 2, 3].map((i) => ({
    date: addDays(TODAY, -i), restingHr: 50, hrZones: { light: 60, mod: 12, vig: 4, peak: 0 }, src: 'google', at: `${addDays(TODAY, -i)}T08:00:00Z`,
    exercises: i === 1 ? [{ type: 'RUNNING', name: 'Morgenlauf', start: '07:00', end: '07:40', min: 40 }] : [],
  }));
  await put(page, { healthDays });
  await page.goto('./#/auswerten/analyse/cardioLoad');
  await page.reload();
  await ready(page);
  const rows = page.locator('[data-detail="cardioLoad"] .days tbody tr');
  // today's row: the day before (yesterday) had the workout; yesterday's row: the day before had none
  await expect(rows.first()).toContainText('Morgenlauf');
  await expect(rows.nth(1)).not.toContainText('Morgenlauf');
  await expect(rows.nth(1)).toContainText('nichts erfasst');
  expect(errors).toEqual([]);
});
