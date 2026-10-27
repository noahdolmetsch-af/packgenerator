// Live Navigation PR 5 «Umweg und zurück» (Noah 27.10.2026 «1a 2b 3a» + «entlang gleicher strecke zurück
// zur route»): on the made-up sample race. 1a: at the place of a detour the app asks how you go back; in a
// race «back where I left the route» is chosen first. 2b: off the route (with the off-route warning on)
// the app plans the way back by itself, with Undo, «Ohne Strecke weiter» and «Gleichen Weg zurück».
// The bike router is mocked; every other outside request is mocked or blocked (openHome).
import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

// the sample route as the app stored it (settings 'races'); km scaled like race.js lineKm
async function routeOf(page) {
  const route = await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const g = req.result.transaction('settings').objectStore('settings').get('races');
          g.onsuccess = () => resolve(g.result?.value?.races?.['race-sample']?.route ?? null);
          g.onerror = () => reject(g.error);
        };
      }),
  );
  const R = 6371;
  const rad = Math.PI / 180;
  const d = (a, b) => 2 * R * Math.asin(Math.sqrt(Math.sin(((b[0] - a[0]) * rad) / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(((b[1] - a[1]) * rad) / 2) ** 2));
  let k = 0;
  const raw = route.line.map((p, i) => ({ lat: p[0], lon: p[1], km: (k += i ? d(route.line[i - 1], p) : 0) }));
  return raw.map((p) => ({ ...p, km: (p.km * route.km) / k }));
}
function pointAt(list, km) {
  for (let i = 1; i < list.length; i++) {
    if (list[i].km >= km) {
      const a = list[i - 1];
      const b = list[i];
      const f = (km - a.km) / (b.km - a.km);
      return { lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + (b.lon - a.lon) * f };
    }
  }
  return list.at(-1);
}
// a tap that must make the card go (a tap on a busy phone is sometimes lost while the map redraws)
const tapGone = (btn, card, info) =>
  expect(async () => {
    await tap(btn, info);
    await expect(card).toHaveCount(0, { timeout: 2000 });
  }).toPass({ timeout: 15_000 });
const geo = (p) => ({ latitude: p.lat, longitude: p.lon, accuracy: 6 });
const off = (p, dLat) => ({ lat: p.lat + dLat, lon: p.lon });

async function startRace(page, context, info, asked) {
  await openHome(page, context, info);
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  // the router: a short made-up way from the first to the last point it was asked for
  await context.route(/brouter\.de\/brouter/, (route) => {
    const url = route.request().url();
    asked.push(url);
    const ll = decodeURIComponent(new URL(url).searchParams.get('lonlats') ?? '')
      .split('|')
      .map((s) => s.split(',').map(Number));
    const a = ll[0];
    const b = ll.at(-1);
    return route.fulfill({
      json: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { 'track-length': '1800', 'filtered ascend': '20', 'total-time': '420' }, geometry: { type: 'LineString', coordinates: [[...a, 500], [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 505], [...b, 510]] } }] },
    });
  });
  await context.grantPermissions(['geolocation']);
  await page.goto('./#/race');
  await tap(page.locator('[data-race-sample-open]'), info);
  await expect(page.locator('[data-race-sample]')).toBeVisible();
  return routeOf(page);
}

test('Live: at the place of a detour the app asks how you go back, a race chooses back where I left', async ({ page, context }, info) => {
  const asked = [];
  const pts = await startRace(page, context, info, asked);
  const place = off(pointAt(pts, 411), 0.006); // about 650 m beside the route
  const exit = pointAt(pts, 410);
  const now = await page.evaluate(() => Date.now());
  // a detour planned a moment ago (left the route at km 410, back on it at km 412)
  const back = pointAt(pts, 412);
  await page.evaluate(
    (d) => localStorage.setItem('pg-live-detour', JSON.stringify(d)),
    { line: [[exit.lat, exit.lon], [place.lat, place.lon], [back.lat, back.lon]], km: 2.4, gainM: 18, min: 9, target: { ...place, name: 'test_data_gtp_ Beck', kind: 'shop' }, rejoin: { km: 412, ...back }, fromKm: 410, extraKm: 0.4, profile: 'trekking', at: now },
  );
  await context.setGeolocation(geo(place));
  await page.goto('./#/live/race-sample');
  await tap(page.locator('[data-live-start]'), info);
  const card = page.locator('[data-live-detour]');
  await expect(card).toBeVisible();
  const ask = card.locator('[data-live-return]');
  await expect(ask).toBeVisible({ timeout: 10_000 });
  await expect(ask.locator('[data-live-return-mode="exit"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(ask.locator('[data-live-return-mode="exit"]')).toContainText('410');
  await expect(ask.locator('[data-live-return-mode="fast"]')).toHaveAttribute('aria-pressed', 'false');
  const w = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(w).toBeLessThanOrEqual(1);
  await page.screenshot({ path: info.outputPath('zurueck-frage.png') });

  // the fast way can be chosen too; back to «where I left» and plan it
  await tap(ask.locator('[data-live-return-mode="fast"]'), info);
  await expect(ask.locator('[data-live-return-mode="fast"]')).toHaveAttribute('aria-pressed', 'true');
  await tap(ask.locator('[data-live-return-mode="exit"]'), info);
  await tap(ask.locator('[data-live-return-go]'), info);
  await expect(card).toHaveAttribute('data-live-detour-back', 'exit');
  await expect(card.locator('[data-live-return]')).toHaveCount(0);
  await expect(card).toContainText(/1[.,]8 km/);
  expect(asked).toHaveLength(1);
  // the router was asked from the place to the exit point
  const ll = decodeURIComponent(new URL(asked[0]).searchParams.get('lonlats')).split('|');
  expect(ll).toHaveLength(2);
  await page.screenshot({ path: info.outputPath('zurueck-geplant.png') });
});

test('Live: off the route the app plans the way back by itself, with Undo, go on without and the same way back', async ({ page, context }, info) => {
  const asked = [];
  const pts = await startRace(page, context, info, asked);
  test.setTimeout(180_000);
  // the off-route warning on, as the options fold keeps it (settings 'live'); the sheet stays small
  await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const tx = req.result.transaction('settings', 'readwrite');
          tx.objectStore('settings').put({ key: 'live', value: { offRoute: true } });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
      }),
  );
  await context.setGeolocation(geo(pointAt(pts, 410)));
  await page.goto('./#/live/race-sample');
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-full]')).toBeVisible();

  // ride a little on the route, then 400 m beside it
  let t = await page.evaluate(() => Date.now());
  const goTo = async (p, s = 5) => {
    t += s * 1000;
    await page.clock.setFixedTime(t);
    await context.setGeolocation(geo(p));
    await page.waitForTimeout(2600); // the live map looks every 2 s
  };
  await goTo(pointAt(pts, 410.2));
  await goTo(pointAt(pts, 410.4));
  await goTo(off(pointAt(pts, 410.5), 0.002));
  await goTo(off(pointAt(pts, 410.6), 0.004));
  await expect(page.locator('[data-live-offroute]')).toBeVisible();
  expect(asked).toHaveLength(0); // not at once: a few seconds off the route first
  await goTo(off(pointAt(pts, 410.6), 0.0042), 20);
  const card = page.locator('[data-live-detour]');
  await expect(card).toHaveAttribute('data-live-detour-back', 'auto', { timeout: 10_000 });
  expect(asked).toHaveLength(1);
  await expect(page.locator('[data-live-offroute]')).toBeHidden();
  await expect(card.locator('[data-live-auto-same]')).toBeVisible();
  const w = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(w).toBeLessThanOrEqual(1);
  await page.screenshot({ path: info.outputPath('zurueck-automatisch.png') });

  // «Gleichen Weg zurück»: your own track, no router
  await tap(card.locator('[data-live-auto-same]'), info);
  await expect(card).toHaveAttribute('data-live-detour-back', 'same');
  expect(asked).toHaveLength(1);
  // × and the app plans again a minute later; Undo then waits until you are back on the route
  await tap(card.locator('[data-live-detour-off]'), info);
  await goTo(off(pointAt(pts, 410.6), 0.0044), 61);
  await expect(card).toHaveAttribute('data-live-detour-back', 'auto', { timeout: 10_000 });
  expect(asked).toHaveLength(2);
  await tapGone(card.locator('[data-live-auto-undo]'), card, info);
  await goTo(off(pointAt(pts, 410.6), 0.0046), 61);
  await expect(card).toHaveCount(0);
  expect(asked).toHaveLength(2);
  await expect(page.locator('[data-live-offroute]')).toBeVisible();

  // back on the route, off again: «Ohne Strecke weiter» also keeps the warning quiet
  await goTo(pointAt(pts, 411));
  await goTo(off(pointAt(pts, 411.1), 0.004));
  await goTo(off(pointAt(pts, 411.1), 0.0042), 61);
  await expect(card).toHaveAttribute('data-live-detour-back', 'auto', { timeout: 10_000 });
  await tapGone(card.locator('[data-live-auto-free]'), card, info);
  await goTo(off(pointAt(pts, 411.1), 0.0044), 61);
  await expect(card).toHaveCount(0);
  await expect(page.locator('[data-live-offroute]')).toBeHidden();
});
