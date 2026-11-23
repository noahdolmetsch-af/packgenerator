// «Abendblick» (Noah 23.11.2026 «G2»): the marks of the evening. Fictional data only.
import { describe, it, expect } from 'vitest';
import { abendRows, abendSummary, abendShows, NEXT_MARK } from '../src/lib/unterwegs/abendblick.js';
import { markItems } from '../src/lib/touren/tourgear.js';

const item = (id, extra = {}) => ({ id, name: id.toUpperCase(), ownership: 'owned', category: 'tools', weightG: 100, ...extra });
const items = [item('a'), item('b', { weightG: 250 }), item('c', { weightG: null }), item('d'), item('f', { category: 'food' })];
const trip = { id: 't', entries: [{ itemId: 'a', qty: 1 }, { itemId: 'b', qty: 2 }, { itemId: 'c', qty: 1 }, { itemId: 'd', qty: 1 }, { itemId: 'f', qty: 1 }] };

describe('Abendblick rows', () => {
  it('lists the gear without food, before a debrief exists everything counts as used', () => {
    const rows = abendRows(trip, null, items);
    expect(rows.map((r) => r.id).sort()).toEqual(['a', 'b', 'c', 'd']);
    expect(rows.every((r) => r.mark === 'used')).toBe(true);
  });

  it('puts the marked ones first and weighs all pieces', () => {
    const debrief = { items: { b: 'unused', d: 'broken' } };
    const rows = abendRows(trip, debrief, items);
    expect(rows.slice(0, 2).map((r) => r.id)).toEqual(['b', 'd']);
    expect(rows[0]).toMatchObject({ id: 'b', mark: 'unused', qty: 2, g: 500 });
    expect(rows.find((r) => r.id === 'c').g).toBeNull();
  });

  it('adds up what was not used so far, and counts the unweighed ones apart', () => {
    const debrief = { items: { b: 'unused', c: 'unused', d: 'broken' } };
    expect(abendSummary(abendRows(trip, debrief, items))).toEqual({ unused: 2, broken: 1, g: 500, unweighed: 1 });
    expect(abendSummary(abendRows(trip, null, items))).toEqual({ unused: 0, broken: 0, g: 0, unweighed: 0 });
  });

  it('the cycle of taps ends where it began, and writes the same marks as the debrief', () => {
    let m = 'used';
    const seen = [];
    let items2 = {};
    for (let i = 0; i < 3; i++) {
      m = NEXT_MARK[m];
      seen.push(m);
      items2 = markItems(items2, 'a', m);
    }
    expect(seen).toEqual(['unused', 'broken', 'used']);
    expect(items2).toEqual({}); // used = no entry
  });

  it('shows only where the evening exists (a tour of several days) and the list has things', () => {
    expect(abendShows({ date: 'x' }, trip)).toBe(true);
    expect(abendShows(null, trip)).toBe(false);
    expect(abendShows({ date: 'x' }, { entries: [] })).toBe(false);
  });
});
