// «Leere Seiten mit Velo-Szenen» (Noah 03.11.2026 «b», Paket D, Idee 19): an empty page shows a small bike scene by its area.
// Fictional data (home0460-fixture), nothing leaves the preview.
import { test, expect } from './clock.js';
import { openHome, homeFixture } from './home0460-fixture.js';

async function emptyTrips(page, context, info) {
  const data = homeFixture();
  data.tables.trips = [];
  data.tables.debriefs = [];
  await openHome(page, context, info, { data });
  await page.goto('./#/trips');
}

test('no trips: the empty page shows the tent under stars', async ({ page, context }, info) => {
  await emptyTrips(page, context, info);
  const pic = page.locator('[data-empty-pic]').first();
  await expect(pic).toBeVisible();
  await expect(pic.locator('svg[data-scene="tent"]')).toHaveCount(1);
  await expect(pic.locator('.ring svg')).toHaveCount(1);
});

test('with reduce motion the scene stands still', async ({ page, context }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await emptyTrips(page, context, info);
  const line = page.locator('[data-empty-pic] svg .draw').first();
  await expect(line).toBeAttached();
  expect(await line.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
});
