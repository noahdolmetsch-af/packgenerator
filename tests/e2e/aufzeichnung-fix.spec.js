// Fix «Aufzeichnung ohne Route» (Noah 01.11.2026 «1a 2a 3a 4a 5a»): a start without a route forgets an old GPX,
// and the ride log lists what the recording saw. Made-up places only; every outside request is mocked or blocked.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const geo = (latitude, longitude) => ({ latitude, longitude, accuracy: 10 });

const settingOf = (page, key) =>
  page.evaluate(
    (k) =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const g = req.result.transaction('settings').objectStore('settings').get(k);
          g.onsuccess = () => resolve(g.result?.value ?? null);
          g.onerror = () => reject(g.error);
        };
      }),
    key,
  );

test('Live: a ride without a route forgets an old GPX; the ride log lists points and sends', async ({ page, context }, info) => {
  test.setTimeout(120_000);
  await openHome(page, context, info);
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  // an old GPX of a free ride, loaded weeks ago
  await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const tx = req.result.transaction('settings', 'readwrite');
          const line = Array.from({ length: 30 }, (_, i) => [46.9 + i * 0.01, 7.4 + i * 0.01]);
          tx.objectStore('settings').put({ key: 'live-route', value: { name: 'test_data_gtp_ alt', line, km: 76.2, loadedAt: '2026-10-01T08:00:00.000Z', forTrip: '' } });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
      }),
  );
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation(geo(46.95, 7.45));
  await page.goto('./#/live');
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-full]')).toBeVisible();
  // the old route is gone from the device, not only hidden
  await expect.poll(() => settingOf(page, 'live-route'), { timeout: 10_000 }).toBeNull();
  await expect(page.locator('[data-live-tile="left"]')).toHaveCount(0);

  // ride on a little: points come, the log lists them
  let t = await page.evaluate(() => Date.now());
  for (const [i, lon] of [7.4505, 7.451, 7.4515].entries()) {
    t += 6000;
    await page.clock.setFixedTime(t);
    await context.setGeolocation(geo(46.95, lon));
    await page.waitForTimeout(2600);
    void i;
  }
  const log = page.locator('[data-live-log]');
  await log.scrollIntoViewIfNeeded();
  await tap(log.locator('summary'), info);
  await expect(log.locator('[data-live-log-text]')).toContainText(/GPS( points|-Punkte)/);
  await expect(log.locator('[data-live-log-text]')).toContainText(/^Start|\sStart$/m);
  await expect(log.locator('[data-live-log-send]')).toBeVisible();
  const w = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(w).toBeLessThanOrEqual(1);
  await page.screenshot({ path: info.outputPath('fahrt-protokoll.png') });
});
