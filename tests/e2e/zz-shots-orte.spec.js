import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';
const OUT = '/mnt/project-files/design/navigation-unterwegs/pr2/';
const HERE = { lat: 46.95, lon: 7.45 };
const PLACES = [
  { type: 'node', id: 1, lat: 46.9512, lon: 7.4505, tags: { amenity: 'drinking_water', name: 'Brunnen Nord' } },
  { type: 'node', id: 2, lat: 46.952, lon: 7.452, tags: { amenity: 'toilets', name: 'WC Bahnhof', fee: 'no', opening_hours: '24/7' } },
  { type: 'node', id: 3, lat: 46.954, lon: 7.455, tags: { amenity: 'toilets', name: 'WC Park', fee: 'yes' } },
  { type: 'node', id: 4, lat: 46.9535, lon: 7.4478, tags: { amenity: 'fountain', drinking_water: 'yes', name: 'Dorfbrunnen' } },
];
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const tap = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());
test('shots', async ({ page, context }, info) => {
  const w = info.project.name === 'phone' ? '390' : '1440';
  await openHome(page, context, info);
  const st = { busy: true };
  await context.route(/overpass/, (r) => (st.busy ? r.fulfill({ status: 504, body: 'busy' }) : r.fulfill({ json: { elements: PLACES } })));
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (r) => r.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: HERE.lat, longitude: HERE.lon, accuracy: 10 });
  await page.setViewportSize({ width: Number(w), height: 2600 });
  await page.goto('./#/live');
  await tap(page.locator('[data-live-start]'), info);
  const panel = page.locator('[data-poi-panel]');
  await panel.scrollIntoViewIfNeeded();
  await tap(panel.locator('[data-poi-quick-btn="water"]'), info);
  await expect(panel.locator('[data-poi-smaller]')).toBeVisible({ timeout: 30000 });
  await panel.screenshot({ path: `${OUT}busy-${w}.png` });
  st.busy = false;
  await tap(panel.locator('[data-poi-retry]'), info);
  await expect(panel.locator('[data-poi-row]')).toHaveCount(4);
  await tap(panel.locator('[data-poi-filter-toggle]'), info);
  await tap(panel.locator('[data-poi-f-refill]'), info);
  await expect(panel.locator('[data-poi-row]')).toHaveCount(2);
  await panel.locator('[data-poi-quick]').scrollIntoViewIfNeeded();
  await panel.locator('[data-poi-filter-box]').screenshot({ path: `${OUT}filter-${w}.png` });
  await panel.locator('[data-poi-list]').screenshot({ path: `${OUT}liste-${w}.png` });
  await panel.locator('[data-poi-quick]').screenshot({ path: `${OUT}schnell-${w}.png` });
});
