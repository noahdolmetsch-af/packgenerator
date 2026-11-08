// «Cardio-Belastung» Idee E (Noah 07.11.2026 «alle A–F»): the highest days of the range are named with what was
// recorded on them (a trip, a workout). German, phone + desktop; fictional Fitbit days, one workout and one trip;
// the clock stands on Friday 9 October 2026.
import { test, expect } from './clock.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

test('Cardio load: the highest days name the trip and the workout', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  const healthDays = Array.from({ length: 30 }, (_, i) => {
    const date = addDays(TODAY, -i);
    const big = i === 5 || i === 12 || i === 20;
    return {
      date, restingHr: 50, hrZones: big ? { light: 90, mod: 60, vig: 40, peak: 20 + i } : { light: 40, mod: 10, vig: 2, peak: 0 }, src: 'google', at: `${date}T08:00:00Z`,
      exercises: i === 5 ? [{ type: 'RUNNING', name: 'Hügellauf', start: '07:00', end: '08:00', min: 60 }] : [],
    };
  });
  const trips = [{ id: 'e2e-hoechste-trip', name: 'Probefahrt Jura', domain: 'bike', status: 'done', startDate: addDays(TODAY, -12), days: 1 }];
  await put(page, { healthDays, trips });
  await page.goto('./#/auswerten/analyse/cardioLoad');
  await page.reload();
  await ready(page);
  const top = page.locator('[data-top-days]');
  await expect(top.getByRole('heading', { level: 2 })).toHaveText('Höchste Tage');
  await expect(top.locator('[data-top-day]')).toHaveCount(3);
  await expect(top.locator(`[data-top-day="${addDays(TODAY, -5)}"]`)).toContainText('Hügellauf');
  await expect(top.locator(`[data-top-day="${addDays(TODAY, -12)}"]`)).toContainText('Probefahrt Jura');
  await expect(top.locator(`[data-top-day="${addDays(TODAY, -20)}"]`)).toContainText('nichts erfasst');
  if (process.env.ANALYSE_SHOTS) await page.screenshot({ path: `qa/analyse/analyse-hoechste-${info.project.name}.png`, fullPage: true });
  // a tap opens that day
  await top.locator(`[data-top-day="${addDays(TODAY, -5)}"]`).click();
  await expect(page.locator('.dayall')).toHaveAttribute('data-day', addDays(TODAY, -5));
  expect(errors).toEqual([]);
});
