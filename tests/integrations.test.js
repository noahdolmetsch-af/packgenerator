// v0.27.0 (Noah 1a, AP22 / PF16): integrations and data transitions, the pure parts.
// GPX file checks, weather service down, what a share link carries, and the import preview.
// Fictional data only (a synthetic loop around Bern, test_data_gtp_ names).
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { readGpxFile, GPX_MAX_MB } from '../src/lib/route.js';
import { fetchForecast, searchPlace } from '../src/lib/weather.js';
import { sharePayload, encodeShare, decodeShare, SHARE_LONG } from '../src/lib/share.js';
import { createDb, DATA_TABLES } from '../src/lib/db.js';
import { buildBackup, restoreBackup, importImpact, KEY_OF } from '../src/lib/backup.js';

/** A synthetic loop around Bern (public place), 12 points with elevation. */
export const bernGpx = () => {
  const pts = Array.from({ length: 12 }, (_, n) => {
    const a = (n / 12) * 2 * Math.PI;
    return `<trkpt lat="${(46.948 + 0.02 * Math.sin(a)).toFixed(5)}" lon="${(7.447 + 0.03 * Math.cos(a)).toFixed(5)}"><ele>${540 + Math.round(60 * Math.sin(a))}</ele></trkpt>`;
  }).join('');
  return `<?xml version="1.0"?><gpx version="1.1" creator="test"><trk><name>test_data_gtp_ Bern loop</name><trkseg>${pts}</trkseg></trk></gpx>`;
};
const fileOf = (text, name = 'test.gpx', size = new TextEncoder().encode(text).length) => ({ name, size, text: async () => text });

describe('GPX file from the picker (AP22)', () => {
  it('a valid synthetic route gives distance, climbing and the start', async () => {
    const r = await readGpxFile(fileOf(bernGpx(), 'bern.gpx'));
    expect(r.name).toBe('test_data_gtp_ Bern loop');
    expect(r.km).toBeGreaterThan(10);
    expect(r.gainM).toBeGreaterThan(50);
    expect(r.start).toEqual({ lat: 46.948, lon: 7.477 });
  });
  it('cancelled picker (no file) is no error and no route', async () => {
    expect(await readGpxFile(undefined)).toBeNull();
  });
  it('empty, not XML, no track points and huge files are refused with a plain message', async () => {
    await expect(readGpxFile(fileOf('', 'empty.gpx'))).rejects.toThrow('This file is empty.');
    await expect(readGpxFile(fileOf('just some text, not xml'))).rejects.toThrow('This is not a GPX file.');
    await expect(readGpxFile(fileOf('<gpx version="1.1"><trk><trkseg></trkseg></trk></gpx>'))).rejects.toThrow('The GPX file has no route in it.');
    let read = false;
    const huge = { name: 'huge.gpx', size: (GPX_MAX_MB + 1) * 1024 * 1024, text: async () => ((read = true), '') };
    await expect(readGpxFile(huge)).rejects.toThrow(`more than ${GPX_MAX_MB} MB`);
    expect(read).toBe(false); // refused before reading
  });
});

describe('weather service down (AP22)', () => {
  const bern = { name: 'Bern', lat: 46.948, lon: 7.447 };
  it('HTTP 500 and a network error both throw (the caller shows a message, the list stays)', async () => {
    await expect(fetchForecast(bern, async () => ({ ok: false, status: 500 }))).rejects.toThrow('Forecast failed (500)');
    await expect(fetchForecast(bern, async () => { throw new TypeError('Failed to fetch'); })).rejects.toThrow();
    await expect(searchPlace('Bern', async () => ({ ok: false, status: 503 }))).rejects.toThrow('Place search failed (503)');
  });
});

describe('share link carries only shareable fields (AP22)', () => {
  const trip = {
    title: 'test_data_gtp_ Bern loop', startDate: '2026-11-01', days: 1, bike: 'test_data_gtp_ Bike', bikeId: 'bike-1',
    purpose: { seat: 'Sleep' }, notes: 'PRIVATE_NOTE', place: { name: 'PRIVATE_PLACE', lat: 46.9, lon: 7.4 },
    route: { name: 'PRIVATE_ROUTE', line: [[46.9, 7.4]] }, forecast: { place: { name: 'PRIVATE_FC' } }, photo: 'data:image/jpeg;base64,PRIVATE',
    entries: [],
  };
  const stats = { gearG: 1000, onMeG: 500, zones: [{ key: 'seat', zone: { name: 'Seat pack' }, entries: [{ itemId: 'A', qty: 2 }] }] };
  const items = { A: { name: 'test_data_gtp_ Socks', weightG: 50, notes: 'PRIVATE_ITEM_NOTE', price: 99, brand: 'X' } };

  it('only title, date, days, bike name, total weight and bag → [name, qty, weight]', async () => {
    const p = sharePayload(trip, stats, items);
    expect(Object.keys(p).sort()).toEqual(['b', 'd', 'g', 'n', 't', 'v', 'w']);
    expect(p.g).toEqual([['Sleep', [['test_data_gtp_ Socks', 2, 100]]]]);
    expect(JSON.stringify(p)).not.toMatch(/PRIVATE|bike-1|46\.9|price/);
    expect(await decodeShare(await encodeShare(p))).toEqual(p);
  });

  it('a very long list makes a long link (hint in Pack); a cut-off link opens as "broken"', async () => {
    const many = Object.fromEntries(Array.from({ length: 400 }, (_, n) => [`I${n}`, { name: `test_data_gtp_ item ${n} ${Math.random().toString(36).slice(2, 10)}`, weightG: n }]));
    const big = { ...stats, zones: [{ key: 'seat', zone: { name: 'Seat pack' }, entries: Object.keys(many).map((itemId) => ({ itemId, qty: 1 })) }] };
    const code = await encodeShare(sharePayload(trip, big, many));
    expect(code.length).toBeGreaterThan(SHARE_LONG);
    expect(await decodeShare(code.slice(0, Math.floor(code.length / 2)))).toBeNull();
  });
});

describe('export → import with all core references (AP22 / PF09)', () => {
  let n = 0;
  const fresh = () => createDb(`integrations-${++n}`);
  async function seed(db) {
    await db.items.bulkPut([{ id: 'T1', name: 'test_data_gtp_ Tent', category: 'sleep', weightG: 900, qty: 1, ownership: 'owned', sets: ['u-test-block'], kits: ['K'], domains: ['bikepacking'] }, { id: 'T2', name: 'test_data_gtp_ Lamp', category: 'elec', weightG: null, qty: 2, ownership: 'owned', sets: [], kits: [], domains: ['bikepacking'] }]);
    await db.kits.put({ id: 'K', name: 'test_data_gtp_ Kit', domain: 'bikepacking' });
    await db.bikes.put({ id: 'B1', name: 'test_data_gtp_ Bike', slots: ['seat'], setup: { seat: 'bag-1' } });
    await db.containers.put({ id: 'bag-1', name: 'test_data_gtp_ Seat bag', slot: 'seat', itemId: null, pieces: 1 });
    await db.trips.put({ id: 'trip-1', title: 'test_data_gtp_ Trip', bikeId: 'B1', entries: [{ itemId: 'T1', slot: 'seat', qty: 1, packed: true }, { itemId: 'T2', slot: 'seat', qty: 2, packed: false }] });
    await db.debriefs.put({ tripId: 'trip-1', notes: 'ok' });
    await db.settings.bulkPut([{ key: 'sets', value: [{ key: 'u-test-block', name: 'test_data_gtp_ Block' }] }, { key: 'templates', value: [{ id: 'tpl-1', name: 'test_data_gtp_ Template', entries: [{ itemId: 'T1', qty: 1 }] }] }]);
    await db.notes.put({ id: 'note-1', text: 'test_data_gtp_ note', tripId: 'trip-1', status: 'open', at: '2026-10-01T08:00:00Z' });
    await db.visits.put({ id: 'visit-1', bikeId: 'B1', date: '2026-09-01', shop: 'test_data_gtp_ Shop', photos: ['data:image/jpeg;base64,AAAA'] });
    await db.photos.put({ id: 'photo-1', bikeId: 'B1', tripId: 'trip-1', main: true, data: 'data:image/jpeg;base64,AAAA' });
  }
  const keys = async (db) => Object.fromEntries(await Promise.all(DATA_TABLES.map(async (t) => [t, (await db.table(t).toCollection().primaryKeys()).sort()])));

  it('round trip keeps identical counts, IDs, references, amounts and ticks', async () => {
    const a = fresh();
    await seed(a);
    const file = JSON.parse(JSON.stringify(await buildBackup(a)));
    const b = fresh();
    await restoreBackup(b, file, 'replace');
    expect(await keys(b)).toEqual(await keys(a));
    expect((await b.trips.get('trip-1')).entries).toEqual((await a.trips.get('trip-1')).entries);
    expect((await b.notes.get('note-1')).tripId).toBe('trip-1');
    expect((await b.photos.get('photo-1')).tripId).toBe('trip-1');
    expect((await b.settings.get('templates')).value[0].entries[0].itemId).toBe('T1');
    expect((await b.items.get('T1')).sets).toEqual(['u-test-block']);
  });

  it('the preview counts what Replace deletes and what Merge overwrites', async () => {
    const a = fresh();
    await seed(a);
    const file = JSON.parse(JSON.stringify(await buildBackup(a)));
    // This device: one trip in common, one trip and one note only here.
    const existing = { trips: ['trip-1', 'trip-local'], notes: ['note-local'], items: ['T1'] };
    const total = DATA_TABLES.reduce((s, t) => s + file.tables[t].length, 0);
    expect(importImpact(file, existing)).toEqual({ now: 4, file: total, lost: 2, same: 2, added: total - 2, nowTrips: 2, lostTrips: 1 });
    expect(KEY_OF.debriefs).toBe('tripId');
  });

  it('merge with the same IDs: file wins for those, others stay; replace drops the others', async () => {
    const a = fresh();
    await seed(a);
    const file = JSON.parse(JSON.stringify(await buildBackup(a)));
    const b = fresh();
    await b.trips.bulkPut([{ id: 'trip-1', title: 'old title', entries: [] }, { id: 'trip-local', title: 'test_data_gtp_ only here', entries: [] }]);
    await restoreBackup(b, file, 'merge');
    expect((await b.trips.get('trip-1')).title).toBe('test_data_gtp_ Trip');
    expect(await b.trips.get('trip-local')).toBeTruthy();
    await restoreBackup(b, file, 'replace');
    expect(await b.trips.get('trip-local')).toBeUndefined();
  });

  it('wrong files change nothing', async () => {
    const a = fresh();
    await seed(a);
    const before = await keys(a);
    for (const bad of [null, [], { app: 'other-app', schemaVersion: 1, tables: {} }, { app: 'pack-generator', schemaVersion: 99, tables: {} }, { app: 'pack-generator', schemaVersion: 1, tables: { trips: 'x' } }])
      await expect(restoreBackup(a, bad, 'replace')).rejects.toThrow();
    expect(await keys(a)).toEqual(before);
  });
});
