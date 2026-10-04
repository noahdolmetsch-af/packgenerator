import { describe, it, expect } from 'vitest';
import { itemUsage, tripRows, trend, deadWeight, wishReason } from '../src/lib/insights.js';

const items = [
  { id: 'A', name: 'Zip-off trousers', weightG: 280, ownership: 'owned', category: 'offbike' },
  { id: 'B', name: 'Rain jacket', weightG: 180, ownership: 'owned', category: 'rain' },
  { id: 'C', name: 'Towel', weightG: 40, ownership: 'owned', category: 'hyg' },
  { id: 'F', name: 'Gel', weightG: 60, ownership: 'owned', category: 'food' },
  { id: 'W', name: 'Overshoes', weightG: null, ownership: 'wishlist', category: 'rain', note: 'Missing on Hope (debrief).' },
];
const trip = (id, date, ids) => ({ id, title: id, startDate: date, days: 1, entries: ids.map((itemId) => ({ itemId, qty: 1 })) });
const trips = [trip('Hope', '2024-06-15', ['A', 'B', 'C', 'F']), trip('Alpen', '2025-09-06', ['A', 'B', 'F']), trip('303', '2026-10-15', ['A', 'B', 'C'])];
const debriefs = [
  { tripId: 'Hope', status: 'done', items: { A: 'unused', C: 'unused' }, missing: [{ name: 'Overshoes', itemId: null }], km: 366 },
  { tripId: 'Alpen', status: 'done', items: { A: 'unused' }, missing: [{ name: 'overshoes ', itemId: null }] },
  { tripId: '303', status: 'done', items: { A: 'unused', B: 'broken' }, missing: [] },
  { tripId: 'other', status: 'draft', items: {} },
];

describe('insights across debriefs (v0.19.2)', () => {
  it('counts taken, used, not used and broken per item', () => {
    const u = itemUsage(trips, debriefs);
    expect(u.A).toMatchObject({ taken: 3, used: 0, unused: 3 });
    expect(u.B).toMatchObject({ taken: 3, used: 3, broken: 1 });
    expect(u.C).toMatchObject({ taken: 2, used: 1, unused: 1 });
  });
  it('gives one row per trip, food left out, and a trend', () => {
    const rows = tripRows(trips, debriefs, items);
    expect(rows.map((r) => r.id)).toEqual(['Hope', 'Alpen', '303']);
    expect(rows[0]).toMatchObject({ packedG: 500, unusedG: 320, unusedN: 2, missingN: 1, km: 366 });
    expect(rows[2]).toMatchObject({ packedG: 500, unusedG: 280, brokenN: 1 });
    expect(trend(rows)).toMatchObject({ last: '303', packedDiffG: 20, unusedDiffG: -20, unusedShare: 56, n: 3 });
    expect(trend(rows.slice(0, 1))).toBe(null);
  });
  it('finds dead weight: taken twice or more, never used', () => {
    const d = deadWeight(items, itemUsage(trips, debriefs));
    expect(d.dead.map((r) => r.item.id)).toEqual(['A']);
    expect(d.deadG).toBe(280);
  });
  it('says why a wishlist item is there', () => {
    const r = wishReason(items[4], items, trips, debriefs);
    expect(r.reasons[0]).toBe('Missing 2× (Hope, Alpen)');
    expect(r.score).toBe(20);
  });
});

import { suggestions, applyDebrief } from '../src/lib/debrief.js';
describe('ride notes become learnings (v0.19.2)', () => {
  it('suggests each ride note and saves the ticked one', () => {
    const trip = { id: 't', title: '303', entries: [] };
    const d = { items: {}, missing: [], note: '', rideNotes: [{ at: 'x', day: 0, text: 'Cold hands from 19 h' }, { at: 'y', day: 0, text: ' ' }] };
    const s = suggestions(d, trip, [], [], [], []);
    expect(s.filter((x) => x.id.startsWith('ride:')).map((x) => x.label)).toEqual(['From the ride: "Cold hands from 19 h"']);
    const out = applyDebrief(d, trip, [], [{ id: 7, rule: 'old' }], [], ['ride:0'], { now: 'N' });
    expect(out.learnings).toEqual([expect.objectContaining({ id: 8, rule: 'Cold hands from 19 h', topic: 'Ride day', source: '303' })]);
  });
});

import { nextTrip, toDebrief } from '../src/lib/debrief.js';
import { upcomingTrips } from '../src/lib/care.js';
describe('a trip you will not ride (v0.19.2)', () => {
  it('is no next trip, no reminder and no debrief', () => {
    const ts = [{ id: '303', startDate: '2026-10-15', days: 3, skipped: true, entries: [{ itemId: 'A' }] }, { id: 'later', startDate: '2026-11-01', days: 1, entries: [] }];
    expect(nextTrip(ts, '2026-10-04').id).toBe('later');
    expect(upcomingTrips(ts, '2026-10-04').map((t) => t.id)).toEqual(['later']);
    expect(toDebrief(ts, [], '2026-10-20')).toEqual([]);
  });
});
