// «Cardio-Belastung» Idee A (Noah 07.11.2026 «alle A–F»): under the course the trips of the range are listed with
// the mean of the value on their days; a finished trip opens its page. German, phone + desktop; fictional Fitbit days
// and seven fictional trips written straight into IndexedDB; the clock stands on Friday 9 October 2026.
import { test, expect } from './clock.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

function rows() {
  const healthDays = [];
  for (let i = 0; i < 100; i++) {
    const date = addDays(TODAY, -i);
    healthDays.push({
      date, restingHr: 50, steps: 7000,
      hrZones: { light: 60 + (i % 5) * 10, mod: 10 + (i % 4) * 5, vig: 5 + (i % 3), peak: i % 7 === 0 ? 4 : 0 },
      src: 'google', at: `${date}T08:00:00Z`,
    });
  }
  const names = ['Alpenrunde Nord', 'Jura Wochenende', 'Seetal Schleife', 'Napf Tagestour', 'Rheinweg', 'Hochland Rundfahrt', 'Abendrunde'];
  const trips = names.map((name, k) => ({ id: `e2e-tl-${k}`, name, domain: 'bike', status: 'done', startDate: addDays(TODAY, -8 - k * 10), days: 2 }));
  // only the newest trip has a saved ride
  const rides = [{ id: 'e2e-tl-r0', date: addDays(TODAY, -8), tripId: 'e2e-tl-0', name: 'Etappe 1' }];
  return { healthDays, trips, rides };
}

test('Cardio load: the trips of the range are listed under the course with their mean', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  await put(page, rows());
  await page.goto('./#/auswerten/analyse/cardioLoad');
  await page.reload();
  await ready(page);
  const list = page.locator('[data-trip-list]');
  await expect(list).toBeVisible();
  await expect(list.getByRole('heading', { level: 2 })).toHaveText('Touren in diesem Zeitraum');
  // seven trips in 3 months: five first, then all
  await expect(list.locator('[data-trip-row]')).toHaveCount(5);
  await list.locator('[data-all-tours]').click();
  await expect(list.locator('[data-trip-row]')).toHaveCount(7);
  // newest first, each with a mean ("Ø …")
  await expect(list.locator('[data-trip-row]').first()).toContainText('Alpenrunde Nord');
  await expect(list.locator('[data-trip-row]').first()).toContainText('Ø');
  if (process.env.ANALYSE_SHOTS) await page.screenshot({ path: `qa/analyse/analyse-tourliste-${info.project.name}.png`, fullPage: true });
  // a second tip «Fahrten ›» only on the trip with a saved ride; it opens the list of rides
  await expect(list.locator('[data-trip-rides]')).toHaveCount(1);
  await expect(list.locator('[data-trip-rides]')).toHaveText('Fahrten ›');
  await expect(list.locator('li', { has: page.locator('[data-trip-rides]') })).toContainText('Alpenrunde Nord');
  await list.locator('[data-trip-rides]').click();
  await expect(page).toHaveURL(/#\/debrief\/ride$/);
  await page.goBack();
  // a finished trip opens its page
  await list.locator('a[data-trip-row]').first().click();
  await expect(page).toHaveURL(/#\/tour\/t%3Ae2e-tl-0$/);
  expect(errors).toEqual([]);
});
