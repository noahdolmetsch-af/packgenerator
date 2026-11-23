// «Anprobe» (Weg A): tryOn, stepPick, packEntries (src/lib/wardrobe-tryon.js)
import { describe, it, expect } from 'vitest';
import { tryOn, stepPick, packEntries, clampTemp, TRY_MIN, TRY_MAX } from '../src/lib/wardrobe-tryon.js';

const cloth = (id, name, f = {}) => ({ id, name, category: 'onbike', weightG: 100, qty: 1, ownership: 'owned', domains: ['bikepacking'], layer: 'mid', zone: 'torso', ...f });
const ITEMS = [
  cloth('A1', 'Merino', { layer: 'base', tempMin: 0, tempMax: 15, weightG: 180 }),
  cloth('A2', 'Windweste', { layer: 'mid', tempMin: 5, tempMax: 18, weightG: 90 }),
  cloth('A3', 'Fleece', { layer: 'mid', tempMin: -5, tempMax: 10, weightG: 300 }),
  cloth('A4', 'Regenjacke', { layer: 'outer', tempMin: -2, tempMax: 18, weightG: 240, rain: 'yes' }),
  cloth('A5', 'Beinlinge', { layer: 'mid', zone: 'legs', tempMin: 5, tempMax: 15, weightG: 110 }),
  cloth('A6', 'Handschuhe dünn', { layer: 'accessory', zone: 'hands', tempMin: 8, tempMax: 18, weightG: 35 }),
];

describe('tryOn', () => {
  it('one row per place the onion needs, one piece each, gaps with a reason', () => {
    const r = tryOn(ITEMS, 5);
    const keys = r.rows.map((x) => x.key);
    expect(keys).toEqual(expect.arrayContaining(['base', 'mid', 'outer', 'legs', 'hands']));
    const hands = r.rows.find((x) => x.key === 'hands');
    expect(hands.item).toBeNull(); // the glove is made for 8 °C and warmer
    expect(hands.gap.kind).toBe('light');
    expect(r.gaps).toBeGreaterThanOrEqual(1);
    expect(r.rows.find((x) => x.key === 'base').item.id).toBe('A1');
    expect(r.count + r.gaps).toBe(r.rows.length);
  });
  it('the felt temperature takes the offset', () => {
    expect(tryOn(ITEMS, 5, { offset: 2 }).c).toBe(3);
    expect(tryOn(ITEMS, 5, { offset: 2 }).real).toBe(5);
  });
  it('a warm day needs fewer rows', () => {
    const warm = tryOn(ITEMS, 22);
    expect(warm.rows.map((x) => x.key)).not.toContain('hands');
    expect(warm.rows.length).toBeLessThan(tryOn(ITEMS, 5).rows.length);
  });
  it('rain makes the outer layer a rain jacket', () => {
    expect(tryOn(ITEMS, 14, { wet: true }).rows.find((x) => x.key === 'outer').item.id).toBe('A4');
  });
  it('a pick replaces the piece; an unknown pick is ignored', () => {
    const mid = (p) => tryOn(ITEMS, 5, { picks: p }).rows.find((x) => x.key === 'mid');
    expect(mid({ mid: 'A3' }).item.id).toBe('A3');
    expect(mid({ mid: 'A3' }).auto).toBe(false);
    expect(mid({ mid: 'nope' }).auto).toBe(true);
  });
  it('the weight is the sum of the pieces shown', () => {
    const r = tryOn(ITEMS, 5);
    expect(r.weightG).toBe(r.rows.reduce((s, x) => s + (x.item?.weightG ?? 0), 0));
  });
  it('clothing that is gone or on the wishlist does not count', () => {
    const r = tryOn(ITEMS.map((i) => (i.id === 'A1' ? { ...i, ownership: 'gone' } : i)), 5);
    expect(r.rows.find((x) => x.key === 'base').item).toBeNull();
  });
});

describe('stepPick', () => {
  it('goes round the pieces of a place', () => {
    const r = tryOn(ITEMS, 5).rows.find((x) => x.key === 'mid');
    expect(r.options.length).toBeGreaterThan(1);
    const next = stepPick(r, 1);
    expect(next).not.toBe(r.item.id);
    const back = stepPick({ ...r, options: r.options, index: r.options.findIndex((o) => o.item.id === next) }, -1);
    expect(back).toBe(r.item.id);
  });
  it('nothing to swap to with one piece', () => {
    const r = tryOn(ITEMS, 5).rows.find((x) => x.key === 'base');
    expect(r.options).toHaveLength(1);
    expect(stepPick(r, 1)).toBeNull();
  });
  it('a gap row can still take its first piece', () => {
    const r = tryOn(ITEMS, 5).rows.find((x) => x.key === 'hands');
    expect(r.index).toBe(-1);
    expect(stepPick(r, 1)).toBe('A6');
  });
});

describe('packEntries', () => {
  it('adds only what is not on the list yet, worn, once', () => {
    const trip = { entries: [{ itemId: 'A1', slot: 'body', qty: 1, packed: true }] };
    const rows = tryOn(ITEMS, 5).rows;
    const r = packEntries(trip, rows);
    expect(r.ids).not.toContain('A1');
    expect(new Set(r.ids).size).toBe(r.ids.length);
    expect(r.entries.slice(0, 1)).toEqual(trip.entries);
    expect(r.entries.slice(1).every((e) => e.slot === 'body' && e.packed === false && e.qty === 1)).toBe(true);
  });
  it('nothing new: the same entries', () => {
    const rows = tryOn(ITEMS, 5).rows;
    const trip = { entries: rows.filter((x) => x.item).map((x) => ({ itemId: x.item.id, slot: 'body', qty: 1 })) };
    expect(packEntries(trip, rows).ids).toEqual([]);
  });
});

describe('clampTemp', () => {
  it('stays inside the slider', () => {
    expect(clampTemp(100)).toBe(TRY_MAX);
    expect(clampTemp(-100)).toBe(TRY_MIN);
    expect(clampTemp('7.4')).toBe(7);
    expect(clampTemp('x')).toBeNull();
  });
});
