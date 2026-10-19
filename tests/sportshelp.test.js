import { describe, it, expect } from 'vitest';
import { sportDays, mosaic, timesIn, lastDay, goalOf, dirOf, windTip, commuteKm, loopsFor, stepState, ageState, matchStats, goodDrills, surfaceOf, analyseRoute, longestDry, overpassQuery, featuresFor, tripOfSport } from '../src/lib/sportshelp.js';
import { FEATURE } from '../src/lib/features.js';

const today = '2026-10-19';

describe('Paket O: sessions and the mosaic (#96)', () => {
  it('counts ticks, trips, values and Strava for a sport', () => {
    const gym = { id: 'act:gym', kind: 'act', key: 'gym' };
    const m = sportDays(gym, { log: [{ actId: 'gym', day: '2026-10-18' }, { actId: 'yoga', day: '2026-10-18' }], values: [{ sport: 'act:gym', kind: 'value', day: '2026-10-10' }], strava: [{ day: '2026-10-12' }], today });
    expect([...m.keys()].sort()).toEqual(['2026-10-10', '2026-10-12', '2026-10-18']);
    const cyc = { id: 'trip:cycling', kind: 'trip', key: 'cycling' };
    const trips = [{ sport: 'cycling', startDate: '2026-10-15', days: 2, finished: true }, { sport: 'gravel', startDate: '2026-10-16', finished: true }];
    const c = sportDays(cyc, { log: [{ actId: 'bike', day: '2026-10-01' }], trips, today });
    expect([...c.keys()].sort()).toEqual(['2026-10-01', '2026-10-15', '2026-10-16']);
    expect(timesIn(c, today, 7)).toBe(2);
    expect(lastDay(c)).toBe('2026-10-16');
  });
  it('a trip belongs to its sport; an old bike trip without one to Fahrrad', () => {
    expect(tripOfSport({ sport: 'gravel' }, 'gravel')).toBe(true);
    expect(tripOfSport({}, 'cycling')).toBe(true);
    expect(tripOfSport({ domain: 'ski', packs: [] }, 'ski')).toBe(true);
    expect(tripOfSport({ domain: 'ski', packs: [], skipped: true }, 'ski')).toBe(false);
  });
  it('one square per day, the goal met or not', () => {
    const dayMap = new Map([['2026-10-19', 1], ['2026-10-17', 1]]);
    const [r] = mosaic([{ sport: { id: 'x' }, dayMap, goal: { count: 3, days: 7 } }], today, 7);
    expect(r.cells).toHaveLength(7);
    expect(r.cells.at(-1)).toEqual({ day: today, n: 1 });
    expect([r.times, r.met, r.active]).toEqual([2, false, true]);
    expect(goalOf({}, null, [{ count: 1, days: 7 }])).toEqual({ count: 1, days: 7 });
    expect(goalOf({}, { count: 2, days: 30 }, [{ count: 1, days: 7 }])).toEqual({ count: 2, days: 30 });
  });
});

describe('Paket O: helpers per sport', () => {
  it('#195 the wind tip, commuting km, loops by time', () => {
    expect(dirOf(270)).toBe('west');
    expect(dirOf(-10)).toBe('north');
    expect(windTip({ windDir: 225, gust: 45 })).toEqual({ from: 'south-west', gust: 45, strong: true });
    expect(windTip({})).toBe(null);
    const acts = [{ day: '2026-10-02', km: 12.4, commute: true }, { day: '2026-09-02', km: 12, commute: true }, { day: '2026-10-03', km: 50 }];
    expect(commuteKm(acts, today)).toEqual({ month: 12, year: 24, rides: 2 });
    const loops = [{ name: 'A', min: 45, order: 1 }, { name: 'B', min: 90, order: 2 }, { name: 'C', order: 3 }];
    expect(loopsFor(loops, 60).map((l) => l.name)).toEqual(['A', 'C']);
    expect(loopsFor(loops, 0).map((l) => l.name)).toEqual(['A', 'B', 'C']);
  });
  it('#197 care after uses, #200 the age of rope and harness', () => {
    expect(stepState({ every: 10, last: { uses: 5 } }, 15)).toEqual({ since: 10, left: 0, due: true, every: 10 });
    expect(stepState({ every: 1, last: { uses: 7 } }, 7).due).toBe(false);
    expect(ageState({ since: '2017-01-01', years: 10 }, today).state).toBe('soon');
    expect(ageState({ since: '2015-01-01', years: 10 }, today).state).toBe('old');
    expect(ageState({ since: '2024-01-01', years: 10 }, today).state).toBe('ok');
    expect(ageState({ since: null }, today)).toBe(null);
  });
  it('#65 matches and the drills that worked', () => {
    const ms = [{ day: '2026-05-01', won: true }, { day: '2026-06-01', won: false }, { day: '2025-06-01', won: true }, { day: '2026-07-01', won: null }];
    expect(matchStats(ms, 2026)).toEqual({ total: 3, won: 1, lost: 1 });
    const ls = [{ id: 'a', day: '2026-10-01', drills: [{ text: 'Slice', good: true }, { text: 'Lob' }] }, { id: 'b', day: '2026-10-08', drills: [{ text: 'slice', good: true }] }];
    expect(goodDrills(ls).map((d) => d.text)).toEqual(['slice']);
  });
  it('#192 fountains and gravel along a route', () => {
    expect(surfaceOf({ highway: 'track' })).toBe('gravel');
    expect(surfaceOf({ highway: 'residential', surface: 'gravel' })).toBe('gravel');
    expect(surfaceOf({ highway: 'secondary' })).toBe('paved');
    expect(surfaceOf({ highway: 'footway' })).toBe(null);
    // a straight route of about 2.2 km to the north; first half on a track, second half on a road
    const line = Array.from({ length: 21 }, (_, i) => [47 + i * 0.001, 8.5]);
    const osm = {
      elements: [
        { type: 'node', lat: 47.0101, lon: 8.5005, tags: { amenity: 'drinking_water' } },
        { type: 'way', tags: { highway: 'track' }, geometry: [{ lat: 47, lon: 8.5 }, { lat: 47.01, lon: 8.5 }] },
        { type: 'way', tags: { highway: 'tertiary' }, geometry: [{ lat: 47.01, lon: 8.5 }, { lat: 47.02, lon: 8.5 }] },
      ],
    };
    const r = analyseRoute(line, osm);
    expect(r.km).toBeCloseTo(2.2, 1);
    expect(r.water).toHaveLength(1);
    expect(r.water[0].km).toBeCloseTo(1.1, 1);
    expect(r.share).toBe(50);
    expect(longestDry(r)).toBeCloseTo(1.1, 1);
    expect(overpassQuery(line)).toContain('drinking_water');
  });
  it('#218 the functions per sport exist in «Was die App kann»', () => {
    for (const s of [{ id: 'trip:gravel', kind: 'trip', bike: true }, { id: 'trip:ski', kind: 'trip' }, { id: 'act:gym', kind: 'act' }, { id: 'act:meditation', kind: 'act' }, { id: 'trip:own-x', kind: 'trip' }]) {
      const ids = featuresFor(s);
      expect(ids.length).toBeGreaterThan(2);
      for (const id of ids) expect(FEATURE[id], id).toBeTruthy();
    }
  });
});
