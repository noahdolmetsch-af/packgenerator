// Live-Karte Teil 2 (Noah 20.10.2026 «2-3 ja»): the lap button (a new lap is kept with the recording and
// listed in the sheet), the turn hint before a turn of the route (arrow + distance), and «Against your
// last ride» from a made-up earlier ride of the sample race. Fake GPS, every outside request mocked or
// blocked (openHome); no sideways scroll.
import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';
import { turnsOf } from '../../src/lib/live/turns.js';
import { sheetFull } from './live-sheet.js';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const noSideways = async (page, where = '') => {
  const over = await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const bad = [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right + scrollX > w + 1 && !e.closest('[data-dp-pager]'));
    return { d: document.documentElement.scrollWidth - w, bad: bad.slice(0, 6).map((e) => `${e.tagName}.${e.className} ${Math.round(e.getBoundingClientRect().right)}`) };
  });
  expect(over.d, `${where} ${over.bad.join(' | ')}`).toBeLessThanOrEqual(1);
};
const idb = (page, store, fn) =>
  page.evaluate(
    ({ store, fn }) =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const g = req.result.transaction(store).objectStore(store).getAll();
          g.onsuccess = () => resolve(new Function('rows', `return (${fn})(rows)`)(g.result));
          g.onerror = () => reject(g.error);
        };
      }),
    { store, fn: String(fn) },
  );
const mocks = async (context) => {
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  await context.route(/overpass/, (route) => route.fulfill({ json: { elements: [] } }));
  await context.grantPermissions(['geolocation']);
};

// the sample route as the app stored it (settings 'races'); km scaled like race.js lineKm
async function routeOf(page) {
  const route = await idb(page, 'settings', (rows) => rows.find((r) => r.key === 'races')?.value?.races?.['race-sample']?.route ?? null);
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
      const f = (km - a.km) / (b.km - a.km || 1);
      return { lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + (b.lon - a.lon) * f };
    }
  }
  return list.at(-1);
}

test('Laps: a tap starts a new lap, the sheet lists them', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await mocks(context);
  await context.setGeolocation({ latitude: 46.95, longitude: 7.45, accuracy: 8 });
  await page.goto('./#/live');
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-full]')).toBeVisible();
  const lap = page.locator('[data-live-lap]');
  await expect(lap).toBeVisible();
  await expect(lap).toContainText('1');
  await tap(lap, info);
  await expect(lap).toContainText('2');
  await expect.poll(() => idb(page, 'tracks', (rows) => rows.find((r) => r.kind === 'rec' && r.open)?.laps?.length ?? 0)).toBe(1);
  await sheetFull(page, info);
  const laps = page.locator('[data-live-sheet] [data-live-laps]');
  await expect(laps).toBeAttached();
  await expect(laps.locator('li')).toHaveCount(2);
  await noSideways(page, 'laps');
});

test('Sample race: a turn hint before the turn and against your last ride', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await mocks(context);
  await page.goto('./#/race');
  await tap(page.locator('[data-race-sample-open]'), info);
  await expect(page.locator('[data-race-sample]')).toBeVisible();
  const pts = await routeOf(page);
  // the first single turn after km 5 of the route (as the app finds it)
  const turn = turnsOf(pts).find((x) => x.dir !== 'bends' && x.km > 5);
  expect(turn, 'the sample route has a turn').toBeTruthy();
  const startKm = Math.max(0, turn.km - 0.6);

  // a made-up earlier ride of this race along the route, 20 km/h, closed
  const t0 = Date.parse('2026-09-01T06:00:00Z');
  const past = [];
  for (let km = Math.max(0, startKm - 2); km <= turn.km + 2; km += 0.1) {
    const p = pointAt(pts, km);
    past.push([p.lat, p.lon, Math.round((km - startKm + 2) * 180)]);
  }
  await page.evaluate(
    (row) =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onsuccess = () => {
          const tx = req.result.transaction('tracks', 'readwrite');
          tx.objectStore('tracks').put(row);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
      }),
    { id: 'rec-test_data_gtp_past', kind: 'rec', tripId: 'race-sample', day: '2026-09-01', startAt: t0, endAt: t0 + 3600_000, pts: past, km: 4, open: false, createdAt: new Date(t0).toISOString() },
  );

  const p0 = pointAt(pts, startKm);
  await context.setGeolocation({ latitude: p0.lat, longitude: p0.lon, accuracy: 6 });
  await page.goto('./#/live/race-sample');
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-live-full]')).toBeVisible();
  // 200 m before the turn: the arrow with the distance
  const p1 = pointAt(pts, turn.km - 0.2);
  await context.setGeolocation({ latitude: p1.lat, longitude: p1.lon, accuracy: 6 });
  const hint = page.locator('[data-live-turn] [data-turn-hint]');
  await expect(hint).toBeVisible({ timeout: 10_000 });
  await expect(hint).toHaveAttribute('data-dir', turn.dir);
  await expect(hint).toContainText('200 m', { timeout: 10_000 });
  await noSideways(page, 'turn hint');
  await page.screenshot({ path: info.outputPath('live-turn.png') });

  // the sheet: against your last ride
  await sheetFull(page, info);
  const ghost = page.locator('[data-live-sheet] [data-live-ghost]');
  await expect(ghost).toBeAttached({ timeout: 10_000 });
  await expect(ghost).toContainText(T('Against your last ride'));
  await expect(ghost.locator('b')).toHaveText(/^[+−±]\d+:\d\d$/);
});
