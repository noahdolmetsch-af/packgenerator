// «Orte auf der Karte» (Noah 19.10.2026 «brunnen, einkaufsmöglichkeiten, tankstellen, bikeshops … aktiv in
// der karte anzeigen … im umkreis von 10km», 20:26 «1a 3a 5a»): the places panel (src/lib/map/PoiPanel.svelte)
// on the live map. Chips switch kinds on, one Overpass query per tap (debounced, mocked here), the «Places»
// list nearest first with open now and Navigate, a place's detail (hours, Navigate, Save, Share), the saved
// places, busy → try again, offline with the kept answer, the chips remembered. 1a: keeping an offline strip
// also keeps the places along the route (race map, «Map offline»).
//
// PLACEMENT: the tests marked [needs placement] need the map worker to put <PoiPanel> into src/pages/Live.svelte
// (#/live and #/live/<trip>). The test marked [no placement] runs today (OfflineBox → PoiKeepAlong).
// Fictional data only (test_data_gtp_ names). Every outside request is mocked or blocked (openHome).
import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';

const HERE = { lat: 46.95, lon: 7.45 };
const PLACES = [
  { type: 'node', id: 1, lat: 46.9512, lon: 7.4505, tags: { amenity: 'drinking_water', name: 'test_data_gtp_ Brunnen Nord' } },
  { type: 'node', id: 2, lat: 46.958, lon: 7.46, tags: { amenity: 'drinking_water' } },
  { type: 'node', id: 3, lat: 46.952, lon: 7.452, tags: { amenity: 'toilets', name: 'test_data_gtp_ WC Platz', opening_hours: 'Mo-Su 06:00-22:00' } },
  { type: 'node', id: 4, lat: 46.953, lon: 7.449, tags: { shop: 'bakery', name: 'test_data_gtp_ Beck', opening_hours: 'Mo-Fr 07:00-08:30; Sa 07:00-12:00', phone: '+41 00 000 00 00' } },
];
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const noSideways = async (page, where = '') => {
  const over = await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const bad = [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right + scrollX > w + 1 && !e.closest('[data-poi-chips]'));
    return { d: document.documentElement.scrollWidth - w, bad: bad.slice(0, 6).map((e) => `${e.tagName}.${e.className} ${Math.round(e.getBoundingClientRect().right)}`) };
  });
  expect(over.d, `${where} ${over.bad.join(' | ')}`).toBeLessThanOrEqual(1);
};

/** Mocked Overpass: answers PLACES (or `status`), counts the panel's queries (those with «nwr»). */
async function overpass(context, state = { status: 200, calls: [] }) {
  await context.route(/overpass/, async (route) => {
    const body = decodeURIComponent((route.request().postData() ?? '').replace(/^data=/, '').replace(/\+/g, ' '));
    if (/\bnwr\b/.test(body)) state.calls.push(body);
    if (state.status !== 200) return route.fulfill({ status: state.status, body: 'busy' });
    return route.fulfill({ json: { elements: PLACES } });
  });
  await context.route(/tiles\.openfreemap\.org|wmts\.geo\.admin\.ch|tile\.openstreetmap\.org|opentopomap|rainviewer/, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  return state;
}

async function openLive(page, context, info) {
  const T = await openHome(page, context, info);
  const st = await overpass(context);
  await context.grantPermissions(['geolocation', 'clipboard-read', 'clipboard-write']);
  await context.setGeolocation({ latitude: HERE.lat, longitude: HERE.lon, accuracy: 10 });
  await page.goto('./#/live');
  await tap(page.locator('[data-live-start]'), info);
  const panel = page.locator('[data-poi-panel]');
  await expect(panel).toBeVisible();
  await panel.scrollIntoViewIfNeeded();
  return { T, st, panel };
}

test('places around me: chips, one query per tap, list nearest first, Navigate, remembered', async ({ page, context }, info) => {
  const { T, st, panel } = await openLive(page, context, info);
  await expect(panel.locator('[data-poi-status]')).toContainText(T('Tap a kind above to see those places on the map.|poi'));
  // the chips scroll sideways inside their row, never the page
  const chips = panel.locator('[data-poi-chips]');
  await expect(chips.locator('[data-poi-chip]')).toHaveCount(16);
  const overflow = await chips.evaluate((e) => getComputedStyle(e).overflowX);
  expect(overflow).toBe('auto');
  await noSideways(page, 'chips');
  for (const b of await chips.locator('[data-poi-chip]').all()) expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(44);

  // two chips tapped fast: one query with both kinds; «Around me» 10 km by default
  await tap(chips.locator('[data-poi-chip="water"]'), info);
  await tap(chips.locator('[data-poi-chip="toilet"]'), info);
  await expect(panel.locator('[data-poi-status="ok"]')).toBeVisible();
  expect(st.calls).toHaveLength(1);
  expect(st.calls[0]).toContain('"amenity"="drinking_water"');
  expect(st.calls[0]).toContain('"amenity"="toilets"');
  expect(st.calls[0]).toContain('around:10000');
  await expect(panel.locator('[data-poi-status]')).toContainText('3');
  const rows = panel.locator('[data-poi-row]');
  await expect(rows).toHaveCount(3);
  await expect(rows.first()).toContainText('test_data_gtp_ Brunnen Nord');
  await expect(rows.nth(1)).toContainText('test_data_gtp_ WC Platz');
  await expect(rows.nth(1)).toContainText(T('Open, closes {time}|poi', { time: '22:00' }));
  await expect(rows.nth(2)).toContainText(T('Drinking water|poi'));
  await expect(rows.first().locator('a[href*="google.com/maps/dir"]')).toHaveCount(1);
  await expect(rows.first().locator('a[href*="osmand.net"]')).toHaveCount(1);

  // a smaller radius uses the kept answer: no new query
  await tap(panel.getByRole('button', { name: T('{km} km', { km: 2 }), exact: true }), info);
  await page.waitForTimeout(900);
  expect(st.calls).toHaveLength(1);
  // switching a chip off needs no query either
  await tap(chips.locator('[data-poi-chip="toilet"]'), info);
  await expect(rows).toHaveCount(2);
  expect(st.calls).toHaveLength(1);

  // the list folds
  await tap(panel.locator('[data-poi-list-toggle]'), info);
  await expect(panel.locator('[data-poi-list]')).toHaveCount(0);
  await tap(panel.locator('[data-poi-list-toggle]'), info);

  // remembered after a reload (settings 'poi-search')
  await page.reload();
  await tap(page.locator('[data-live-start]'), info);
  await expect(page.locator('[data-poi-chip="water"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-poi-chip="toilet"]')).toHaveAttribute('aria-pressed', 'false');
  await noSideways(page, 'after');
});

test('a place: detail with hours and Navigate, save, share, unsave', async ({ page, context }, info) => {
  const { T, panel } = await openLive(page, context, info);
  await tap(panel.locator('[data-poi-chip="shop"]'), info);
  const row = panel.locator('[data-poi-row="shop"]');
  await expect(row).toHaveCount(1);
  // Friday 09:00: closed, opens tomorrow 07:00
  await expect(row).toContainText(T('Closed, opens tomorrow {time}|poi', { time: '07:00' }));
  await tap(row.locator('button').first(), info);
  const d = panel.locator('[data-poi-detail]');
  await expect(d).toBeVisible();
  await expect(d).toContainText('test_data_gtp_ Beck');
  await expect(d).toContainText('Mo-Fr 07:00-08:30; Sa 07:00-12:00');
  await expect(d.locator('[data-poi-open="closed"]')).toBeVisible();
  await expect(d.locator('[data-poi-nav="google"]')).toHaveAttribute('href', /destination=46\.953000,7\.449000&travelmode=bicycling/);
  await expect(d.locator('[data-poi-nav="osmand"]')).toHaveAttribute('href', /osmand\.net\/map\?pin=46\.953000,7\.449000/);
  await expect(d.locator('a[href^="tel:"]')).toHaveCount(1);
  await expect(d.locator('[data-poi-detour]')).toHaveCount(0); // a free ride: no route, no detour

  // share: the phone's sheet when there is one (stubbed), else copied
  await page.evaluate(() => {
    window.__shared = [];
    navigator.share = async (x) => void window.__shared.push(x);
  });
  await tap(d.locator('[data-poi-share]'), info);
  const shared = await page.evaluate(() => window.__shared);
  expect(shared).toHaveLength(1);
  expect(shared[0].text).toContain('test_data_gtp_ Beck');
  expect(shared[0].text).toContain('https://www.google.com/maps/search/?api=1&query=46.95300,7.44900');

  // save → «Saved places»; share the list (copied without a share sheet); unsave
  await tap(d.locator('[data-poi-star]'), info);
  await expect(d.locator('[data-poi-star]')).toHaveAttribute('aria-pressed', 'true');
  await tap(panel.locator('[data-poi-saved-toggle]'), info);
  await expect(panel.locator('[data-poi-saved-row]')).toHaveCount(1);
  await page.evaluate(() => {
    navigator.share = undefined;
  });
  await tap(panel.locator('[data-poi-share-all]'), info);
  await expect(panel.getByText(T('Copied. Paste it into a message.|poi'))).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('test_data_gtp_ Beck');
  await tap(panel.locator('[data-poi-unstar]'), info);
  await expect(panel.locator('[data-poi-saved-row]')).toHaveCount(0);
  await noSideways(page, 'detail');
});

test('Overpass busy, then try again; offline shows the kept places', async ({ page, context }, info) => {
  const { T, st, panel } = await openLive(page, context, info);
  st.status = 429;
  await tap(panel.locator('[data-poi-chip="water"]'), info);
  await expect(panel.locator('[data-poi-status="bad"]')).toContainText(T('OpenStreetMap is busy right now. Try again in a minute.|poi'));
  expect(st.calls).toHaveLength(2); // both mirrors
  st.status = 200;
  await tap(panel.locator('[data-poi-retry]'), info);
  await expect(panel.locator('[data-poi-status="ok"]')).toBeVisible();
  await expect(panel.locator('[data-poi-row]')).toHaveCount(2);

  await context.setOffline(true);
  await tap(panel.locator('[data-poi-retry]'), info);
  await expect(panel.locator('[data-poi-status="warn"]')).toContainText(T('Offline: the kept places, as of {when}.|poi', { when: '' }).split(',')[0]);
  await expect(panel.locator('[data-poi-row]')).toHaveCount(2);
  await context.setOffline(false);
});

test('Here: the visible map, Search here', async ({ page, context }, info) => {
  const { T, st, panel } = await openLive(page, context, info);
  await tap(panel.locator('[data-poi-chip="water"]'), info);
  await expect(panel.locator('[data-poi-status="ok"]')).toBeVisible();
  await tap(panel.getByRole('button', { name: T('Here|poi') }), info);
  const go = panel.locator('[data-poi-search-here]');
  await expect(go).toBeVisible();
  const before = st.calls.length;
  await tap(go, info);
  await expect(panel.locator('[data-poi-status="ok"]')).toBeVisible();
  expect(st.calls.length).toBe(before + 1);
  expect(st.calls.at(-1)).toMatch(/nwr\["amenity"="drinking_water"\]\([\d.]+,[\d.]+,[\d.]+,[\d.]+\);/);
  await expect(go).toBeDisabled(); // the map has not moved since
});

test('keeping an offline strip also keeps the places along the route', async ({ page, context }, info) => {
  test.setTimeout(150_000);
  await openHome(page, context, info);
  const st = await overpass(context);
  const STYLE = { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#eeeeee' } }] };
  await page.route(/^https:\/\/tiles\.openfreemap\.org\//, (route) => (/\/styles\//.test(route.request().url()) ? route.fulfill({ headers: { 'access-control-allow-origin': '*' }, json: STYLE }) : route.fulfill({ headers: { 'access-control-allow-origin': '*' }, body: PNG, contentType: 'image/png' })));
  await page.route(/^https:\/\/wmts\.geo\.admin\.ch\//, (route) => route.fulfill({ headers: { 'access-control-allow-origin': '*' }, body: PNG, contentType: 'image/png' }));
  await page.goto('./#/race');
  await page.locator('[data-race-sample-open]').click();
  await expect(page).toHaveURL(/#\/race\/race-sample$/);
  // a tiny made-up route keeps the strip small
  await page.evaluate(
    (ln) =>
      new Promise((resolve, reject) => {
        const rq = indexedDB.open('pack-generator');
        rq.onsuccess = () => {
          const tx = rq.result.transaction('settings', 'readwrite');
          const s = tx.objectStore('settings');
          const g = s.get('races');
          g.onsuccess = () => {
            const row = g.result;
            row.value.races['race-sample'].route.line = ln;
            s.put(row);
          };
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => reject(tx.error);
        };
      }),
    [
      [46.95, 7.44],
      [46.955, 7.45],
      [46.96, 7.46],
    ],
  );
  await page.goto('./#/race/race-sample/map');
  await page.reload();
  const box = page.locator('[data-race-box="map-offline"]');
  await box.scrollIntoViewIfNeeded();
  await box.locator('[data-om-ground="swisstopo"]').click();
  await box.locator('[data-om-width="1"]').click();
  await box.locator('[data-om-keep]').click();
  await expect(box.locator('[data-om-done]')).toBeVisible({ timeout: 90_000 });
  await expect(box.locator('[data-poi-keep="done"]')).toBeVisible({ timeout: 20_000 });
  await expect(box.locator('[data-poi-keep="done"]')).toContainText('4');
  // one chunk for a tiny route, every kind asked
  expect(st.calls).toHaveLength(1);
  expect(st.calls[0]).toContain('"amenity"="drinking_water"');
  expect(st.calls[0]).toContain('"tourism"="viewpoint"');
  // the count stays after a reload
  await page.reload();
  await expect(page.locator('[data-race-box="map-offline"] [data-poi-keep="done"]')).toContainText('4');
});
