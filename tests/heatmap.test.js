// «Heatmap» (Noah 20.10.2026 «1a+b 2b+a 3 alle Fahrten von Strava 4a 5a»): all rides on one map.
import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { createDb } from '../src/lib/db.js';
import { encodePolyline } from '../src/lib/spur/polyline.js';
import { merc } from '../src/lib/spur/mapmath.js';
import { heatLines, heatKind, heatChoices, filterHeat, heatStats, linesNear, mercOf, boxOf, needLine, rampOf, mainBounds, ptsOf, HEAT_KINDS } from '../src/lib/heat/heat.js';
import { backfillLines, BACKFILL_KEY } from '../src/lib/heat/backfill.js';
import DE from '../src/lib/i18n/de/index.js';

// fictional lines around a lake
const A = [[47.0, 8.3], [47.01, 8.31], [47.02, 8.32]];
const B = [[47.1, 8.5], [47.11, 8.52]];
const enc = (pts) => encodePolyline(pts);

describe('which lines the heatmap draws', () => {
  it('knows the sport groups, ski tours included', () => {
    expect(heatKind('GravelRide')).toBe('bike');
    expect(heatKind('TrailRun')).toBe('run');
    expect(heatKind('Hike')).toBe('hike');
    expect(heatKind('BackcountrySki')).toBe('ski');
    expect(heatKind('Snowshoe')).toBe('ski');
    expect(heatKind('Swim')).toBe('other');
    for (const k of HEAT_KINDS) expect(DE[k.name], k.name).toBeTruthy();
  });

  it('reads encoded lines and pairs, and drops nonsense', () => {
    expect(ptsOf(enc(A))).toHaveLength(3);
    expect(ptsOf([{ lat: 47, lon: 8 }, [0, 0], [99, 8], [47.1, 8.1]])).toEqual([[47, 8], [47.1, 8.1]]);
    expect(ptsOf('')).toEqual([]);
  });

  it('takes every Strava sport, and GPX and recordings only on days without a Strava line', () => {
    const lines = heatLines({
      activities: [
        { id: '1', day: '2026-05-01', type: 'Ride', name: 'Morgenrunde', km: 30, line: enc(A), tripId: null },
        { id: '2', day: '2026-02-10', type: 'BackcountrySki', name: 'Skitour', km: 8, line: enc(B) },
        { id: '3', day: '2026-03-01', type: 'VirtualRide', trainer: true, line: enc(A) },
        { id: '4', day: '2026-12-01', type: 'Run', line: enc(A) }, // after today
        { id: '5', day: '2026-04-01', type: 'Run', line: null },
      ],
      rides: [
        { id: 'r1', date: '2026-05-01', line: A, km: 30 }, // same day as Strava: not twice
        { id: 'r2', date: '2025-08-01', line: B, km: 12, tripId: 'tr1' },
      ],
      tracks: [{ id: 'rec1', kind: 'rec', day: '2025-07-01', startAt: 0, pts: [[47, 8, 0], [47.01, 8.01, 30], [47.02, 8.02, 60]] }],
      entries: [{ id: 'e1', stravaId: '1', bikeId: 'b-gravel', state: 'counted' }],
      today: '2026-10-20',
    });
    expect(lines.map((l) => l.id)).toEqual(['a-1', 'a-2', 'r-r2', 't-rec1-0']);
    expect(lines[0]).toMatchObject({ kind: 'bike', bikeId: 'b-gravel', tour: false, year: '2026' });
    expect(lines[1].kind).toBe('ski');
    expect(lines[2]).toMatchObject({ src: 'gpx', tour: true, tripId: 'tr1' });
    expect(lines[3].src).toBe('rec');
    expect(lines[3].km).toBeGreaterThan(1);
  });
});

describe('filters and numbers', () => {
  const lines = heatLines({
    activities: [
      { id: '1', day: '2026-05-01', type: 'Ride', km: 30, line: enc(A), tripId: 't1' },
      { id: '2', day: '2026-05-02', type: 'Ride', km: 20, line: enc(A) },
      { id: '3', day: '2025-01-10', type: 'Run', km: 10, line: enc(B) },
    ],
    entries: [{ stravaId: '2', bikeId: 'b1', state: 'counted' }],
  });

  it('offers only what the data has', () => {
    expect(heatChoices(lines)).toEqual({ years: ['2026', '2025'], kinds: ['bike', 'run'], bikes: ['b1'] });
  });

  it('filters by year, sport, bike and tour or everyday', () => {
    expect(filterHeat(lines, { year: '2025' }).map((l) => l.id)).toEqual(['a-3']);
    expect(filterHeat(lines, { kind: 'bike' })).toHaveLength(2);
    expect(filterHeat(lines, { bike: 'b1' }).map((l) => l.id)).toEqual(['a-2']);
    expect(filterHeat(lines, { where: 'tour' }).map((l) => l.id)).toEqual(['a-1']);
    expect(filterHeat(lines, { where: 'everyday' })).toHaveLength(2);
    expect(filterHeat(lines, {})).toHaveLength(3);
  });

  it('counts rides, km, days and map squares; two rides on one road are one square set', () => {
    const s = heatStats(filterHeat(lines, { kind: 'bike' }));
    expect(s).toMatchObject({ n: 2, km: 50, days: 2 });
    expect(s.cells).toBe(heatStats([lines[0]]).cells);
    expect(heatStats([])).toEqual({ n: 0, km: 0, days: 0, cells: 0 });
  });

  it('finds the rides near a tapped point, newest first', () => {
    const prepared = lines.map((line) => {
      const m = mercOf(line.pts);
      return { line, m, box: boxOf(m) };
    });
    const p = merc([47.005, 8.305]);
    const near = linesNear(prepared, p, 0.00005);
    expect(near.map((l) => l.id)).toEqual(['a-2', 'a-1']);
    expect(linesNear(prepared, merc([46, 7]), 0.00005)).toEqual([]);
  });

  it('starts the view where most rides are, not on one ride far away', () => {
    const many = [...Array(19)].map((_, i) => ({ pts: A, id: `x${i}` })).concat([{ pts: [[64, -20], [64.1, -20.1]], id: 'far' }]);
    const b = mainBounds(many);
    expect(b.n).toBeLessThan(48);
    expect(b.w).toBeGreaterThan(8);
    expect(mainBounds([])).toBe(null);
  });

  it('colours from light to deep, clouds start see-through', () => {
    const l = rampOf('lines');
    const c = rampOf('clouds');
    expect(l.length).toBe(1024);
    expect(l[4 * 10 + 3]).toBeGreaterThan(200); // one ride is clearly visible
    expect(l[4 * 255]).toBeLessThan(l[4 * 10]); // many rides: darker red
    expect(c[3]).toBe(0);
  });
});

describe('older Strava rides get their line (5a)', () => {
  it('reads the list again, keeps only the lines, marks what has none', async () => {
    const db = createDb(`test-heat-${Math.random()}`);
    await db.activities.bulkPut([
      { id: '1', day: '2026-05-01', kind: 'bike', type: 'Ride', name: 'Mine', line: null },
      { id: '2', day: '2026-05-02', kind: 'bike', type: 'Ride', line: null },
      { id: '3', day: '2026-05-03', kind: 'bike', type: 'Ride', line: 'abc' },
      { id: '4', day: '2026-05-04', kind: 'bike', type: 'VirtualRide', trainer: true, line: null },
    ]);
    expect(needLine(await db.activities.toArray()).map((a) => a.id)).toEqual(['1', '2']);
    const calls = [];
    const call = async (step, { params }) => {
      calls.push([step, params.page]);
      if (params.page === '1') return { activities: [{ id: 1, name: 'Changed', line: enc(A) }, { id: 3, line: 'zzz' }], more: true };
      return { activities: [{ id: 2, line: null }], more: false };
    };
    const r = await backfillLines(db, call, { now: new Date('2026-10-20T10:00:00Z') });
    expect(r).toEqual({ got: 1, none: 2 });
    expect(calls).toEqual([['activities', '1'], ['activities', '2']]);
    const one = await db.activities.get('1');
    expect(one.line).toBe(enc(A));
    expect(one.name).toBe('Mine'); // nothing else changes
    expect((await db.activities.get('3')).line).toBe('abc');
    expect((await db.activities.get('2')).noLine).toBe(true);
    expect(needLine(await db.activities.toArray())).toEqual([]);
    expect((await db.settings.get(BACKFILL_KEY)).value).toEqual({ at: '2026-10-20T10:00:00.000Z', got: 1 });
  });
});
