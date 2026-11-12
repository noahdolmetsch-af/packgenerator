// Schlafplatz finden, Schritt 1 (Noah 28.10.2026): on the live map «⋯ › Schlafplatz finden»: the roofs around
// you (mocked Overpass), your own place saved, renamed, deleted with Undo, «Hingehen» opens the detour window.
// Made-up places only; every outside request is mocked or blocked (openHome).
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

test('Schlafplatz finden: roofs around you, own place, Hingehen', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  const asked = [];
  await context.route(/overpass/, (route) => {
    const body = route.request().postData() ?? '';
    if (/wilderness_hut/.test(decodeURIComponent(body)) && /shelter/.test(decodeURIComponent(body)) && !/supermarket/.test(decodeURIComponent(body))) {
      asked.push(body);
      return route.fulfill({
        json: {
          elements: [
            { type: 'node', id: 11, lat: 46.955, lon: 7.45, tags: { amenity: 'shelter', name: 'test_data_gtp_ Unterstand' } },
            { type: 'node', id: 12, lat: 46.96, lon: 7.46, tags: { tourism: 'wilderness_hut', name: 'test_data_gtp_ Biwak' } },
            { type: 'node', id: 13, lat: 46.95, lon: 7.47, tags: { highway: 'bus_stop', shelter: 'yes', name: 'test_data_gtp_ Haltestelle' } },
          ],
        },
      });
    }
    return route.fulfill({ json: { elements: [] } });
  });
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 46.95, longitude: 7.45, accuracy: 10 });
  await page.goto('./#/live');
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-full]')).toBeVisible();
  await tap(page.locator('[data-live-menu]'), info);
  await tap(page.locator('[data-live-menu-panel] [data-live-sleep-open]'), info);
  const sheet = page.locator('[data-live-sleep-sheet]');
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText('Schlafplatz finden');
  // nothing is asked until the tap
  expect(asked).toHaveLength(0);
  await expect(sheet.locator('[data-live-sleep-spot]')).toHaveCount(0);
  await tap(sheet.locator('[data-live-sleep-search]'), info);
  await expect(sheet.locator('[data-live-sleep-spot="osm"]')).toHaveCount(3);
  expect(asked).toHaveLength(1);
  // the nearest first
  await expect(sheet.locator('[data-live-sleep-spot]').first()).toContainText('test_data_gtp_ Unterstand');
  // a chip hides a kind
  await tap(sheet.locator('[data-live-sleep-kind="bus"]'), info);
  await expect(sheet.locator('[data-live-sleep-spot="osm"]')).toHaveCount(2);
  await tap(sheet.locator('[data-live-sleep-kind="bus"]'), info);
  await expect(sheet.locator('[data-live-sleep-spot="osm"]')).toHaveCount(3);
  await page.screenshot({ path: info.outputPath('schlafplatz-liste.png') });

  // own place: save, rename, delete, Undo
  await sheet.locator('[data-live-sleep-name]').fill('test_data_gtp_ Wiese');
  await tap(sheet.locator('[data-live-sleep-save]'), info);
  const mine = sheet.locator('[data-live-sleep-spot="own"]');
  await expect(mine).toHaveCount(1);
  await expect(mine).toContainText('test_data_gtp_ Wiese');
  await tap(mine.locator('[data-live-sleep-rename]'), info);
  await mine.locator('[data-live-sleep-rename-input]').fill('test_data_gtp_ Waldrand');
  await tap(mine.locator('[data-live-sleep-rename-keep]'), info);
  await expect(mine).toContainText('test_data_gtp_ Waldrand');
  await page.screenshot({ path: info.outputPath('schlafplatz-eigen.png') });
  await tap(mine.locator('[data-live-sleep-delete]'), info);
  await expect(mine).toHaveCount(0);
  const undo = page.locator('[role=status]', { hasText: 'gelöscht' }).locator('button.undo');
  await tap(undo, info);
  await expect(sheet.locator('[data-live-sleep-spot="own"]')).toHaveCount(1);

  // «Hingehen» opens the detour window with this place
  await tap(sheet.locator('[data-live-sleep-spot="osm"]').first().locator('[data-live-sleep-go]'), info);
  await expect(sheet).toBeHidden();
  await expect(page.locator('[data-reroute-sheet]')).toBeVisible();
  await expect(page.locator('[data-reroute-sheet]')).toContainText(/\d/);
});
