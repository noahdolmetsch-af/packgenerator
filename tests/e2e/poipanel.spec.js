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


const HERE = { lat: 46.95, lon: 7.45 };
const PLACES = [
  { type: 'node', id: 1, lat: 46.9512, lon: 7.4505, tags: { amenity: 'drinking_water', name: 'test_data_gtp_ Brunnen Nord' } },
  { type: 'node', id: 2, lat: 46.958, lon: 7.46, tags: { amenity: 'drinking_water' } },
  { type: 'node', id: 3, lat: 46.952, lon: 7.452, tags: { amenity: 'toilets', name: 'test_data_gtp_ WC Platz', opening_hours: 'Mo-Su 06:00-22:00' } },
  { type: 'node', id: 4, lat: 46.953, lon: 7.449, tags: { shop: 'bakery', name: 'test_data_gtp_ Beck', opening_hours: 'Mo-Fr 07:00-08:30; Sa 07:00-12:00', phone: '+41 00 000 00 00' } },
  { type: 'node', id: 5, lat: 46.9505, lon: 7.4502, tags: { amenity: 'bench', name: 'test_data_gtp_ Bank am Weg' } },
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
  await openNear(page, info);
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
  // both taps in the same moment, so a slow test machine cannot pull them apart past the 600 ms wait
  await chips.evaluate((e) => ['water', 'toilet'].forEach((k) => e.querySelector(`[data-poi-chip="${k}"]`).click()));
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
  // the ride goes on by itself after the reload (live-resume): no start tap
  await page.reload();
  await expect(page.locator('[data-live-resumed-full]')).toBeVisible();
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

test('Overpass busy (every server), then try again; offline shows the kept places', async ({ page, context }, info) => {
  const { T, st, panel } = await openLive(page, context, info);
  st.status = 429;
  await tap(panel.locator('[data-poi-chip="water"]'), info);
  // Live Navigation PR 2: the true reason, every server asked, and a smaller radius offered
  await expect(panel.locator('[data-poi-status="bad"]')).toContainText(T('All OpenStreetMap servers are full or too slow right now.|poi'));
  expect(st.calls.length).toBeGreaterThanOrEqual(3);
  await expect(panel.locator('[data-poi-smaller]')).toBeVisible();
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
  // the open sheet covers most of the map, so Live's «follow me» (a step every 2 s) may still move the map once
  // to keep you visible; wait until the map is at rest (unchanged over one step), then search the view as it is
  const view = page.locator('[data-map-view]');
  let last = null;
  await expect.poll(async () => { const v = await view.getAttribute('data-map-view'); const same = v != null && v === last; last = v; return same; }, { intervals: [2500], timeout: 20_000 }).toBe(true);
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

// «Weitere Quellen» (Noah 20.10.2026 «… individuell auch einen Radius eingeben … weitere Quellen anbinden», 1a+b 2a+b)

test('an own radius: typed, checked, used for the query and remembered', async ({ page, context }, info) => {
  const { T, st, panel } = await openLive(page, context, info);
  await tap(panel.locator('[data-poi-chip="water"]'), info);
  await expect(panel.locator('[data-poi-status="ok"]')).toBeVisible();
  expect(st.calls.at(-1)).toContain('around:10000');
  const own = panel.locator('[data-poi-radius-own]');
  await expect(own).toBeVisible();
  expect((await own.boundingBox()).height).toBeGreaterThanOrEqual(44);
  // out of range: a line says what fits, nothing is asked
  await own.fill('80');
  await own.press('Enter');
  await expect(panel.locator('[data-poi-radius-bad]')).toContainText(T('Type a radius from {min} to {max} km, e.g. 15 or 7.5.|poi', { min: 1, max: 50 }));
  // 25 km: bigger than the kept answer, one query with 25000 m, no radius button pressed
  const before = st.calls.length;
  await own.fill('25');
  await own.press('Enter');
  await expect(panel.locator('[data-poi-radius-bad]')).toHaveCount(0);
  await expect.poll(() => st.calls.length).toBe(before + 1);
  expect(st.calls.at(-1)).toContain('around:25000');
  await expect(panel.locator('[data-poi-status="ok"]')).toBeVisible();
  await expect(panel.getByRole('button', { name: T('{km} km', { km: 10 }), exact: true })).toHaveAttribute('aria-pressed', 'false');
  // 7,5 km (with a comma): smaller, the kept answer serves it, no query
  await own.fill('7,5');
  await own.press('Enter');
  await page.waitForTimeout(900);
  expect(st.calls.length).toBe(before + 1);
  await expect(panel.locator('[data-poi-status="ok"]')).toBeVisible();
  // a radius button again empties the own field
  await tap(panel.getByRole('button', { name: T('{km} km', { km: 5 }), exact: true }), info);
  await expect(own).toHaveValue('');
  await own.fill('25');
  await own.press('Enter');
  await expect(own).toHaveValue('25');
  // the ride goes on by itself after the reload (live-resume): no start tap
  await page.reload();
  await expect(page.locator('[data-live-resumed-full]')).toBeVisible();
  await expect(page.locator('[data-poi-radius-own]')).toHaveValue('25');
  await noSideways(page, 'radius');
});

test('the kinds: rename, take out and Undo, put more in, sort, an own kind with OpenStreetMap tags', async ({ page, context }, info) => {
  const { T, st, panel } = await openLive(page, context, info);
  const chips = panel.locator('[data-poi-chips]');
  await tap(panel.locator('[data-poi-kinds-edit]'), info);
  const box = panel.locator('[data-poi-kinds]');
  await expect(box).toBeVisible();
  await expect(box.locator('[data-poi-kind-row]')).toHaveCount(16);
  // rename: the chip shows your name
  const name = box.locator('[data-poi-kind-name="water"]');
  await name.fill('test_data_gtp_ Brünneli');
  await name.press('Enter');
  await expect(chips.locator('[data-poi-chip="water"]')).toContainText('test_data_gtp_ Brünneli');
  // take «Laundry» out of the row, Undo brings it back
  await tap(box.locator('[data-poi-kind-remove="laundry"]'), info);
  await expect(chips.locator('[data-poi-chip="laundry"]')).toHaveCount(0);
  await expect(box.locator('[data-poi-kind-add="laundry"]')).toBeVisible();
  await page.locator('.rtoast').getByRole('button', { name: T('Undo') }).click();
  await expect(chips.locator('[data-poi-chip="laundry"]')).toHaveCount(1);
  // a more kind into the row, then one place up with the arrow
  await tap(box.locator('[data-poi-kind-add="bench"]'), info);
  await expect(chips.locator('[data-poi-chip]').last()).toHaveAttribute('data-poi-chip', 'bench');
  await tap(box.locator('[data-poi-kind-row="bench"]').getByRole('button', { name: T('Move {name} up', { name: T('Bench|poi') }) }), info);
  await expect(chips.locator('[data-poi-chip]').nth(15)).toHaveAttribute('data-poi-chip', 'bench');

  // an own kind: a wrong tag is refused with its line, then saved, switched on and asked
  await tap(box.locator('[data-poi-cat-new]'), info);
  await box.locator('[data-poi-cat-name]').fill('test_data_gtp_ Ruhebänke');
  await tap(box.locator('[data-poi-cat-icon="bench"]'), info);
  await box.locator('[data-poi-cat-tags]').fill('["amenity"="bench"]\n["fee"!="yes"]');
  await tap(box.locator('[data-poi-cat-save]'), info);
  await expect(box.locator('[data-poi-cat-errors]')).toContainText(T('Line {n}: add a tag with = or ~ too; with != alone almost everything fits.|poi', { n: 2 }));
  await box.locator('[data-poi-cat-tags]').fill('["amenity"="bench"]\nleisure=picnic_table');
  const before = st.calls.length;
  await tap(box.locator('[data-poi-cat-save]'), info);
  const mine = chips.locator('[data-poi-chip^="my-"]');
  await expect(mine).toHaveCount(1);
  await expect(mine).toContainText('test_data_gtp_ Ruhebänke');
  await expect(mine).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => st.calls.length).toBe(before + 1);
  expect(st.calls.at(-1)).toContain('nwr["amenity"="bench"](around:10000');
  expect(st.calls.at(-1)).toContain('nwr["leisure"="picnic_table"](around:10000');
  const row = panel.locator('[data-poi-row^="my-"]');
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('test_data_gtp_ Bank am Weg');
  await noSideways(page, 'kinds');
  // remembered after a reload
  // the ride goes on by itself after the reload (live-resume): no start tap
  await page.reload();
  await expect(page.locator('[data-live-resumed-full]')).toBeVisible();
  await expect(page.locator('[data-poi-chips] [data-poi-chip^="my-"]')).toContainText('test_data_gtp_ Ruhebänke');
  await expect(page.locator('[data-poi-chip="water"]')).toContainText('test_data_gtp_ Brünneli');
  // delete the own kind: asked first, then gone
  await openNear(page, info);
  const p2 = page.locator('[data-poi-panel]');
  await tap(p2.locator('[data-poi-kinds-edit]'), info);
  await tap(p2.locator('[data-poi-kind-remove^="my-"]'), info);
  await page.getByTestId('ask-delete').getByRole('button', { name: T('Delete'), exact: true }).click();
  await expect(p2.locator('[data-poi-chips] [data-poi-chip^="my-"]')).toHaveCount(0);
});

test('own places: a CSV file loads as one source, a place by hand, rename and remove the file', async ({ page, context }, info) => {
  const { T, panel } = await openLive(page, context, info);
  await tap(panel.locator('[data-poi-own-toggle]'), info);
  const own = panel.locator('[data-poi-own]');
  await expect(own.locator('[data-poi-own-empty]')).toBeVisible();
  const csv = 'name;lat;lon;category\ntest_data_gtp_ Verpflegung 1;46,951;7,451;Verpflegung\ntest_data_gtp_ Quelle;46,96;7,44;Wasser\nohne Ort;;\n';
  await own.locator('[data-poi-own-file]').setInputFiles({ name: 'test_data_gtp_ rennen.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await expect(own.locator('[data-poi-own-msg="ok"]')).toContainText(T('Loaded from «{name}»: {n} places.|poi', { name: 'test_data_gtp_ rennen', n: 2 }));
  await expect(own.locator('[data-poi-own-msg="ok"]')).toContainText(T('{n} without a usable position were left out.|poi', { n: 1 }));
  await expect(own.locator('[data-poi-own-row]')).toHaveCount(2);
  await expect(own.locator('[data-poi-own-row]').first()).toContainText('test_data_gtp_ Verpflegung 1');
  await expect(own.locator('[data-poi-src]')).toHaveCount(1);
  // the same file again replaces its places
  await own.locator('[data-poi-own-file]').setInputFiles({ name: 'test_data_gtp_ rennen.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await expect(own.locator('[data-poi-own-msg="ok"]')).toContainText(T('The {n} from before are replaced.|poi', { n: 2 }));
  await expect(own.locator('[data-poi-own-row]')).toHaveCount(2);

  // a place by hand where I am, with a name
  await tap(own.locator('[data-poi-own-add-here]'), info);
  const sheet = page.locator('dialog[open]');
  await sheet.locator('[data-own-name]').fill('test_data_gtp_ Mein Rastplatz');
  await sheet.getByRole('button', { name: T('Save'), exact: true }).click();
  await expect(own.locator('[data-poi-own-row]')).toHaveCount(3);
  await expect(own.locator('[data-poi-own-row]').last()).toContainText('test_data_gtp_ Mein Rastplatz');

  // rename the file, then remove all its places (asked, Undo)
  const srcName = own.locator('[data-poi-src-name]');
  await srcName.fill('test_data_gtp_ Rennen 2026');
  await srcName.press('Enter');
  await expect(own.locator('[data-poi-own-row]').first()).toContainText('test_data_gtp_ Rennen 2026');
  await tap(own.locator('[data-poi-src-remove]'), info);
  await page.getByTestId('ask-delete').getByRole('button', { name: T('Remove'), exact: true }).click();
  await expect(own.locator('[data-poi-own-row]')).toHaveCount(1);
  await expect(own.locator('[data-poi-src]')).toHaveCount(0);
  await page.locator('.rtoast').getByRole('button', { name: T('Undo') }).click();
  await expect(own.locator('[data-poi-own-row]')).toHaveCount(3);
  // a file that is not a place file says so
  await own.locator('[data-poi-own-file]').setInputFiles({ name: 'test_data_gtp_ liste.csv', mimeType: 'text/csv', buffer: Buffer.from('name;ort\nx;y\n') });
  await expect(own.locator('[data-poi-own-msg="bad"]')).toContainText(T('No columns lat and lon found. The first line must name them, e.g. name;lat;lon.|poi'));
  await noSideways(page, 'own places');
});
