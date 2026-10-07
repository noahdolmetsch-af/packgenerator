import { describe, it, expect } from 'vitest';
import { reviewRows, acceptReview, planningGroups } from '../src/lib/preparation.js';

const items = [
  { id: 'rain', name: 'Rain jacket', ownership: 'owned', rain: 'yes', defaultBag: 'frame', category: 'rain' },
  { id: 'light', name: 'Light jacket', ownership: 'owned', altFor: 'rain', defaultBag: 'frame', category: 'rain' },
  { id: 'gel', name: 'Gel', ownership: 'owned', role: 'standard', perHours: 3, note: 'Check refills', defaultBag: 'frame', category: 'food' },
];
const trip = { entries: [{ itemId: 'gel', slot: 'frame', qty: 1, packed: true }], setup: { frame: 'bag' }, hours: 6, wx: { min: 4, max: 12, rain: 'showers' } };

describe('preparation review', () => {
  it('previews alternatives and amounts without changing the saved trip', () => {
    const before = structuredClone(trip);
    const rows = reviewRows(trip, items, { rain: { id: 'light', selected: true }, gel: { qty: 3, selected: true } });
    expect(rows.find(r => r.slot === 'rain')).toMatchObject({ id: 'light', selected: true });
    expect(rows.find(r => r.slot === 'gel')).toMatchObject({ qty: 3, selected: true });
    expect(trip).toEqual(before);
  });
  it('applies only confirmed choices and resets packing when an amount changes', () => {
    const patch = acceptReview(trip, items, { rain: { id: 'light', selected: true }, gel: { qty: 3, selected: true } });
    expect(patch.entries).toEqual([
      { itemId: 'gel', slot: 'frame', qty: 3, packed: false },
      { itemId: 'light', slot: 'frame', qty: 1, packed: false },
    ]);
    expect(patch.layerPick.rain).toBe('light');
  });
  it('keeps unrelated and unchecked items, and stores an explicit skip', () => {
    const patch = acceptReview(trip, items, { rain: { selected: false }, gel: { selected: false } });
    expect(patch.entries).toEqual(trip.entries);
    expect(patch.layerPick.rain).toBe('none');
  });
  it('rejects an unknown alternative and clamps manual quantities', () => {
    const rows = reviewRows(trip, items, { rain: { id: 'unknown', qty: -2 }, gel: { qty: 1000 } });
    expect(rows.find(r => r.slot === 'rain')).toMatchObject({ id: 'rain', qty: 1 });
    expect(rows.find(r => r.slot === 'gel').qty).toBe(20);
  });
  it('reopens an explicitly skipped suggestion so it can be reconsidered', () => {
    const skipped = { ...trip, layerPick: { rain: 'none' } };
    expect(reviewRows(skipped, items, {}).find(r => r.slot === 'rain').selected).toBe(false);
    expect(acceptReview(skipped, items, { rain: { selected: true } }).entries.some(e => e.itemId === 'rain')).toBe(true);
  });
});

describe('planning groups', () => {
  it('groups by category without altering bag assignment or omitting unknown materials', () => {
    const stats = { zones: [{ key: 'frame', zone: { name: 'Frame' }, entries: [{ itemId: 'rain', slot: 'frame' }, { itemId: 'missing', slot: 'frame' }] }] };
    const result = planningGroups(stats, items, 'category');
    expect(result.map(g => g.entries.map(e => e.itemId))).toEqual([['rain'], ['missing']]);
    expect(result[0].entries[0].slot).toBe('frame');
  });
});
