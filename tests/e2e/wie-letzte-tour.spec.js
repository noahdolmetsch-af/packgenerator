// v0.143.0 WS3 «Wie letzte Tour» (Release-Analyse F5, mockups WS3a/WS3b, Noah 14.10.2026 «1a 2b 3a ws1-ws7
// freigeben», 1a = the last trip ridden with the same bike): Touren has «Schnell starten» again; «Wie letzte
// Tour» opens a new trip that starts as a copy of the last ridden trip of the chosen bike, never a trip planned
// for later; another bike chip switches the copy to that bike's last trip. Phone and computer, in German, no
// sideways scroll, no page errors. Fictional data only (the Gesamttest fixture).
import { test, expect } from '@playwright/test';
import { start, fixture, tr } from './gesamttest/lib.js';

// the rule of src/lib/trips.js (riddenTrips, lastTripOn); that module needs Svelte, so it is restated here
const riddenTrips = (trips, today) => trips.filter((x) => x.startDate && (x.startDate < today || (x.startDate === today && x.finished)) && !x.skipped && !x.idea && x.entries?.length);
const lastTripOn = (bikeId, trips) => [...trips].filter((x) => x.bikeId === bikeId).sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))[0] ?? null;

const T = tr('de');

test('Like the last trip: quick start on Touren and the copy in the new trip window', async ({ page, context }, info) => {
  test.setTimeout(180_000);
  const { data, summary } = fixture();
  const { trips, bikes } = data.tables;
  const ridden = riddenTrips(trips, summary.today);
  const errors = await start(page, context, info);

  await page.goto('./#/trips');
  const quick = page.getByRole('group', { name: T('Start quickly') });
  await expect(quick).toBeVisible();
  await expect(quick.getByRole('link', { name: T('All templates') })).toHaveAttribute('href', '#/pack/templates');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await quick.getByRole('button', { name: T('Like the last trip') }).click();

  const dlg = page.locator('dialog.trip-dlg[open]');
  await expect(dlg).toBeVisible();
  const chips = dlg.getByRole('group', { name: T('Bike') });
  const chosen = (await chips.locator('[aria-pressed="true"]').first().textContent()).trim();
  const bike = bikes.find((b) => b.name === chosen);
  const want = lastTripOn(bike.id, ridden);
  expect(want, 'the fixture has a ridden trip on the preselected bike').toBeTruthy();
  await expect(dlg.locator('.tplhead')).toContainText(T('Like the last trip'));
  await dlg.locator('.tplhead').click();
  const last = dlg.locator('[data-start="last"]');
  await expect(last).toHaveAttribute('aria-pressed', 'true');
  await expect(last).toContainText(want.title);
  // never a trip planned for later
  for (const later of trips.filter((x) => x.bikeId === bike.id && x.startDate >= summary.today && !x.finished)) await expect(last).not.toContainText(later.title);

  // another bike with a ridden trip: the copy follows the bike chips
  const other = bikes.find((b) => b.id !== bike.id && lastTripOn(b.id, ridden));
  if (other) {
    await chips.getByRole('button', { name: other.name, exact: true }).click();
    await expect(last).toContainText(lastTripOn(other.id, ridden).title);
  }
  expect(errors).toEqual([]);
});
