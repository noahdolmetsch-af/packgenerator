// «Licht» (Noah 02.11.2026): on the live map the stops part says whether the bike lamp lasts through the dark. Made-up sample race, every outside request mocked.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { sheetFull } from './live-sheet.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());

test('Live map: the light card says whether the lamp lasts; the lamp is yours to change', async ({ page, context }, info) => {
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
  await sheetFull(page, info);

  const card = page.locator('[data-live-lamp]');
  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute('data-live-lamp', /^(day|ok|tight|short)$/);
  await expect(page.locator('[data-live-lamp-say]')).toBeVisible();
  // the sample ride is long: an almost empty lamp never lasts, and the answer follows the choice
  await tap(card.getByRole('button', { name: /almost empty|fast leer/i }), info);
  await expect(card.getByRole('button', { name: /almost empty|fast leer/i })).toHaveAttribute('aria-pressed', 'true');
  // the burn time is yours to change, and kept after a reload
  await card.locator('[data-live-lamp-set] summary').click();
  const burn = card.locator('[data-live-lamp-burn]');
  await burn.fill('6');
  await burn.press('Tab');
  const again = await page.evaluate(() => JSON.parse(localStorage.getItem('pg-live-lamp') || '{}'));
  expect(again.burn).toBe(6);
  expect(again.left).toBe('low');
});
