// Live Navigation M9/M10 (Noah 26.10.2026): «Fahrt beenden» asks once; «Weiterfahren» keeps riding; «Beenden
// und speichern» keeps the ride at once as its own entry in Touren with the label «Live Navigation», a line
// says so. Free ride with a fake GPS moving north; every outside request is mocked or blocked (openHome).
import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const KM_LAT = 1 / 111.2;

test('End the ride: asks once, saves the ride in Touren with its label', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64') }),
  );
  await context.route(/overpass/, (route) => route.fulfill({ json: { elements: [] } }));
  await context.grantPermissions(['geolocation']);
  const here = { lat: 46.95, lon: 7.45 };
  await context.setGeolocation({ latitude: here.lat, longitude: here.lon, accuracy: 6 });
  await page.goto('./#/live');
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-stop]')).toBeAttached();
  // ride north: a point every 200 m
  for (let i = 1; i <= 6; i++) {
    await context.setGeolocation({ latitude: here.lat + 0.2 * i * KM_LAT, longitude: here.lon, accuracy: 6 });
    await page.waitForTimeout(400);
  }
  await tap(page.locator('[data-live-sheet-toggle]'), info);
  const stop = page.locator('[data-live-stop]');
  await stop.scrollIntoViewIfNeeded();
  // a tap by mistake: «Weiterfahren» keeps riding
  await tap(stop, info);
  const ask = page.locator('[data-live-end-ask]');
  await expect(ask).toBeVisible();
  await expect(ask).toContainText('Live Navigation');
  await page.screenshot({ path: info.outputPath('live-end-ask.png') });
  await tap(page.locator('[data-live-end-no]'), info);
  await expect(ask).toHaveCount(0);
  await expect(page.locator('[data-live-after]')).toHaveCount(0);
  // now for real
  await stop.scrollIntoViewIfNeeded();
  await tap(stop, info);
  await tap(page.locator('[data-live-end-yes]'), info);
  await expect(page.locator('[data-live-after]')).toBeVisible();
  const saved = page.locator('[data-live-saved]');
  await expect(saved).toBeVisible();
  await expect(saved.locator('[data-live-label]')).toHaveText('Live Navigation');
  await saved.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('live-saved.png') });
  // Touren: the ride is its own entry with the label
  // the GPS gives real times while the page clock stands on the fixture day: Touren must see the ride as past
  await page.clock.setFixedTime(new Date(Date.now() + 864e5));
  await tap(page.locator('[data-live-saved-link]'), info);
  await expect(page).toHaveURL(/#\/trips/);
  // on the phone the finished trips sit behind «Mit Packliste»
  if (phone(info)) await tap(page.locator('[data-packmode-open]'), info);
  const label = page.locator('[data-row] [data-live-label]').first();
  await expect(label).toBeVisible({ timeout: 15_000 });
  await label.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('live-touren.png') });
});

// Noah 27.10.2026: «wenn ich eine neue Live-Aufnahme starte, überschreibt es die vorherige». Two rides in a
// row are two entries in Touren.
test('Two rides in a row: both stay in Touren', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64') }),
  );
  await context.route(/overpass/, (route) => route.fulfill({ json: { elements: [] } }));
  await context.grantPermissions(['geolocation']);
  await page.goto('./#/live');
  for (const [n, lat0] of [[1, 46.95], [2, 46.99]]) {
    await context.setGeolocation({ latitude: lat0, longitude: 7.45, accuracy: 6 });
    const startBtn = page.locator('[data-live-start]');
    await startBtn.scrollIntoViewIfNeeded();
    await tap(startBtn, info);
    await expect(page.locator('[data-live-stop]')).toBeAttached();
    for (let i = 1; i <= 5; i++) {
      await context.setGeolocation({ latitude: lat0 + 0.2 * i * KM_LAT, longitude: 7.45, accuracy: 6 });
      await page.waitForTimeout(400);
    }
    await tap(page.locator('[data-live-sheet-toggle]'), info);
    const stop = page.locator('[data-live-stop]');
    await stop.scrollIntoViewIfNeeded();
    await tap(stop, info);
    await tap(page.locator('[data-live-end-yes]'), info);
    await expect(page.locator('[data-live-saved]'), `ride ${n}`).toBeVisible();
  }
  await page.clock.setFixedTime(new Date(Date.now() + 864e5));
  await tap(page.locator('[data-live-saved-link]'), info);
  await expect(page).toHaveURL(/#\/trips/);
  if (phone(info)) await tap(page.locator('[data-packmode-open]'), info);
  await expect(page.locator('[data-row] [data-live-label]')).toHaveCount(2, { timeout: 15_000 });
});
