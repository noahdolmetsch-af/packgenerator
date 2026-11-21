// «Untergrund» für «Wege hierher» (Entdecken und Sammeln, Idee 3, Noah 04.11.2026 «4b»): the ground of a run-up from
// OpenStreetMap. Fictional ways and answers, no network.
import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { createDb } from '../src/lib/db.js';
import { classOf, samplesOf, surfaceQuery, parseSurface, sharesOf, readGround, lookupGround, cacheKey, MAX_DAYS, MAX_SAMPLES } from '../src/lib/neuland/untergrund.js';
import { waysOf } from '../src/lib/neuland/wege.js';
import { tracksOf } from '../src/lib/neuland/neuland.js';

// the run-up: 4 km straight east to a place at 8.85 (0.01° of longitude is about 0.76 km here)
const PLACE = { id: 'p-testpass', name: 'Testpass', lat: 46.87, lon: 8.85 };
const RUN = [[46.87, 8.8], [46.87, 8.82], [46.87, 8.84], [46.87, 8.85]];
const way = (id, tags, geometry) => ({ type: 'way', id, tags, geometry: geometry.map(([lat, lon]) => ({ lat, lon })) });
const ASPHALT = way(1, { highway: 'residential', surface: 'asphalt' }, [[46.87, 8.79], [46.87, 8.825]]);
const GRAVEL = way(2, { highway: 'track', tracktype: 'grade3' }, [[46.87, 8.825], [46.87, 8.86]]);

describe('what a way stands on (untergrund.js)', () => {
  it('the surface wins, then the track grade, then the kind of road', () => {
    expect(classOf({ highway: 'path', surface: 'asphalt' })).toBe('paved');
    expect(classOf({ highway: 'track', surface: 'compacted' })).toBe('gravel');
    expect(classOf({ highway: 'path', surface: 'dirt' })).toBe('ground');
    expect(classOf({ highway: 'track', tracktype: 'grade1' })).toBe('paved');
    expect(classOf({ highway: 'track', tracktype: 'grade3' })).toBe('gravel');
    expect(classOf({ highway: 'track', tracktype: 'grade5' })).toBe('ground');
    expect(classOf({ highway: 'tertiary' })).toBe('paved'); // a road with no entry
    expect(classOf({ highway: 'path' })).toBe('unknown'); // a path with no entry stays unknown
    expect(classOf({ highway: 'track', surface: 'asphalt;gravel' })).toBe('paved'); // the first of several
    expect(classOf({})).toBe('unknown');
  });

  it('points along the line, about every 250 m, never more than the limit', () => {
    const s = samplesOf(RUN);
    expect(s[0]).toEqual(RUN[0]);
    expect(s.length).toBeGreaterThan(10);
    expect(s.length).toBeLessThanOrEqual(MAX_SAMPLES);
    const long = [[46.0, 8.0], [46.0, 9.0]]; // about 77 km
    expect(samplesOf(long).length).toBeLessThanOrEqual(MAX_SAMPLES);
    expect(samplesOf([[46, 8]])).toEqual([[46, 8]]);
    expect(samplesOf([])).toEqual([]);
  });

  it('the query asks for the ways near the samples, with their tags and shape', () => {
    const q = surfaceQuery([[46.87, 8.8], [46.87, 8.81]]);
    expect(q).toContain('way(around:25,46.87,8.8,46.87,8.81)["highway"]');
    expect(q).toContain('out tags geom');
    expect(surfaceQuery([[46.87, 8.8]])).toBe('');
  });

  it('counts what each point stands on; no way near a point counts as unknown', () => {
    const samples = [[46.87, 8.8], [46.87, 8.81], [46.87, 8.83], [46.87, 8.84], [47.5, 9.5]];
    const c = parseSurface({ elements: [ASPHALT, GRAVEL] }, samples);
    expect(c).toEqual({ n: 5, paved: 2, gravel: 2, ground: 0, unknown: 1 });
    // a way a little far away does not count (the track is 100 m north of the road)
    const far = parseSurface({ elements: [way(3, { highway: 'residential' }, [[46.871, 8.8], [46.871, 8.84]])] }, [[46.87, 8.82]]);
    expect(far.unknown).toBe(1);
    expect(parseSurface({ elements: [] }, [])).toBeNull();
    expect(parseSurface({}, [[46.87, 8.8]])).toEqual({ n: 1, paved: 0, gravel: 0, ground: 0, unknown: 1 });
  });

  it('shares in whole percent add up to 100', () => {
    expect(sharesOf({ paved: 1, gravel: 1, ground: 1, unknown: 0 })).toEqual({ paved: 34, gravel: 33, ground: 33, unknown: 0 });
    expect(sharesOf({ paved: 5, gravel: 0, ground: 0, unknown: 0 })).toEqual({ paved: 100, gravel: 0, ground: 0, unknown: 0 });
    expect(sharesOf({ paved: 0, gravel: 0, ground: 0, unknown: 0 })).toBeNull();
    const s = sharesOf({ paved: 7, gravel: 3, ground: 2, unknown: 1 });
    expect(s.paved + s.gravel + s.ground + s.unknown).toBe(100);
  });
});

describe('the lookup (untergrund.js)', () => {
  const tracks = tracksOf({
    activities: [
      { id: 'a1', day: '2026-07-05', type: 'GravelRide', line: [...RUN, [46.87, 8.9], [46.87, 8.95]] },
      { id: 'a2', day: '2026-06-01', type: 'Ride', line: [...RUN, [46.87, 8.9], [46.87, 8.95]] },
    ],
    today: '2026-10-19',
  });
  const ways = waysOf(PLACE, 0.6, tracks);
  const answer = (json, ok = true) => {
    const calls = [];
    const f = async (url, init) => {
      calls.push({ url, body: decodeURIComponent(String(init?.body ?? '')) });
      if (!ok) throw new TypeError('Failed to fetch');
      return { ok: true, json: async () => json };
    };
    f.calls = calls;
    return f;
  };

  it('the days with a run-up are asked, the answer is kept, a second time asks nothing', async () => {
    expect(ways.map((w) => w.day)).toEqual(['2026-07-05', '2026-06-01']);
    expect(ways.every((w) => w.run?.length > 1)).toBe(true);
    const db = createDb(`ug-${Math.random()}`);
    const f = answer({ elements: [ASPHALT, GRAVEL] });
    const r = await lookupGround(db, PLACE.id, ways, { fetcher: f, now: 1000 });
    expect(r).toMatchObject({ asked: 2, failed: null });
    expect(f.calls).toHaveLength(2);
    expect(f.calls[0].body).toContain('around:25');
    expect(Object.keys(r.rec.days).sort()).toEqual(['2026-06-01', '2026-07-05']);
    expect(r.rec.days['2026-07-05'].paved + r.rec.days['2026-07-05'].gravel).toBeGreaterThan(5);
    expect((await readGround(db, PLACE.id)).days['2026-07-05'].n).toBeGreaterThan(5);
    expect((await db.meta.get(cacheKey(PLACE.id))).key).toBe('neuland.untergrund.p-testpass');
    const again = await lookupGround(db, PLACE.id, ways, { fetcher: f, now: 2000 });
    expect(again.asked).toBe(0);
    expect(f.calls).toHaveLength(2);
    const forced = await lookupGround(db, PLACE.id, ways, { fetcher: f, now: 3000, force: true });
    expect(forced.asked).toBe(2);
  });

  it('no net: nothing is lost, it says why', async () => {
    const db = createDb(`ug-${Math.random()}`);
    await lookupGround(db, PLACE.id, ways.slice(0, 1), { fetcher: answer({ elements: [ASPHALT] }), now: 1000 });
    const r = await lookupGround(db, PLACE.id, ways, { fetcher: answer({}, false), now: 2000 });
    expect(r.failed).toBe('net');
    expect(r.asked).toBe(0);
    expect(Object.keys(r.rec.days)).toEqual(['2026-07-05']); // what was kept stays
    expect(Object.keys((await readGround(db, PLACE.id)).days)).toEqual(['2026-07-05']);
  });

  it('a day with no run-up (a start here) is not asked, and at most MAX_DAYS days are asked at once', async () => {
    const db = createDb(`ug-${Math.random()}`);
    const f = answer({ elements: [] });
    const none = await lookupGround(db, PLACE.id, [{ day: '2026-01-01', run: null }], { fetcher: f });
    expect(none).toMatchObject({ asked: 0, failed: null });
    expect(f.calls).toHaveLength(0);
    const many = Array.from({ length: MAX_DAYS + 3 }, (_, i) => ({ day: `2026-05-${String(i + 1).padStart(2, '0')}`, run: RUN }));
    const r = await lookupGround(db, PLACE.id, many, { fetcher: f });
    expect(f.calls).toHaveLength(MAX_DAYS);
    expect(r.asked).toBe(MAX_DAYS);
  });
});
