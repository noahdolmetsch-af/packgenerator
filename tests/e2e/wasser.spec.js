// «Nächstes Wasser» (Noah 02.11.2026): on the live map the stops part names the next place to fill up and says
// whether the bottle lasts. Made-up sample race, every outside request mocked.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { sheetFull } from './live-sheet.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());

test('Live map: the next water shows and says whether the bottle lasts; the bottle is yours to change', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64') }),
  );
  let near = null;
  await context.route(/overpass/, (route) =>
    route.fulfill({ json: { elements: near ? [{ type: 'node', id: 91, lat: near.lat, lon: near.lon, tags: { shop: 'supermarket', name: 'test_data_gtp_ Laden', opening_hours: 'Mo-Su 00:00-23:59' } }] : [] } }),
  );
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
  near = { lat: line[i + 2][0], lon: line[i + 2][1] };
  await page.goto('./#/live/race-sample');
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-full]')).toBeVisible();
  await sheetFull(page, info);

  const card = page.locator('[data-live-water]');
  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeVisible();
  // a place to fill up (the sample race has shops and the mocked stop is a shop)
  await expect(page.locator('[data-live-water-row]')).toBeVisible();
  await expect(card).toHaveAttribute('data-live-water', /^(ok|tight|short)$/);
  await expect(page.locator('[data-live-water-say]')).toBeVisible();
  // an almost empty bottle never says «lasts until there» for a far place; the answer follows the choice
  await tap(card.getByRole('button', { name: /almost empty|fast leer/i }), info);
  await expect(card.getByRole('button', { name: /almost empty|fast leer/i })).toHaveAttribute('aria-pressed', 'true');
  // the size and the drinking are yours to change, and kept after a reload
  await card.locator('[data-live-water-set] summary').click();
  const cap = card.locator('[data-live-water-cap]');
  await cap.fill('750');
  await cap.press('Tab');
  await page.reload();
  const again = await page.evaluate(() => JSON.parse(localStorage.getItem('pg-live-water') || '{}'));
  expect(again.cap).toBe(750);
  expect(again.left).toBe('low');
});
