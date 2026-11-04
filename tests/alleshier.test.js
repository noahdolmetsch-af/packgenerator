// «Alles hier» (Noah 03.11.2026 «1a»): the tile field on top of an area page, src/lib/alleshier.js.
import { describe, it, expect } from 'vitest';
import { ALL_HERE, allHereKey, tileOf, arrange, step, moveTo, setHidden } from '../src/lib/alleshier.js';

const ids = (xs) => xs.map((x) => x.id);
// a fictional bike for pages with a place holder (the bike folder: #/bikes?bike={bike}&sheet=…)
const V = { bike: 'test_data_gtp_bike' };

describe('alleshier', () => {
  it('every listed function has a fixed page, and no id twice', () => {
    for (const [area, list] of Object.entries(ALL_HERE)) {
      expect(new Set(list).size, area).toBe(list.length);
      for (const id of list) expect(tileOf(id, V), `${area}: ${id}`).not.toBeNull();
    }
  });

  it('keeps the first order without a saved state', () => {
    expect(ids(arrange('bikes', null, V).shown)).toEqual(ALL_HERE.bikes);
    expect(arrange('bikes', null, V).hidden).toEqual([]);
    expect(allHereKey('bikes')).toBe('alleshier.bikes');
  });

  it('moves with arrows and drag, unknown ids drop out, new ones go last', () => {
    const [a, b, c] = ALL_HERE.bikes;
    let s = step('bikes', null, b, -1);
    expect(ids(arrange('bikes', s, V).shown).slice(0, 2)).toEqual([b, a]);
    expect(step('bikes', s, b, -1)).toBe(s); // already first
    s = moveTo('bikes', null, 2, 0);
    expect(ids(arrange('bikes', s, V).shown).slice(0, 3)).toEqual([c, a, b]);
    const old = { order: ['gone', c], hidden: ['gone'] };
    const r = arrange('bikes', old, V);
    expect(r.shown[0].id).toBe(c);
    expect(r.shown).toHaveLength(ALL_HERE.bikes.length);
  });

  it('hides and shows a tile, keeping its place', () => {
    const [a, b] = ALL_HERE.bikes;
    let s = setHidden('bikes', null, a, true);
    let r = arrange('bikes', s, V);
    expect(ids(r.hidden)).toEqual([a]);
    expect(r.shown[0].id).toBe(b);
    s = setHidden('bikes', s, a, false);
    r = arrange('bikes', s, V);
    expect(r.hidden).toEqual([]);
    expect(r.shown[0].id).toBe(a);
  });

  it('fills the bike into the bike folder pages; without a bike the tile waits at its place', () => {
    expect(tileOf('f.theft', V).href).toBe('#/bikes?bike=test_data_gtp_bike&sheet=theft');
    expect(tileOf('f.theft')).toBeNull();
    const r = arrange('bikes', null);
    expect(ids(r.shown)).not.toContain('f.theft');
    expect(r.ids).toContain('f.theft');
    expect(r.ids).toEqual(ALL_HERE.bikes);
  });
});
