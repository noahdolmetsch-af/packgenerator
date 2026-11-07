// «Bereit für unterwegs?» (Noah 02.11.2026, Schritt 6): before the start the live page checks the map and the voice. Made-up sample race, every outside request mocked.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());

test('Live page: before the start the card «Ready for the ride?» checks the map and the voice', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64') }),
  );
  await context.route(/overpass/, (route) => route.fulfill({ json: { elements: [] } }));
  await context.grantPermissions(['geolocation']);
  await page.goto('./#/race');
  await tap(page.locator('[data-race-sample-open]'), info);
  await expect(page.locator('[data-race-sample]')).toBeVisible();
  await page.goto('./#/live/race-sample');
  const card = page.locator('[data-live-ready]');
  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeVisible();
  // nothing kept yet, voice off
  await expect(card.locator('[data-live-ready-map]')).toHaveAttribute('data-live-ready-map', 'no');
  await expect(card.locator('[data-live-ready-voice]')).toHaveAttribute('data-live-ready-voice', 'no');
  // the voice is one tap
  await tap(card.locator('[data-live-ready-voice-on]'), info);
  await expect(card.locator('[data-live-ready-voice]')).toHaveAttribute('data-live-ready-voice', 'yes');
  // the map: the offline strips open right there
  await tap(card.locator('[data-live-ready-keep]'), info);
  await expect(card.locator('[data-live-ready-box]')).toBeVisible();
  // nothing is forced: the ride can start
  await expect(page.locator('[data-live-start]')).toBeVisible();
});
