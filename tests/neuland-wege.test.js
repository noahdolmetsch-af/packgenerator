// «Verschiedene Wege zum selben Ziel» (Entdecken und Sammeln, Idee 3, Noah 04.11.2026 «3a 4b»): from which side
// you came and with which sport. Fictional pass and lines.
import { describe, it, expect } from 'vitest';
import { bearing, sideOfBearing, approachSide, waysOf, sidesOf, sportsOf, SIDES } from '../src/lib/neuland/wege.js';
import { nearestOnLine } from '../src/lib/neuland/beleg.js';
import { tracksOf } from '../src/lib/neuland/neuland.js';

const PASS = { id: 'p-testpass', name: 'Testpass', lat: 46.87, lon: 8.85 };
const at = [PASS.lat, PASS.lon];
// 0.01° of latitude is about 1.11 km; 0.01° of longitude here about 0.76 km
const fromWest = [[46.87, 8.7], [46.87, 8.78], [46.8702, 8.85], [46.87, 8.9], [46.87, 8.95]];
const fromEast = [...fromWest].reverse();
const fromSouth = [[46.75, 8.85], [46.8, 8.8501], [46.8702, 8.85], [46.9, 8.85], [46.95, 8.85]];

describe('sides (wege.js)', () => {
  it('names the side of a bearing', () => {
    expect(SIDES).toEqual(['N', 'E', 'S', 'W']);
    expect(sideOfBearing(0)).toBe('N');
    expect(sideOfBearing(44)).toBe('N');
    expect(sideOfBearing(46)).toBe('E');
    expect(sideOfBearing(180)).toBe('S');
    expect(sideOfBearing(271)).toBe('W');
    expect(sideOfBearing(359)).toBe('N');
    expect(Math.round(bearing(at, [46.9, 8.85]))).toBe(0);
    expect(Math.round(bearing(at, [46.87, 8.9]))).toBe(90);
  });

  it('the side is where the line came from, not where it went', () => {
    expect(approachSide(at, fromWest, nearestOnLine(at, fromWest))).toBe('W');
    expect(approachSide(at, fromEast, nearestOnLine(at, fromEast))).toBe('E');
    expect(approachSide(at, fromSouth, nearestOnLine(at, fromSouth))).toBe('S');
  });

  it('no side for a start here, a loop or a line of two points', () => {
    const startHere = [[46.8702, 8.855], [46.87, 8.9], [46.87, 8.95]];
    expect(approachSide(at, startHere, nearestOnLine(at, startHere))).toBeNull();
    const loop = [[46.871, 8.851], [46.88, 8.86], [46.872, 8.852], [46.8701, 8.8501], [46.9, 8.9]];
    expect(approachSide(at, loop, nearestOnLine(at, loop))).toBeNull();
    const two = [[46.87, 8.7], [46.87, 9.0]];
    expect(approachSide(at, two, nearestOnLine(at, two))).toBeNull();
    expect(approachSide(at, fromWest, null)).toBeNull();
  });
});

describe('ways here (wege.js)', () => {
  const tracks = tracksOf({
    rides: [{ id: 'r1', date: '2026-06-01', line: fromWest }],
    activities: [
      { id: 'a1', day: '2026-07-05', type: 'GravelRide', line: fromEast },
      { id: 'a2', day: '2026-08-09', type: 'Hike', line: fromSouth },
      { id: 'a3', day: '2026-08-20', type: 'Ride', line: [[47.5, 9.5], [47.6, 9.6], [47.7, 9.7]] }, // far away
    ],
    trips: [{ id: 't1', startDate: '2026-07-05', route: { line: fromEast } }], // the same day as the Strava ride
    today: '2026-10-19',
  });

  it('lists the days a line passed, newest first, one per day', () => {
    const ways = waysOf(PASS, 0.6, tracks);
    expect(ways.map((w) => w.day)).toEqual(['2026-08-09', '2026-07-05', '2026-06-01']);
    expect(ways.map((w) => w.side)).toEqual(['S', 'E', 'W']);
    expect(ways[1].type).toBe('GravelRide'); // the Strava ride wins over the trip route of the same day
    expect(ways[2]).toMatchObject({ type: 'Ride', src: 'ride', rideId: 'r1' });
    expect(ways.every((w) => w.distM < 600)).toBe(true);
  });

  it('a place without a position or a line far away has no ways', () => {
    expect(waysOf({ name: 'Canton' }, 0.6, tracks)).toEqual([]);
    expect(waysOf({ lat: 40, lon: 5 }, 0.6, tracks)).toEqual([]);
    expect(waysOf(PASS, 0.6, [])).toEqual([]);
  });

  it('sorts by side and names the sides not tried yet', () => {
    const s = sidesOf(waysOf(PASS, 0.6, tracks));
    expect(s.rows.map((r) => r.side)).toEqual(['E', 'S', 'W']);
    expect(s.rows[0]).toMatchObject({ n: 1, last: '2026-07-05' });
    expect(s.missing).toEqual(['N']);
    expect(s.unknown).toBe(0);
    expect(sidesOf([]).missing).toEqual([]); // no known side: nothing to name
    expect(sidesOf([{ day: '2026-01-01', side: null }])).toMatchObject({ unknown: 1, missing: [], total: 1 });
  });

  it('counts the sports; a trip route with no sport is left out', () => {
    const sports = sportsOf(waysOf(PASS, 0.6, tracks));
    expect(sports.map((x) => x.key).sort()).toEqual(['Gravel ride', 'Hike|kind', 'Ride']);
    expect(sports.every((x) => x.n === 1)).toBe(true);
    const twice = sportsOf([{ type: 'Ride' }, { type: 'Ride' }, { type: 'Hike' }, { type: 'Kitesurf' }]);
    expect(twice[0]).toEqual({ key: 'Ride', n: 2 });
    expect(twice.map((x) => x.key)).toContain('Other|kind');
    expect(sportsOf([{ day: 'x', type: null }])).toEqual([]);
  });
});
