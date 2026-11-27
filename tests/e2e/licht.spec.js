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
  // the modes and the charging of a light are typed once as «% in minutes», kept, and the card says how long the light lasts
  await card.locator('[data-live-lamp-set] summary').click();
  const one = card.locator('[data-live-light-set]').first();
  const mode1 = one.locator('[data-live-light-modeset]').first();
  await mode1.locator('[data-live-light-pct]').fill('25');
  await mode1.locator('[data-live-light-pct]').press('Tab');
  await mode1.locator('[data-live-light-min]').fill('60');
  await mode1.locator('[data-live-light-min]').press('Tab');
  await one.locator('[data-live-light-addmode]').click();
  const mode2 = one.locator('[data-live-light-modeset]').nth(1);
  await mode2.locator('[data-live-light-pct]').fill('5');
  await mode2.locator('[data-live-light-pct]').press('Tab');
  await mode2.locator('[data-live-light-min]').fill('60');
  await mode2.locator('[data-live-light-min]').press('Tab');
  await one.locator('[data-live-light-cpct]').fill('20');
  await one.locator('[data-live-light-cpct]').press('Tab');
  await one.locator('[data-live-light-cmin]').fill('23');
  await one.locator('[data-live-light-cmin]').press('Tab');
  // the first mode is in use: 25 % an hour = 4 h on a full charge; 20 % in 23 min = 1 h 55 min from empty
  await expect(card.locator('[data-live-lamp-rest]').first()).toContainText(/4/);
  await expect(card.locator('[data-live-lamp-rest]').first()).toContainText(/1:55/);
  const typed = await page.evaluate(() => JSON.parse(localStorage.getItem('pg-live-lights') || '[]'));
  expect(typed).toHaveLength(1);
  expect(typed[0].modes.map((m) => [m.pct, m.min])).toEqual([[25, 60], [5, 60]]);
  expect(typed[0].charge).toEqual({ pct: 20, min: 23 });
  expect(typed[0].left).toBe('low');
  // a second light, deleted again at once
  await card.locator('[data-live-light-add]').click();
  await expect(card.locator('[data-live-light]')).toHaveCount(2);
  await card.locator('[data-live-light-set]').nth(1).locator('[data-live-light-name]').fill('Rear');
  await card.locator('[data-live-light-set]').nth(1).locator('[data-live-light-name]').press('Tab');
  expect((await page.evaluate(() => JSON.parse(localStorage.getItem('pg-live-lights') || '[]'))).map((l) => l.name)).toContain('Rear');
  await card.locator('[data-live-light-set]').nth(1).locator('[data-live-light-del]').click();
  await expect(card.locator('[data-live-light]')).toHaveCount(1);
});

test('Live map: the lights name the mode that lasts, warn at dusk, show the charge at a stop and sit in the ready card', async ({ page, context }, info) => {
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
  // made-up lights: a front light with two modes and a charge, a rear light that lasts, an almost empty helmet light
  await page.evaluate(() =>
    localStorage.setItem(
      'pg-live-lights',
      JSON.stringify([
        { id: 'f', name: 'Front', left: 'full', mode: 'hi', modes: [{ id: 'hi', name: 'Max', pct: 25, min: 60 }, { id: 'lo', name: 'Eco', pct: 5, min: 60 }], charge: { pct: 20, min: 23 } },
        { id: 'r', name: 'Rear', left: 'full', mode: 'a', modes: [{ id: 'a', name: '', pct: 2, min: 60 }], charge: null },
        { id: 'h', name: 'Helm', left: 'low', mode: 'a', modes: [{ id: 'a', name: '', pct: 10, min: 60 }], charge: { pct: 20, min: 23 } },
      ]),
    ),
  );
  const i = Math.floor(line.length * 0.4);
  await context.setGeolocation({ latitude: line[i][0], longitude: line[i][1], accuracy: 6 });
  await page.goto('./#/live/race-sample');
  await page.clock.setFixedTime(Date.UTC(2027, 5, 12, 19, 45)); // 21:45 in Zurich in June: dusk
  // before the start the ready card tells how long each light needs to charge
  await expect(page.locator('[data-live-ready-lights]')).toContainText(/Front/);
  await expect(page.locator('[data-live-ready-lights]')).toContainText(/1:55/);
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-full]')).toBeVisible();
  // the dusk alert names the light that will not last, and goes with a tap
  const alert = page.locator('[data-live-light-alert]');
  await expect(alert).toContainText(/Front/);
  await expect(alert).not.toContainText(/Rear/);
  await tap(alert.getByRole('button'), info);
  await expect(alert).toHaveCount(0);
  await sheetFull(page, info);

  const card = page.locator('[data-live-lamp]');
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('[data-live-light]')).toHaveCount(3);
  // the sample ride is long: Max (4 h) does not last through it, Eco (20 h) does; the rear light lasts anyway
  await expect(card.locator('[data-live-light="f"]')).toHaveAttribute('data-live-light-state', 'short');
  await expect(card.locator('[data-live-light="f"] [data-live-light-advice]')).toContainText(/Eco/);
  await expect(card.locator('[data-live-light="r"]')).not.toHaveAttribute('data-live-light-state', 'short');
  // at a stop: what 30 minutes of charging give (a full light gives nothing, so only the helmet light says it)
  const rest = page.locator('[data-live-rest]');
  await rest.scrollIntoViewIfNeeded();
  await tap(rest.locator('[data-live-rest-find]'), info);
  await expect(page.locator('[data-live-rest-row], [data-live-rest-none]').first()).toBeVisible();
  if ((await page.locator('[data-live-rest-row]').count()) > 0) await expect(rest.locator('[data-live-rest-charge]')).toContainText(/Helm/);
});
