import { describe, it, expect } from 'vitest';
import { turnPlaces, withTurns, COURSE_ALL_MAX } from '../src/lib/live/garminturns.js';
import { toFit, coursePointsOf, pointsOf, COURSE_POINTS_MAX } from '../src/lib/unterwegs/umwandeln.js';
import { turnsOf } from '../src/lib/live/turns.js';

// Fictional route: 1.5 km east, then 1.5 km north (a right-angle turn to the left), then east again
function line() {
  const pts = [];
  let lat = 47.0;
  let lon = 8.0;
  const step = 0.0001;
  for (let i = 0; i < 150; i++) pts.push([lat, (lon += step * 1.46)]);
  for (let i = 0; i < 150; i++) pts.push([(lat += step), lon]);
  for (let i = 0; i < 150; i++) pts.push([lat, (lon += step * 1.46)]);
  return pts;
}
const withKm = (l) => {
  let k = 0;
  return l.map((p, i) => {
    if (i) k += Math.hypot((p[0] - l[i - 1][0]) * 111.2, (p[1] - l[i - 1][1]) * 111.2 * Math.cos((p[0] * Math.PI) / 180));
    return { lat: p[0], lon: p[1], km: k };
  });
};

describe('Abbiegepunkte für den Garmin', () => {
  it('turns of a line become places with the kind the Edge knows', () => {
    const turns = turnsOf(withKm(line()));
    expect(turns.length).toBeGreaterThanOrEqual(2);
    const places = turnPlaces(turns, (k) => k);
    expect(places[0].kind).toBe('left');
    expect(places[1].kind).toBe('right');
    expect(places[0].name).toBe('Turn left');
  });

  it('a series of bends and a roundabout have no FIT type and are left out', () => {
    const ok = { km: 1, dir: 'right', deg: 90, lat: 47, lon: 8 };
    const out = turnPlaces([{ km: 0.5, dir: 'bends', deg: 100, lat: 47, lon: 8, n: 4, toKm: 0.9 }, { km: 0.7, dir: 'roundabout', deg: 90, lat: 47, lon: 8, exit: 2 }, ok]);
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe('right');
  });

  it('places come first; too many turns cut the gentlest ones', () => {
    const places = Array.from({ length: 10 }, (_, i) => ({ lat: 47, lon: 8 + i / 1000, kind: 'water', name: `w${i}` }));
    const many = Array.from({ length: 300 }, (_, i) => ({ lat: 47, lon: 8 + i / 1000, kind: 'left', name: 'L', deg: 40 + (i % 100), km: i / 10 }));
    const r = withTurns(places, many);
    expect(r.places).toHaveLength(COURSE_ALL_MAX);
    expect(r.turns).toBe(COURSE_ALL_MAX - 10);
    expect(r.cut).toBe(300 - r.turns);
    expect(r.places.slice(0, 10).every((p) => p.kind === 'water')).toBe(true);
    // the gentlest (deg 40) are the ones left out
    expect(Math.min(...r.places.slice(10).map((p) => p.deg))).toBeGreaterThanOrEqual(40);
    expect(withTurns(places, []).cut).toBe(0);
  });

  it('places over the place limit are cut to it', () => {
    const places = Array.from({ length: COURSE_POINTS_MAX + 20 }, (_, i) => ({ lat: 47, lon: 8, kind: 'water', name: `w${i}` }));
    expect(withTurns(places, []).places).toHaveLength(COURSE_POINTS_MAX);
  });

  it('toFit writes the turns as course points of their own types', () => {
    const l = line();
    const turns = turnPlaces(turnsOf(withKm(l)), (k) => k);
    const pts = pointsOf({ line: l });
    const cps = coursePointsOf(pts, turns, { max: COURSE_ALL_MAX });
    expect(cps.map((c) => c.type)).toEqual([6, 7]); // left, right
    const bytes = toFit(pts, 'Test', { coursePoints: turns, coursePointsMax: COURSE_ALL_MAX });
    expect(bytes.length).toBeGreaterThan(toFit(pts, 'Test').length);
  });
});
