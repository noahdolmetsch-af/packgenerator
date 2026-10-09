// v0.27.0 (Noah 1a, AP22 / PF16): integrations and data transitions in the real app.
// GPX + weather (service down), photos, print and share link, export/import, offline + reload.
// Fictional fixture plus test_data_gtp_ records; a synthetic route around Bern (public place);
// every request outside the preview server is blocked or answered by the test itself.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const tr = (lang) => (en, vars) => {
  const text = (lang === 'de' ? DE[en] : null) ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const day = (n) => new Date(Date.now() + n * 864e5).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const TRIP = 'trip-test_data_gtp_int';
const SECRET = 'test_data_gtp_PRIVATE';

/** The fixture with one record in every table that refers to others (trip, note, visit, photo, template, block). */
function fixture() {
  const data = structuredClone(base);
  const bike = data.tables.bikes[0];
  data.tables.items.find((i) => i.id === 'RA01').sets = ['u-test-data-gtp-rain'];
  data.tables.trips = [{
    id: TRIP, domain: 'bikepacking', title: 'test_data_gtp_ Bern loop', startDate: day(3), days: 2, bikeId: bike.id, bike: bike.name, setup: { ...bike.setup },
    entries: [{ itemId: 'EL01', slot: 'mounted', qty: 1, packed: true }, { itemId: 'TO01', slot: 'frame', qty: 2, packed: false }, { itemId: 'RA01', slot: 'seat', qty: 1, packed: true }],
    ready: [{ id: 'wallet', label: 'Phone, wallet, keys', done: false }], ride: null, hours: 3, sets: {}, purpose: {}, status: 'planned', createdAt: '2026-10-01T08:00:00.000Z',
    notes: `${SECRET} trip note`,
  }];
  data.tables.notes = [{ id: 'note-test_data_gtp_1', text: `${SECRET} note`, status: 'open', at: '2026-10-01T09:00:00.000Z', tripId: TRIP, bikeId: bike.id, page: 'pack', day: null }];
  data.tables.visits = [{ id: 'visit-test_data_gtp_1', bikeId: bike.id, date: '2026-09-20', shop: `${SECRET} shop`, parts: [], photos: ['data:image/png;base64,iVBORw0KGgo='] }];
  data.tables.photos = [{ id: 'photo-test_data_gtp_1', bikeId: bike.id, tripId: TRIP, name: 'test_data_gtp_ setup', main: true, data: 'data:image/png;base64,iVBORw0KGgo=', addedAt: '2026-10-01T09:00:00.000Z' }];
  data.tables.settings = [
    { key: 'sets', value: [{ key: 'u-test-data-gtp-rain', name: 'test_data_gtp_ Rain block', qty: {} }] },
    { key: 'templates', value: [{ id: 'tpl-test_data_gtp_1', name: 'test_data_gtp_ Template', setup: { ...bike.setup }, entries: [{ itemId: 'TO01', slot: 'frame', qty: 1 }], ready: [], ride: null, hours: 2, sets: {}, purpose: {}, fromTrip: null, updatedAt: '2026-10-01T10:00:00.000Z' }] },
  ];
  return data;
}

/** Synthetic GPX: a loop around Bern (public place), 12 points with elevation. */
const bernGpx = () => {
  const pts = Array.from({ length: 12 }, (_, n) => {
    const a = (n / 12) * 2 * Math.PI;
    return `<trkpt lat="${(46.948 + 0.02 * Math.sin(a)).toFixed(5)}" lon="${(7.447 + 0.03 * Math.cos(a)).toFixed(5)}"><ele>${540 + Math.round(60 * Math.sin(a))}</ele></trkpt>`;
  }).join('');
  return `<?xml version="1.0"?><gpx version="1.1" creator="test"><trk><name>test_data_gtp_ Bern loop</name><trkseg>${pts}</trkseg></trk></gpx>`;
};

async function start(page, context, info, lang, { weather = 'down' } = {}) {
  const file = info.outputPath('integrations-fixture.json');
  writeFileSync(file, JSON.stringify(fixture()));
  // Open-Meteo: answered by the test (500 = service down, or a network error); everything else outside blocked.
  await context.route(/open-meteo\.com/, (route) => (weather === 'down' ? route.fulfill({ status: 500, body: 'down' }) : route.abort('internetdisconnected')));
  await context.route(/^https?:\/\/(?!localhost[:/])(?!.*open-meteo)/, (route) => route.abort());
  await context.addInitScript(([l, id]) => {
    localStorage.setItem('lang', l);
    localStorage.setItem('pack.currentTrip', id);
  }, [lang, TRIP]);
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  await importFile(page, lang, file, 'Replace all data');
  return file;
}

async function openData(page) {
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  return data;
}

async function importFile(page, lang, file, button) {
  const data = await openData(page);
  // The panel may still be redrawn right after the start: pick the file again until it is read.
  await expect(async () => {
    await data.getByLabel(tr(lang)('Import backup')).setInputFiles(file);
    await expect(data.getByRole('dialog').or(data.getByRole('status'))).toBeVisible({ timeout: 2000 });
  }).toPass();
  if (button) {
    await data.getByRole('button', { name: tr(lang)(button), exact: true }).press('Enter');
    await expect(data.getByText(/importiert|Imported/)).toBeVisible();
  }
  return data;
}

/** All keys of every data table, straight from IndexedDB. */
const allKeys = (page) =>
  page.evaluate(() => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = async () => {
      const db = r.result;
      const out = {};
      for (const n of [...db.objectStoreNames].filter((n) => n !== 'meta')) {
        out[n] = await new Promise((res) => { const q = db.transaction(n).objectStore(n).getAllKeys(); q.onsuccess = () => res(q.result.map(String).sort()); });
      }
      db.close();
      ok(out);
    };
  }));
const table = (page, name) =>
  page.evaluate((n) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(n).objectStore(n).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);
const tripOf = async (page) => (await table(page, 'trips')).find((t) => t.id === TRIP);
const noSideScroll = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

/** An image made in the browser: JPEG or PNG of w × h, or broken bytes with an image type. */
async function image(page, w, h, type = 'image/jpeg') {
  const b64 = await page.evaluate(([w, h, type]) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    g.fillStyle = '#3a6';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff';
    g.fillRect(w / 4, h / 4, w / 2, h / 2);
    return c.toDataURL(type, 0.9).split(',')[1];
  }, [w, h, type]);
  return Buffer.from(b64, 'base64');
}
const sizeOf = (page, src) => page.evaluate((src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok([i.naturalWidth, i.naturalHeight]); i.src = src; }), src);

async function openConditions(page, T) {
  await page.goto('./#/pack');
  await page.getByLabel(T('More: other trip, edit trip, templates, print')).click();
  await page.getByRole('button', { name: T('Edit trip conditions') }).click();
  const sheet = page.locator('dialog[open]');
  await expect(sheet.getByRole('heading', { name: T('Edit trip conditions') })).toBeVisible();
  return sheet;
}

for (const weather of ['down', 'network']) {
  test(`GPX: invalid, empty, huge and cancelled files save nothing; a valid route works; weather ${weather === 'down' ? 'service answers 500' : 'network error'}, de`, async ({ page, context }, info) => {
    const T = tr('de');
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await start(page, context, info, 'de', { weather });
    const sheet = await openConditions(page, T);
    const gpxInput = sheet.locator('input[type=file][accept*=gpx]');
    const alert = sheet.getByRole('alert');

    // Not XML at all.
    await gpxInput.setInputFiles({ name: 'notes.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from('just text, not a route') });
    await expect(alert).toHaveText(T('This is not a GPX file.'));
    // A GPX without track points.
    await gpxInput.setInputFiles({ name: 'empty-track.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from('<?xml version="1.0"?><gpx version="1.1"><trk><trkseg></trkseg></trk></gpx>') });
    await expect(alert).toHaveText(T('The GPX file has no route in it.'));
    // An empty file.
    await gpxInput.setInputFiles({ name: 'zero.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.alloc(0) });
    await expect(alert).toHaveText(T('This file is empty.'));
    // A huge file (26 MB) is refused before it is read.
    await gpxInput.setInputFiles({ name: 'huge.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.alloc(26 * 1024 * 1024, 32) });
    await expect(alert).toHaveText(T('This file is too big for a GPX route (more than {mb} MB).', { mb: 25 }));
    // Cancelled picker: nothing chosen, nothing changes.
    await gpxInput.setInputFiles([]);
    let trip = await tripOf(page);
    expect(trip.route ?? null).toBeNull();
    expect(trip.place ?? null).toBeNull();
    await expect(sheet.getByText(/Route hinzugefügt|Route added/)).toHaveCount(0);

    // A valid synthetic route: distance, climbing, start place; the forecast then fails gracefully.
    await gpxInput.setInputFiles({ name: 'bern.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from(bernGpx()) });
    await expect(sheet.getByText('test_data_gtp_ Bern loop', { exact: true })).toBeVisible();
    await expect.poll(async () => (await tripOf(page)).route?.km ?? 0).toBeGreaterThan(10);
    trip = await tripOf(page);
    expect(trip.place.name).toBe(T('Start of {name}', { name: 'test_data_gtp_ Bern loop' }));
    expect(trip.route.line.length).toBe(12);
    await expect(sheet.getByRole('alert')).toHaveText(T('The forecast could not be loaded. Try again later.'));
    expect(trip.forecast ?? null).toBeNull();
    await noSideScroll(page);

    // The packing list works without the weather service.
    await sheet.getByRole('button', { name: T('Done') }).click();
    await expect(page.locator('.calm-pack').getByText('Multi tool').first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('photos: non-image, broken image and huge image give a message or a small photo, de', async ({ page, context }, info) => {
  const T = tr('de');
  await start(page, context, info, 'de');
  // Bike setup photo (bike gallery).
  await page.goto('./#/bikes?tab=setup&bike=bike-test');
  await page.locator('summary').filter({ hasText: T('Photos') }).first().click();
  const input = page.locator('input[type=file][accept="image/*"][multiple]');
  await input.setInputFiles({ name: 'list.txt', mimeType: 'text/plain', buffer: Buffer.from('not a photo') });
  await expect(page.getByRole('alert')).toContainText(T('Please choose a photo (JPG, PNG or HEIC as JPG).'));
  await expect(page.getByRole('alert')).toContainText(T('No photo was saved.'));
  await input.setInputFiles({ name: 'broken.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('this is not really a jpeg') });
  await expect(page.getByRole('alert')).toContainText(T('This photo could not be read. Please choose a JPG or PNG.'));
  expect((await table(page, 'photos')).length).toBe(1); // only the fixture's photo

  // A large camera-size JPEG plus a PNG: both stored, the longest side at most 1400 px.
  const big = await image(page, 4000, 3000);
  const png = await image(page, 800, 600, 'image/png');
  await input.setInputFiles([{ name: 'test_data_gtp_big.jpg', mimeType: 'image/jpeg', buffer: big }, { name: 'test_data_gtp_small.png', mimeType: 'image/png', buffer: png }]);
  await expect.poll(async () => (await table(page, 'photos')).length).toBe(3);
  const photos = await table(page, 'photos');
  const bigOne = photos.find((p) => p.name === 'test_data_gtp_big');
  expect(await sizeOf(page, bigOne.data)).toEqual([1400, 1050]);
  expect(bigOne.data.length).toBeLessThan(big.length); // made smaller before it was stored
  expect(await sizeOf(page, photos.find((p) => p.name === 'test_data_gtp_small').data)).toEqual([800, 600]);
  await expect(page.getByRole('alert')).toHaveCount(0);

  // Note photo (quick note): a non-image says so, a big photo is shrunk and saved with the note.
  await page.goto('./#/inbox/new');
  const note = page.locator('dialog[open]');
  const noteInput = note.locator('input[type=file]');
  await noteInput.setInputFiles({ name: 'doc.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') });
  await expect(note.getByRole('alert')).toHaveText(T('Please choose a photo (JPG, PNG or HEIC as JPG).'));
  await noteInput.setInputFiles({ name: 'big.jpg', mimeType: 'image/jpeg', buffer: big });
  await expect(note.getByRole('img', { name: T('Photo of the note') })).toBeVisible();
  await note.locator('textarea').fill('test_data_gtp_ photo note');
  await note.getByRole('button', { name: T('Save') }).click();
  await expect(page.getByRole('status').filter({ hasText: /Eingang|Inbox/ })).toBeVisible();
  const saved = (await table(page, 'notes')).find((n) => n.text === 'test_data_gtp_ photo note');
  expect(await sizeOf(page, saved.photo)).toEqual([1200, 900]);
  await noSideScroll(page);
});

test('print and share link: read-only list on a clean browser, only shareable fields, broken link, de', async ({ page, context, browser }, info) => {
  const T = tr('de');
  // window.print and the clipboard are replaced: the test reads what would have been printed or copied.
  await context.addInitScript(() => {
    window.__printed = 0;
    window.print = () => { window.__printed++; };
    Object.defineProperty(Navigator.prototype, 'share', { value: undefined, configurable: true });
    Object.defineProperty(Navigator.prototype, 'clipboard', { value: { writeText: async (u) => { window.__copied = u; } }, configurable: true });
  });
  await start(page, context, info, 'de');
  await page.goto('./#/pack');
  const menu = () => page.getByLabel(T('More: other trip, edit trip, templates, print'));
  await menu().click();
  await page.getByRole('button', { name: T('Print / PDF') }).click();
  expect(await page.evaluate(() => window.__printed)).toBe(1);
  // The print view holds the trip and its items.
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('section.print h1')).toHaveText('test_data_gtp_ Bern loop');
  await page.emulateMedia({ media: 'screen' });

  const shareBtn = page.getByRole('button', { name: T('Share link') });
  if (!(await shareBtn.isVisible())) await menu().click();
  await shareBtn.click();
  await expect(page.getByRole('status').filter({ hasText: T('Link copied. Paste it into a message; it opens a read-only list.') })).toBeVisible();
  const url = await page.evaluate(() => window.__copied);
  expect(url).toMatch(/#\/share\/[A-Za-z0-9_-]+$/);

  // What the link carries: decoded here, outside the app.
  const code = url.split('#/share/')[1];
  const payload = JSON.parse(inflateRawSync(Buffer.from(code.replace(/-/g, '+').replace(/_/g, '/'), 'base64')).toString('utf8'));
  expect(Object.keys(payload).sort()).toEqual(['b', 'd', 'g', 'n', 't', 'v', 'w']);
  expect(JSON.stringify(payload)).not.toContain(SECRET);
  expect(JSON.stringify(payload)).not.toMatch(/data:image|bike-test|46\.9|note-|visit-|photo-/);
  info.annotations.push({ type: 'share payload', description: JSON.stringify(payload) });

  // A clean browser (no data at all) opens the list read-only.
  const other = await browser.newContext({ serviceWorkers: 'block', viewport: page.viewportSize() });
  await other.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await other.addInitScript(() => localStorage.setItem('lang', 'de'));
  const p2 = await other.newPage();
  await p2.goto(url);
  await expect(p2.getByRole('heading', { name: 'test_data_gtp_ Bern loop' })).toBeVisible();
  await expect(p2.getByText(T('Shared packing list'))).toBeVisible();
  await expect(p2.getByText('Multi tool')).toBeVisible();
  await expect(p2.getByRole('checkbox')).toHaveCount(0); // nothing to tick or change
  await expect(p2.getByText(SECRET)).toHaveCount(0);
  const keys = await p2.evaluate(() => new Promise((ok) => { const r = indexedDB.open('pack-generator'); r.onsuccess = () => { const q = r.result.transaction('trips').objectStore('trips').count(); q.onsuccess = () => { r.result.close(); ok(q.result); }; }; }));
  expect(keys).toBe(0); // the shared list is not stored on the other device
  await noSideScroll(p2);
  // A link cut off in a message: "Link broken", no crash.
  await p2.goto(url.slice(0, url.length - Math.floor(code.length / 2)));
  await p2.reload();
  await expect(p2.getByRole('heading', { name: T('Link broken') })).toBeVisible();
  await other.close();
});

for (const lang of ['de', 'en']) {
  test(`export and import keep every ID; wrong files, cancel and the preview change nothing, ${lang}`, async ({ page, context }, info) => {
    const T = tr(lang);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await start(page, context, info, lang);
    const before = await allKeys(page);
    // Every record of the fixture arrived (the app may add its own settings next to them).
    const fx = fixture();
    for (const [name, rows] of Object.entries(fx.tables)) {
      const key = name === 'settings' ? 'key' : name === 'debriefs' ? 'tripId' : 'id';
      for (const r of rows) expect(before[name]).toContain(String(r[key]));
    }

    // Export.
    const data = await openData(page);
    const [download] = await Promise.all([page.waitForEvent('download'), data.getByRole('button', { name: T('Export backup') }).click()]);
    const exported = info.outputPath('export.json');
    await download.saveAs(exported);
    const file = JSON.parse(readFileSync(exported, 'utf8'));
    expect(file.app).toBe('pack-generator');
    for (const [name, keys] of Object.entries(before)) {
      const key = name === 'settings' ? 'key' : name === 'debriefs' ? 'tripId' : 'id';
      expect(file.tables[name].map((r) => String(r[key])).sort(), name).toEqual(keys);
    }

    // Wrong files: not JSON, JSON of another app, an empty file. Each: a message, nothing changed.
    const wrong = [
      [{ name: 'notes.json', mimeType: 'application/json', buffer: Buffer.from('this is not json') }, T('This file could not be read.')],
      [{ name: 'other-app.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ app: 'some-other-app', version: 3, items: [] })) }, T('This is not a Pack Generator backup file.')],
      [{ name: 'empty.json', mimeType: 'application/json', buffer: Buffer.alloc(0) }, T('This file is empty.')],
    ];
    for (const [f, text] of wrong) {
      await data.getByLabel(T('Import backup')).setInputFiles(f);
      await expect(data.getByRole('status')).toContainText(text);
      await expect(data.getByRole('status')).toContainText(T('Nothing was changed.'));
      await expect(data.getByRole('button', { name: T('Replace all data'), exact: true })).toHaveCount(0);
    }
    expect(await allKeys(page)).toEqual(before);

    // A file with one trip less and one trip more: the preview says what Replace deletes and Merge does.
    const changed = structuredClone(file);
    changed.tables.trips.push({ ...changed.tables.trips[0], id: 'trip-test_data_gtp_new', title: 'test_data_gtp_ New trip' });
    const localTrip = { ...file.tables.trips[0], id: 'trip-test_data_gtp_local', title: 'test_data_gtp_ only on this device' };
    await page.evaluate((trip) => new Promise((ok) => { const r = indexedDB.open('pack-generator'); r.onsuccess = () => { const tx = r.result.transaction('trips', 'readwrite'); tx.objectStore('trips').put(trip); tx.oncomplete = () => { r.result.close(); ok(); }; }; }), localTrip);
    const withLocal = await allKeys(page);
    const changedFile = info.outputPath('changed.json');
    writeFileSync(changedFile, JSON.stringify(changed));
    await data.getByLabel(T('Import backup')).setInputFiles(changedFile);
    const confirm = data.getByRole('dialog', { name: T('Import backup') });
    const now = Object.values(withLocal).reduce((s, k) => s + k.length, 0);
    const inFile = Object.values(changed.tables).reduce((s, r) => s + r.length, 0);
    await expect(confirm).toContainText(T('Replace all data: deletes everything on this device ({now} records, trips: {trips}) and puts the file in its place ({file} records).', { now, trips: 2, file: inFile }));
    await expect(confirm).toContainText(T('Only on this device, so lost with Replace: {lost} records (trips: {lostTrips}).', { lost: 1, lostTrips: 1 }));
    await expect(confirm).toContainText(T('Merge: new from the file: {added}; same ID, overwritten by the file: {same}; nothing is deleted.', { added: 1, same: now - 1 }));
    await noSideScroll(page);
    // Cancel: nothing changed.
    await confirm.getByRole('button', { name: T('Cancel') }).click();
    await expect(confirm).toHaveCount(0);
    expect(await allKeys(page)).toEqual(withLocal);

    // Merge: the new trip comes, the local trip stays, every other ID is the same.
    await importFile(page, lang, changedFile, 'Merge');
    let keys = await allKeys(page);
    expect(keys.trips).toEqual([...withLocal.trips, 'trip-test_data_gtp_new'].sort());
    // Replace: the local trip is gone (the preview said so), the file is the data.
    await importFile(page, lang, changedFile, 'Replace all data');
    keys = await allKeys(page);
    expect(keys.trips).toEqual(changed.tables.trips.map((t) => t.id).sort());
    // Back to the exported file: identical IDs as before the whole round.
    await importFile(page, lang, exported, 'Replace all data');
    expect(await allKeys(page)).toEqual(before);
    const trip = await tripOf(page);
    expect(trip.entries).toEqual(file.tables.trips.find((t) => t.id === TRIP).entries);
    expect((await table(page, 'notes')).find((n) => n.id === 'note-test_data_gtp_1').tripId).toBe(TRIP);
    expect((await table(page, 'photos')).find((n) => n.id === 'photo-test_data_gtp_1').tripId).toBe(TRIP);
    expect(errors).toEqual([]);
  });
}

test.describe('offline', () => {
  // This test needs the app's service worker (the other tests block it).
  test.use({ serviceWorkers: 'allow' });
  test('offline: the app loads from the cache, an edit survives reload, nothing lost back online, de', async ({ page, context }, info) => {
    const T = tr('de');
    await start(page, context, info, 'de');
    // Wait until the service worker controls the page.
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    await expect(page.locator('footer')).toContainText(T('Online'));

    const entries = (await tripOf(page)).entries;
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('footer')).toContainText(T('Offline'));
    // The device separation is explained where the data lives.
    const data = await openData(page);
    // v0.40.0 (Noah 7a): the explanation sits behind the "?" next to "Your data".
    await data.getByRole('button', { name: T('Explain: {what}', { what: T('Your data') }) }).click();
    await expect(data).toContainText(T('Everything is stored in this browser on this device. Use a backup file to move it to your other device.'));

    // An edit while offline: a quick note.
    await page.goto('./#/inbox/new');
    const note = page.locator('dialog[open]');
    await note.locator('textarea').fill('test_data_gtp_ offline note');
    await note.getByRole('button', { name: T('Save') }).click();
    await expect(page.getByRole('status').filter({ hasText: /Eingang|Inbox/ })).toBeVisible();
    await page.goto('./#/');
    await page.reload();
    await expect(page.locator('footer')).toContainText(T('Offline'));
    await expect(page.locator('details.data')).toBeVisible();
    expect((await table(page, 'notes')).some((n) => n.text === 'test_data_gtp_ offline note')).toBe(true);
    // Pack still opens offline with the trip.
    await page.goto('./#/pack');
    await expect(page.locator('.calm-pack').getByText('Multi tool').first()).toBeVisible();

    await context.setOffline(false);
    await page.goto('./');
    await page.reload();
    await expect(page.locator('footer')).toContainText(T('Online'));
    expect((await table(page, 'notes')).some((n) => n.text === 'test_data_gtp_ offline note')).toBe(true);
    expect((await tripOf(page)).entries).toEqual(entries);
  });
});
