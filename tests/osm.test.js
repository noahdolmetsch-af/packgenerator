// «Neue Sammlungen» (Träume und Neuland N18, Noah 07.11.2026 «ok N18»): towers, bridges and waterfalls from OpenStreetMap.
// The Overpass answer is made up (fictional places); no network.
import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { createDb } from '../src/lib/db.js';
import { OSM_KEY, OSM_SETS, OSM_EVERY_MS, OSM_RETRY_MS, osmQuery, osmKind, parseOsm, osmRec, osmDue, osmItems, osmCounts, refreshOsm, refreshOsmIfDue } from '../src/lib/neuland/osm.js';
import { COLLECTIONS, itemsOf, tracksOf, detect, visitedOf, stateOf } from '../src/lib/neuland/neuland.js';
import { loadBase } from '../src/lib/neuland/load.js';

const P = 'test_data_gtp_';
const ANSWER = {
  elements: [
    { type: 'node', id: 11, lat: 47.1, lon: 8.1, tags: { man_made: 'tower', 'tower:type': 'observation', name: `${P}Turm Eins`, ele: '812' } },
    { type: 'way', id: 12, center: { lat: 47.2, lon: 8.2 }, tags: { man_made: 'tower', 'tower:type': 'observation', name: `${P}Aussichtsturm Zwei` } },
    { type: 'node', id: 13, lat: 47.3, lon: 8.3, tags: { man_made: 'tower', 'tower:type': 'observation' } }, // no name: left out
    { type: 'node', id: 14, lat: 47.4, lon: 8.4, tags: { waterway: 'waterfall', name: `${P}Fall Drei`, ele: '1,5' } },
    { type: 'way', id: 15, center: { lat: 47.5, lon: 8.5 }, tags: { highway: 'path', bridge: 'yes', 'bridge:structure': 'suspension', name: `${P}Hängebrücke Vier` } },
    { type: 'node', id: 11, lat: 47.1, lon: 8.1, tags: { man_made: 'tower', 'tower:type': 'observation', name: `${P}Turm Eins` } }, // twice: once
    { type: 'node', id: 16, lat: 47.6, lon: 8.6, tags: { man_made: 'tower' , name: 'ordinary mast' } }, // not a lookout
    { type: 'node', id: 17, lat: 'x', lon: 8.7, tags: { waterway: 'waterfall', name: `${P}kaputt` } },
  ],
};

describe('the query and the answer', () => {
  it('asks for the three kinds in Switzerland, named ones only', () => {
    const q = osmQuery();
    expect(q).toContain('"ISO3166-1"="CH"');
    for (const w of ['observation', 'waterfall', 'suspension']) expect(q).toContain(w);
    expect(q).toContain('out tags center');
  });

  it('sorts an element into its collection', () => {
    expect(osmKind({ waterway: 'waterfall' })).toBe('waterfalls');
    expect(osmKind({ man_made: 'tower', 'tower:type': 'observation' })).toBe('towers');
    expect(osmKind({ bridge: 'suspension' })).toBe('bridges');
    expect(osmKind({ man_made: 'tower' })).toBe(null);
  });

  it('names, places, heights; each place once; no name, no place, no lookout: left out', () => {
    const s = parseOsm(ANSWER);
    expect(s.towers.map((r) => r[0])).toEqual([`${P}Aussichtsturm Zwei`, `${P}Turm Eins`]);
    expect(s.towers.find((r) => r[4] === 'n11')).toEqual([`${P}Turm Eins`, 47.1, 8.1, 812, 'n11']);
    expect(s.towers.find((r) => r[4] === 'w12')[3]).toBe(null);
    expect(s.waterfalls).toEqual([[`${P}Fall Drei`, 47.4, 8.4, 2, 'n14']]);
    expect(s.bridges).toEqual([[`${P}Hängebrücke Vier`, 47.5, 8.5, null, 'w15']]);
  });

  it('a broken answer gives empty collections', () => {
    expect(parseOsm(null)).toEqual({ towers: [], bridges: [], waterfalls: [] });
    expect(osmRec('x')).toEqual({ at: 0, tried: 0, sets: { towers: [], bridges: [], waterfalls: [] } });
  });
});

describe('weekly', () => {
  const DAY = 24 * 3600 * 1000;
  it('never loaded: due; after a success a week; after a failure six hours', () => {
    expect(osmDue(null, 1e12)).toBe(true);
    expect(osmDue({ at: 1e12 - 3 * DAY, tried: 1e12 - 3 * DAY }, 1e12)).toBe(false);
    expect(osmDue({ at: 1e12 - OSM_EVERY_MS, tried: 1e12 - OSM_EVERY_MS }, 1e12)).toBe(true);
    expect(osmDue({ at: 0, tried: 1e12 - OSM_RETRY_MS / 2 }, 1e12)).toBe(false);
    expect(osmDue({ at: 0, tried: 1e12 - OSM_RETRY_MS }, 1e12)).toBe(true);
    expect(osmDue({ at: 1e12 - 8 * DAY, tried: 1e12 - 1 * 3600 * 1000 }, 1e12)).toBe(false);
  });
});

describe('loading and keeping', () => {
  const answer = (json, ok = true) => async () => ({ ok, status: ok ? 200 : 500, json: async () => json });

  it('a good answer is kept on the device and becomes the items of the three collections', async () => {
    const db = createDb(`osm-${Math.random()}`);
    const r = await refreshOsm(db, { fetcher: answer(ANSWER), now: 5_000_000 });
    expect(r).toEqual({ ok: true, at: 5_000_000 });
    const rec = (await db.meta.get(OSM_KEY)).value;
    expect(osmCounts(rec)).toEqual({ towers: 2, bridges: 1, waterfalls: 1 });
    expect(osmItems(rec, 'waterfalls')).toEqual([{ id: 'o-n14', name: `${P}Fall Drei`, kind: 'point', lat: 47.4, lon: 8.4, alt: 2 }]);
    expect(await loadBase('towers')).toEqual([]); // the app's own database (not this test's) holds nothing yet
    expect(await refreshOsmIfDue(db, { now: 5_000_000 + 1000 })).toBe(null); // not yet a week
  });

  it('a failure keeps what was there and waits six hours', async () => {
    const db = createDb(`osm-${Math.random()}`);
    await refreshOsm(db, { fetcher: answer(ANSWER), now: 1000 });
    const r = await refreshOsm(db, { fetcher: answer({}, false), now: 2000 });
    expect(r.ok).toBe(false);
    const rec = (await db.meta.get(OSM_KEY)).value;
    expect(rec.at).toBe(1000);
    expect(rec.tried).toBe(2000);
    expect(osmCounts(rec).towers).toBe(2);
  });

  it('nothing loaded yet: the collections exist and are empty', async () => {
    expect(OSM_SETS.every((id) => COLLECTIONS.find((c) => c.id === id)?.osm)).toBe(true);
    expect(osmItems(null, 'towers')).toEqual([]);
  });
});

describe('finding them on a ride', () => {
  it('a line past a waterfall and a tower ticks both, one far away stays open', () => {
    const items = {
      towers: osmItems({ sets: { towers: [[`${P}Turm Eins`, 47.1, 8.1, 812, 'n11'], [`${P}Fern`, 46.0, 7.0, null, 'n99']], bridges: [], waterfalls: [] } }, 'towers'),
      waterfalls: osmItems({ sets: { towers: [], bridges: [], waterfalls: [[`${P}Fall Drei`, 47.1005, 8.1005, null, 'n14']] } }, 'waterfalls'),
    };
    const defs = ['towers', 'waterfalls'].map((id) => ({ ...COLLECTIONS.find((c) => c.id === id), items: itemsOf({}, id, items[id]).items }));
    const tracks = tracksOf({ trips: [{ id: 't1', title: `${P}Fahrt`, startDate: '2026-11-01', status: 'done', route: { line: [[47.09, 8.09], [47.1, 8.1], [47.11, 8.11]] } }], rides: [], activities: [], today: '2026-11-07' });
    const found = detect(defs, tracks);
    const st = stateOf(null);
    expect([...visitedOf(st, 'towers', defs[0].items, found).keys()]).toEqual(['o-n11']);
    expect([...visitedOf(st, 'waterfalls', defs[1].items, found).keys()]).toEqual(['o-n14']);
  });
});
