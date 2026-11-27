// «Ankunfts-Bericht» (Noah 26.11.2026): at the end of the route the report shows by itself, «Later» folds it away, the button brings it back. Made-up sample race, every outside request mocked.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';
import { sheetFull } from './live-sheet.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());

test('Live map: at the end of the route the arrival report shows, Later folds it away and the button shows it again', async ({ page, context }, info) => {
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
  await page.evaluate(() => localStorage.setItem('pg-live-lights', JSON.stringify([{ id: 'f', name: 'Front', left: 'full', mode: 'a', modes: [{ id: 'a', name: '', pct: 10, min: 60 }], charge: null }])));
  await context.setGeolocation({ latitude: line[0][0], longitude: line[0][1], accuracy: 6 });
  await page.goto('./#/live/race-sample');
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-full]')).toBeVisible();
  await expect(page.locator('[data-live-report]')).toHaveCount(0);
  // ride along the line to its end, back and to the end again: the made-up line is only 370 km long on the ground (its km are scaled), so half of the route needs more than one pass
  let t = await page.evaluate(() => Date.now());
  const steps = 120;
  const pass = [...Array(steps + 1).keys()].map((s) => s / steps);
  for (const f of [...pass.slice(1), ...pass.slice(1).reverse(), ...pass.slice(1)]) {
    const p = line[Math.round((line.length - 1) * f)];
    t += 150_000;
    await page.clock.setFixedTime(t);
    await context.setGeolocation({ latitude: p[0], longitude: p[1], accuracy: 6 });
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(1500);
  const rep = page.locator('[data-live-report]');
  await expect(rep).toBeVisible({ timeout: 10_000 });
  await expect(rep.locator('[data-live-report-time]')).toBeVisible();
  await expect(rep.locator('[data-live-report-dark]')).toContainText(/Front/); // the light used in the dark
  await page.screenshot({ path: info.outputPath('ankunft-bericht.png') });
  await tap(rep.locator('[data-live-report-later]'), info);
  await expect(rep).toHaveCount(0);
  await sheetFull(page, info);
  const again = page.locator('[data-live-report-open]');
  await again.scrollIntoViewIfNeeded();
  await tap(again, info);
  await expect(page.locator('[data-live-report]')).toBeVisible();
});
