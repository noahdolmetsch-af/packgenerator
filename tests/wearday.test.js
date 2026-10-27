// «Was ziehe ich an? selbst anpassen» step 1 (Noah 27.10.2026): the day choice, swap options, gap reasons.
// Fictional data only.
import { describe, it, expect } from 'vitest';
import { ONION, outfitFor } from '../src/lib/wardrobe.js';
import { WEAR_DAY, NONE, WHY_LIMITS, dayChoice, dayRecord, isChanged, withPick, withoutPick, withAdd, withoutAdd, applyDay, addableRows, swapOptions, gapReason, fitOf } from '../src/lib/home/wearday.js';

const P = 'test_data_gtp_';
const item = (id, name, f = {}) => ({ id, name: `${P}${name}`, category: 'onbike', weightG: 100, qty: 1, ownership: 'owned', sets: [], domains: ['bikepacking'], ...f });
const ITEMS = [
  item('B1', 'Base sleeveless', { layer: 'base', zone: 'torso', tempMin: 5, tempMax: 25 }),
  item('M1', 'Long jersey thin', { layer: 'mid', zone: 'torso', tempMin: 10, tempMax: 18 }),
  item('M2', 'Long jersey thick', { layer: 'mid', zone: 'torso', tempMin: 2, tempMax: 12 }),
  item('O1', 'Wind vest', { layer: 'outer', zone: 'torso', tempMin: 0, tempMax: 14 }),
  item('L1', 'Bib long', { layer: 'base', zone: 'legs', tempMin: 0, tempMax: 12 }),
  item('H1', 'Gloves short', { layer: 'accessory', zone: 'hands', tempMin: 15 }),
  item('H2', 'Gloves long thin', { name: `${P}Handschuhe lang` }),
  item('K1', 'Headband', { layer: 'accessory', zone: 'head', tempMin: 0, tempMax: 10 }),
  item('E1', 'Office shirt', { layer: 'base', zone: 'torso', domains: ['everyday'] }),
];
const DATE = '2026-10-27';
const FC = { days: [{ date: DATE, min: 8, max: 16, hourly: { t: Array.from({ length: 24 }, (_, h) => (h < 10 ? 8 : 14)), p: Array(24).fill(0) } }] };
const OUT = outfitFor(FC, ITEMS, { date: DATE, start: 8, hours: 2 });

describe('the rule in words', () => {
  it('WHY_LIMITS match the onion rows', () => {
    for (const [key, n] of Object.entries(WHY_LIMITS)) {
      const row = ONION.find((r) => r.key === key);
      expect(row.need(n - 0.5, false)).toBe(true);
      expect(row.need(n, false)).toBe(false);
    }
  });
});

describe('day choice', () => {
  it('holds only for its date', () => {
    const rec = dayRecord(DATE, { pick: { mid: 'M2' }, add: ['head'] });
    expect(rec.key).toBe(WEAR_DAY);
    expect(dayChoice(rec, DATE)).toEqual({ pick: { mid: 'M2' }, add: ['head'] });
    expect(dayChoice(rec, '2026-10-28')).toEqual({ pick: {}, add: [] });
    expect(dayChoice(null, DATE)).toEqual({ pick: {}, add: [] });
  });
  it('changes are pure', () => {
    const c0 = { pick: {}, add: [] };
    const c1 = withAdd(withPick(c0, 'mid', 'M2'), 'head');
    expect(c0).toEqual({ pick: {}, add: [] });
    expect(isChanged(c0)).toBe(false);
    expect(isChanged(c1)).toBe(true);
    expect(withoutPick(c1, 'mid')).toEqual({ pick: {}, add: ['head'] });
    expect(withoutAdd(withPick(c1, 'head', 'K1'), 'head')).toEqual({ pick: { mid: 'M2' }, add: [] });
  });
});

describe('applyDay', () => {
  it('the app picks the piece made for that temperature; a gap at the hands', () => {
    expect(OUT.c).toBe(8);
    expect(OUT.rows.map((r) => r.key)).toEqual(['base', 'mid', 'outer', 'legs', 'hands']);
    expect(OUT.rows.find((r) => r.key === 'mid').item.id).toBe('M2');
    expect(OUT.rows.find((r) => r.key === 'hands').item).toBeNull();
  });
  it('a pick replaces, none leaves out, an added row gets a piece', () => {
    const d = applyDay(OUT, ITEMS, { pick: { mid: 'M1', outer: NONE }, add: ['head'] });
    const by = (k) => d.rows.find((r) => r.key === k);
    expect(by('mid')).toMatchObject({ mine: true, none: false });
    expect(by('mid').item.id).toBe('M1');
    expect(by('outer')).toMatchObject({ item: null, none: true, mine: true });
    expect(by('head')).toMatchObject({ added: true, mine: true });
    expect(by('head').item.id).toBe('K1');
    expect(by('base').mine).toBe(false);
    expect(d.rows.map((r) => r.key)).toEqual(['base', 'mid', 'outer', 'legs', 'hands', 'head']);
  });
  it('an unknown or gone piece is ignored', () => {
    const d = applyDay(OUT, [...ITEMS, item('G1', 'Gone', { layer: 'mid', zone: 'torso', ownership: 'gone' })], { pick: { mid: 'G1', base: 'XX' }, add: [] });
    expect(d.rows.find((r) => r.key === 'mid').item.id).toBe('M2');
    expect(d.rows.find((r) => r.key === 'base').item.id).toBe('B1');
  });
  it('addable rows are the ones not needed yet', () => {
    expect(addableRows(OUT).map((r) => r.key)).toEqual(['head', 'feet']);
    expect(addableRows(OUT, { pick: {}, add: ['head'] }).map((r) => r.key)).toEqual(['feet']);
  });
});

describe('swap and gaps', () => {
  it('swap options: the app choice first, too light last, never everyday-only', () => {
    const ops = swapOptions('mid', ITEMS, 8);
    expect(ops.map((o) => o.item.id)).toEqual(['M2', 'M1']);
    expect(swapOptions('hands', ITEMS, 8)).toEqual([{ item: ITEMS[5], fit: 'light' }]);
    expect(swapOptions('base', ITEMS, 8).map((o) => o.item.id)).toEqual(['B1']);
  });
  it('fitOf', () => {
    expect(fitOf(ITEMS[5], 8)).toBe('light');
    expect(fitOf(ITEMS[1], 8)).toBe('ok');
    expect(fitOf(item('W', 'Winter gloves', { tempMin: -10, tempMax: 5 }), 8)).toBe('warm');
  });
  it('gap reason: too light, with one more still to sort', () => {
    const g = gapReason('hands', ITEMS, 8);
    expect(g).toMatchObject({ kind: 'light', from: 15, unsorted: 1 });
    expect(g.warmest.id).toBe('H1');
  });
  it('gap reason: only unsorted pieces, or nothing', () => {
    const only = ITEMS.filter((i) => i.id !== 'H1');
    expect(gapReason('hands', only, 8)).toMatchObject({ kind: 'unsorted', unsorted: 1, warmest: null });
    expect(gapReason('feet', ITEMS, 4)).toMatchObject({ kind: 'none', unsorted: 0 });
  });
});
