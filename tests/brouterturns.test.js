// Abbiege-Hinweise vom Router (Noah 23.11.2026 «2a»): brouter.de voicehints → the turns of the live map.
import { describe, it, expect } from 'vitest';
import { hintsOf, turnsFromHints } from '../src/lib/live/brouterturns.js';
import { parseBrouter, returnDetour } from '../src/lib/reroute.js';
import { turnText, turnListText, turnSay, TURN_KEYS } from '../src/lib/live/turns.js';
import de from '../src/lib/i18n/de/index.js';

// the answer of a real request (fictional place): [index, command, exit, metres to the next, angle]
const VH = [[2, 4, 0, 64, -129], [4, 2, 0, 886, -70], [35, 3, 0, 1367, -36], [70, 1, 0, 72, -3], [86, 13, 1, 1979, -107], [178, 14, 2, 596, 120], [221, 6, 0, 40, 41], [230, 12, 0, 5, 0], [233, 16, 0, 5, 0]];

describe('hintsOf', () => {
  it('maps the commands: turns, slight, sharp, roundabouts; straight on, off route and beeline give no hint', () => {
    const h = hintsOf(VH);
    expect(h.map((x) => x.dir)).toEqual(['sharp-left', 'left', 'slight-left', 'roundabout', 'roundabout', 'slight-right']);
    expect(h.find((x) => x.i === 86)).toEqual({ i: 86, dir: 'roundabout', deg: 107, exit: 1 });
    expect(h.find((x) => x.i === 178).exit).toBe(2);
  });
  it('keep and exit hints are slight turns, every kind of U-turn is one', () => {
    expect(hintsOf([[1, 8, 0, 9, -10], [2, 9, 0, 9, 10], [3, 17, 0, 9, -20], [4, 18, 0, 9, 20], [5, 10, 0, 9, -170], [6, 11, 0, 9, 170], [7, 15, 0, 9, 180]]).map((x) => x.dir)).toEqual(['slight-left', 'slight-right', 'slight-left', 'slight-right', 'u-turn', 'u-turn', 'u-turn']);
  });
  it('a roundabout without a sensible exit gives no hint; a wild angle becomes 90', () => {
    expect(hintsOf([[1, 13, 0, 9, 50], [2, 13, 99, 9, 50]])).toEqual([]);
    expect(hintsOf([[1, 2, 0, 9, 2147483647]])[0].deg).toBe(90);
  });
  it('is undefined without the list (then the shape of the line is used) and follows the kept points', () => {
    expect(hintsOf(undefined)).toBeUndefined();
    expect(hintsOf([[5, 2, 0, 9, -80], [1, 2, 0, 9, -80]], new Map([[5, 3]])).map((x) => x.i)).toEqual([3]);
  });
});

describe('turnsFromHints', () => {
  const pts = Array.from({ length: 10 }, (_, i) => ({ lat: 47 + i * 1e-4, lon: 8, km: i * 0.1 }));
  it('gives km, place and exit, in km order', () => {
    const t = turnsFromHints([{ i: 6, dir: 'roundabout', deg: 100, exit: 2 }, { i: 3, dir: 'left', deg: 80 }], pts);
    expect(t.map((x) => x.km)).toEqual([0.3, 0.6]);
    expect(t[1]).toEqual({ km: 0.6, dir: 'roundabout', deg: 100, lat: 47.0006, lon: 8, exit: 2 });
  });
  it('skips a hint outside the line and a second one on the same spot', () => {
    expect(turnsFromHints([{ i: 99, dir: 'left', deg: 80 }], pts)).toEqual([]);
    expect(turnsFromHints([{ i: 3, dir: 'left', deg: 80 }, { i: 3, dir: 'right', deg: 80 }], pts)).toHaveLength(1);
  });
});

describe('parseBrouter with hints', () => {
  const geo = (coords, props = {}) => ({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: props, geometry: { type: 'LineString', coordinates: coords } }] });
  it('carries the hints along, pointing at the kept line', () => {
    const coords = [[8, 47, 400], [8.001, 47, 401], [8.002, 47, 402], [8.003, 47, 403]];
    expect(parseBrouter(geo(coords, { voicehints: [[2, 2, 0, 50, -80]] })).hints).toEqual([{ i: 2, dir: 'left', deg: 80 }]);
    const withBad = [[8, 47, 400], ['x', 47], [8.002, 47, 402], [8.003, 47, 403]];
    expect(parseBrouter(geo(withBad, { voicehints: [[2, 2, 0, 50, -80]] })).hints[0].i).toBe(1);
  });
  it('has no hints without the list, and a way back keeps them', () => {
    expect(parseBrouter(geo([[8, 47], [8.01, 47]])).hints).toBeUndefined();
    const hints = [{ i: 1, dir: 'left', deg: 80 }];
    expect(returnDetour({ line: [[47, 8], [47, 8.01]], km: 1, rejoin: { km: 3, lat: 47, lon: 8.01 }, hints }).hints).toEqual(hints);
    expect(returnDetour({ line: [[47, 8], [47, 8.01]], km: 1, rejoin: { km: 3, lat: 47, lon: 8.01 } }).hints).toBeUndefined();
  });
});

describe('the roundabout text', () => {
  const r = { km: 1, dir: 'roundabout', exit: 2 };
  it('says the exit, far and near, and in the list', () => {
    expect(turnText(r, 200)).toEqual({ key: 'In {m} m roundabout: take exit {n}', vars: { m: 200, n: 2 } });
    expect(turnText(r, 20)).toEqual({ key: 'Roundabout: take exit {n} now', vars: { n: 2 } });
    expect(turnListText(r)).toEqual({ key: 'Roundabout: take exit {n}', vars: { n: 2 } });
    expect(turnSay(r, 200, new Set()).key).toBe('In {m} m roundabout: take exit {n}');
  });
  it('has German texts', () => {
    for (const k of TURN_KEYS) expect(de[k], k).toBeTruthy();
  });
});
