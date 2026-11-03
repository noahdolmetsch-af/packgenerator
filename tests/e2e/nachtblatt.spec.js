// «Nacht-Blatt» (Noah 02.11.2026 «1b»): opened from the «⋯» menu of the live map, never by itself.
// Made-up sample race, every outside request mocked.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { sheetFull } from './live-sheet.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());

test('Live map: the night sheet opens from the menu and shows verdict, bed, shop, today and the goals', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64') }),
  );
  await context.route(/overpass/, (route) => route.fulfill({ json: { elements: [] } }));
  await context.grantPermissions(['geolocation']);
  await page.goto('./#/race');
  await tap(page.locator('[data-race-sample-open]'), info);
  await expect(page.locator('[data-race-sample]')).toBeVisible();
  // write a goal in Prepare first
  await tap(page.locator('[data-race-tab="prepare"]'), info);
  const v = page.locator('[data-race-tier="vision"]');
  await v.scrollIntoViewIfNeeded();
  await v.fill('test_data_gtp_ Traumtag');
  await v.press('Tab');
  const line = await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const g = req.result.transaction('settings').objectStore('settings').get('races');
          g.onsuccess = () => resolve(g.result?.value?.races?.['race-sample']?.route?.line ?? null);
          g.onerror = () => reject(g.error);
        };
      }),
  );
  const i = Math.floor(line.length * 0.4);
  await context.setGeolocation({ latitude: line[i][0], longitude: line[i][1], accuracy: 6 });
  await page.goto('./#/live/race-sample');
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-full]')).toBeVisible();
  // not by itself
  await expect(page.locator('[data-live-night-sheet]')).toHaveCount(0);
  await tap(page.locator('[data-live-menu]'), info);
  await tap(page.locator('[data-live-night]'), info);
  const sheet = page.locator('[data-live-night-sheet]');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('[data-night-verdict]')).toBeVisible();
  await expect(sheet.locator('[data-night-bed]')).toBeVisible();
  await expect(sheet.locator('[data-night-shop]')).toBeVisible();
  await expect(sheet.locator('[data-night-pauses]')).toBeVisible();
  await expect(sheet.locator('[data-night-goals]')).toContainText('test_data_gtp_ Traumtag');
  // «Wie müde bist du?» is answered right here
  await tap(sheet.locator('[data-night-tired="4"]'), info);
  await expect(sheet.locator('[data-night-tired="4"]')).toHaveAttribute('aria-pressed', 'true');
  // «Warum dieser Vorschlag?» explains the colour
  await tap(sheet.locator('[data-night-why]'), info);
  await expect(sheet.locator('[data-night-why-text]')).toBeVisible();
  // the goals are changed with the pencil
  await sheet.locator('[data-night-goals-edit]').scrollIntoViewIfNeeded();
  await tap(sheet.locator('[data-night-goals-edit]'), info);
  const tier = sheet.locator('[data-night-tier="super"]');
  await tier.fill('test_data_gtp_ Gut');
  await tier.press('Tab');
  await tap(sheet.locator('[data-night-goals-edit]'), info);
  await expect(sheet.locator('[data-night-goals]')).toContainText('test_data_gtp_ Gut');
  await expect(sheet.locator('[data-night-goals]')).toContainText('test_data_gtp_ Traumtag');
});

test('Live map: the night sheet lets you choose a bed, keep an emergency bed and navigate there', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64') }),
  );
  await context.route(/overpass/, (route) => route.fulfill({ json: { elements: [] } }));
  await context.grantPermissions(['geolocation']);
  await page.goto('./#/race');
  await tap(page.locator('[data-race-sample-open]'), info);
  await expect(page.locator('[data-race-sample]')).toBeVisible();
  const line = await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const g = req.result.transaction('settings').objectStore('settings').get('races');
          g.onsuccess = () => resolve(g.result?.value?.races?.['race-sample']?.route?.line ?? null);
          g.onerror = () => reject(g.error);
        };
      }),
  );
  const i = Math.floor(line.length * 0.4);
  await context.setGeolocation({ latitude: line[i][0], longitude: line[i][1], accuracy: 6 });
  await page.goto('./#/live/race-sample');
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-full]')).toBeVisible();
  await tap(page.locator('[data-live-menu]'), info);
  await tap(page.locator('[data-live-night]'), info);
  const sheet = page.locator('[data-live-night-sheet]');
  await expect(sheet).toBeVisible();
  await tap(sheet.locator('[data-night-bed-change]'), info);
  await expect(sheet.locator('[data-night-bed-list]')).toBeVisible();
  const picks = sheet.locator('[data-night-bed-pick]');
  await expect(picks.first()).toBeVisible();
  await tap(picks.first(), info);
  await expect(sheet.locator('[data-night-bed-mine]')).toBeVisible();
  // keep an emergency bed (the list stays open)
  await tap(sheet.locator('[data-night-bed-emergency]').last(), info);
  await expect(sheet.locator('[data-night-emergency]')).toBeVisible();
  // removing the choice goes back to the suggestion
  await tap(sheet.locator('[data-night-bed-clear]'), info);
  await expect(sheet.locator('[data-night-bed-mine]')).toHaveCount(0);
  // navigating from the sheet closes it and opens the detour planner
  await tap(sheet.locator('[data-night-emergency-go]'), info);
  await expect(page.locator('[data-live-night-sheet]')).toHaveCount(0);
});
