import { describe, it, expect } from 'vitest';
import { blockRows, wetTrip, PACK_BLOCKS } from '../src/lib/packblocks.js';
import { NIGHT_SETS } from '../src/lib/trips.js';

// v0.122.0 «Neue Tour Teil 2», B4 «Bausteine beim Packen»: fictional items only.
const item = (id, sets, weightG = 100, extra = {}) => ({ id, name: `test_data_gtp_ ${id}`, weightG, category: 'tools', ownership: 'owned', sets, ...extra });
const SETS = [{ key: 'u-regen', name: 'test_data_gtp_ Regen' }, { key: 'u-kit', name: 'test_data_gtp_ Kit', minC: 0, maxC: 8 }];
const ITEMS = [
  item('r1', ['repair'], 110), item('r2', ['repair'], null),
  item('c1', ['charge'], 200),
  item('l1', ['lights'], 70),
  item('h1', ['hygiene'], 50),
  item('k1', ['comfort'], 50),
  item('g1', ['u-regen'], 260), item('g2', ['u-regen'], 180),
  item('x1', ['u-kit'], 300),
];
const trip = (extra = {}) => ({ id: 't', overnight: 'none', sets: { charge: false }, entries: [], ...extra });

describe('Bausteine beim Packen (B4)', () => {
  it('the built-in blocks of the old switches, then food and hygiene', () => {
    expect(PACK_BLOCKS).toEqual([...NIGHT_SETS.map((s) => s.key), 'food', 'hygiene']);
  });
  it('«Dabei» is what the trip brings or switched on; the rest «Dazunehmen»; only blocks with items, no kits, no Comfort', () => {
    const r = blockRows(trip(), ITEMS, SETS);
    expect(r.on.map((x) => x.key)).toEqual(['repair']); // repair comes on every ride, charge was taken off
    expect(r.add.map((x) => x.key)).toEqual(['lights', 'charge', 'hygiene', 'u-regen']);
    const rep = r.on[0];
    expect(rep).toMatchObject({ n: 2, g: 110, missing: 1, on: true, suggest: null });
    expect(r.add.find((x) => x.key === 'u-regen').name).toBe('test_data_gtp_ Regen');
  });
  it('switched on by hand is «Dabei»', () => {
    const r = blockRows(trip({ sets: { charge: false, hygiene: true } }), ITEMS, SETS);
    expect(r.on.map((x) => x.key)).toContain('hygiene');
  });
  it('a wet trip suggests the own rain block first, with the chance when known', () => {
    const r = blockRows(trip({ wx: { min: 6, max: 14, rain: 'showers', rainPct: 30 } }), ITEMS, SETS);
    expect(r.add[0]).toMatchObject({ key: 'u-regen', suggest: { kind: 'rain', pct: 30 } });
    expect(blockRows(trip({ wx: { min: 6, max: 14, rain: 'rain' } }), ITEMS, SETS).add[0].suggest).toEqual({ kind: 'rain', pct: null });
    expect(blockRows(trip({ wx: { min: 6, max: 14, rain: 'none' } }), ITEMS, SETS).add.every((x) => !x.suggest)).toBe(true);
    expect(wetTrip({ wx: { rain: 'none', rainPct: 10 } })).toBe(false);
  });
  it('a Repair of more than 8 parts that is off is a suggestion to slim it (B5)', () => {
    const many = [...ITEMS, ...Array.from({ length: 8 }, (_, n) => item(`m${n}`, ['repair'], 10))];
    const r = blockRows(trip({ sets: { repair: false, charge: false } }), many, SETS);
    expect(r.add[0]).toMatchObject({ key: 'repair', suggest: { kind: 'slim', n: 10 } });
  });
  it('no trip, no rows', () => {
    expect(blockRows(null, ITEMS, SETS)).toEqual({ on: [], add: [] });
  });
});
