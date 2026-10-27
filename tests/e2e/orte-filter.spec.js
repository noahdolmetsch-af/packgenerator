// Live Navigation PR 3 (Noah 26.10.2026 «1–14, 17, 18»): the «Places» filters on the live map. The situation
// buttons (Suchvorschläge 27.10.2026), «Filter» with properties, «I was here», saved filters (rename, delete with Undo),
// «All filters off». Fictional data only (test_data_gtp_ names); Overpass is mocked.
import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';
import { readFileSync } from 'node:fs';

// Suchvorschläge (27.10.2026): the place search sits in the window «In der Nähe»; open it from the map
async function openNear(page, info) {
  const near = page.locator('[data-live-near]');
  if (await near.evaluate((d) => d.open).catch(() => false)) return;
  const b = page.locator('[data-live-near-open]');
  await b.scrollIntoViewIfNeeded();
  if (info.project.name === 'phone') await b.tap();
  else await b.click();
  await expect(near).toBeVisible();
}


// the situation buttons from the app source (situations.js imports poifilter.js with runes, so it is read as text)
const SRC = readFileSync(new URL('../../src/lib/map/situations.js', import.meta.url), 'utf8');
const quickOf = (key) => {
  const m = SRC.match(new RegExp(`\\{ key: '${key}', name: '([^']+)', emoji: '[^']+', kinds: \\[([^\\]]+)\\]`));
  return { name: m[1], kinds: [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1]) };
};

const HERE = { lat: 46.95, lon: 7.45 };
const PLACES = [
  { type: 'node', id: 1, lat: 46.9512, lon: 7.4505, tags: { amenity: 'drinking_water', name: 'test_data_gtp_ Brunnen Nord' } },
  { type: 'node', id: 2, lat: 46.952, lon: 7.452, tags: { amenity: 'toilets', name: 'test_data_gtp_ WC Gratis', fee: 'no' } },
  { type: 'node', id: 3, lat: 46.954, lon: 7.455, tags: { amenity: 'toilets', name: 'test_data_gtp_ WC Bezahlt', fee: 'yes' } },
];
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());

async function openLive(page, context, info) {
  const T = await openHome(page, context, info);
  await context.route(/overpass/, (route) => route.fulfill({ json: { elements: PLACES } }));
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: HERE.lat, longitude: HERE.lon, accuracy: 10 });
  await page.goto('./#/live');
  await tap(page.locator('[data-live-start]'), info);
  await openNear(page, info);
  const panel = page.locator('[data-poi-panel]');
  await expect(panel).toBeVisible();
  await panel.scrollIntoViewIfNeeded();
  return { T, panel };
}

test('situation button, a property filter, I was here, saved filters with Undo, all off', async ({ page, context }, info) => {
  const { T, panel } = await openLive(page, context, info);
  const water = quickOf('thirst');
  expect(water.kinds.length).toBeGreaterThan(0);

  // Suchvorschläge: the situation «Thirst» switches its kinds on, the others off, and says what it looks for
  const qb = panel.locator('[data-poi-quick-btn="thirst"]');
  await expect(qb).toContainText(T(water.name));
  await tap(qb, info);
  await expect(qb).toHaveAttribute('aria-pressed', 'true');
  for (const k of water.kinds) await expect(panel.locator(`[data-poi-chip="${k}"]`)).toHaveAttribute('aria-pressed', 'true');
  await expect(panel.locator('[data-poi-sithint]')).toBeVisible();
  const rows = panel.locator('[data-poi-row]');
  await expect(rows).toHaveCount(1);
  // the WC chip on top: the two WCs come too
  await tap(panel.locator('[data-poi-chip="toilet"]'), info);
  await expect(qb).toHaveAttribute('aria-pressed', 'false');
  await expect(rows).toHaveCount(3);

  // 5 · «Free WC»: only the free one stays; the toggle says how many are left
  await tap(panel.locator('[data-poi-filter-toggle]'), info);
  const box = panel.locator('[data-poi-filter-box]');
  await expect(box).toBeVisible();
  await tap(box.locator('[data-poi-f-feat="freewc"]'), info);
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('test_data_gtp_ WC Gratis');
  await expect(panel.locator('[data-poi-filter-n]')).toHaveText('1');
  await expect(panel.locator('[data-poi-filter-toggle]')).toContainText(T('{a} of {b} places|poi', { a: 1, b: 3 }));

  // 8 · save it under a name, switch all off, use it again
  await box.locator('[data-poi-preset-new]').fill('test_data_gtp_ Gratis');
  await tap(box.locator('[data-poi-preset-save]'), info);
  const preset = box.locator('[data-poi-preset]');
  await expect(preset).toHaveCount(1);
  await expect(preset.locator('[data-poi-preset-name]')).toHaveValue('test_data_gtp_ Gratis');
  await tap(box.locator('[data-poi-filter-reset]'), info);
  await expect(rows).toHaveCount(3);
  await tap(preset.locator('[data-poi-preset-use]'), info);
  await expect(rows).toHaveCount(1);

  // delete asks in the app's own window and offers Undo
  await tap(preset.locator('[data-poi-preset-remove]'), info);
  await tap(page.getByTestId('ask-delete').getByRole('button', { name: T('Delete'), exact: true }), info);
  await expect(preset).toHaveCount(0);
  await tap(page.getByRole('button', { name: T('Undo') }).last(), info);
  await expect(preset).toHaveCount(1);
  await tap(box.locator('[data-poi-filter-reset]'), info);
  await expect(rows).toHaveCount(3);

  // 6 · «I was here» in the details, then «Hide places I was at»
  await tap(rows.filter({ hasText: 'test_data_gtp_ Brunnen Nord' }).locator('.pp-open'), info);
  const was = panel.locator('[data-poi-detail] [data-poi-visited]');
  await tap(was, info);
  await expect(was).toHaveAttribute('aria-pressed', 'true');
  await tap(box.locator('[data-poi-f-visited]'), info);
  await expect(rows).toHaveCount(2);
  await expect(rows.filter({ hasText: 'test_data_gtp_ Brunnen Nord' })).toHaveCount(0);

  // the filters are remembered
  await page.reload();
  // the ride goes on after a reload; the panel keeps the filters
  await expect(page.locator('[data-poi-panel] [data-poi-filter-n]')).toHaveText('1');
});
