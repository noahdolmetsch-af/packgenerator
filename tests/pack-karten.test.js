// «Pack-Karten» (Warteliste 4; Noah «4a»): src/lib/pack/packkarten.js
import { describe, it, expect } from 'vitest';
import { packCards, isPreparing, nextStepOf } from '../src/lib/pack/packkarten.js';

const items = [
  { id: 'a', category: 'rain' },
  { id: 'b', category: 'food' },
  { id: 'c', category: 'tools' },
];
const trip = (o) => ({ id: o.title, title: o.title, startDate: '2026-12-01', entries: [], ...o });
const today = '2026-11-23';

describe('isPreparing', () => {
  it('is a trip from today on that is no idea, not skipped, no test trip and not finished', () => {
    expect(isPreparing(trip({ title: 'x' }), today)).toBe(true);
    expect(isPreparing(trip({ title: 'x', startDate: '2026-11-22' }), today)).toBe(false);
    expect(isPreparing(trip({ title: 'x', idea: true }), today)).toBe(false);
    expect(isPreparing(trip({ title: 'x', skipped: true }), today)).toBe(false);
    expect(isPreparing(trip({ title: 'x', testTrip: true }), today)).toBe(false);
    expect(isPreparing(trip({ title: 'x', finished: true }), today)).toBe(false);
    expect(isPreparing(trip({ title: 'x', startDate: null }), today)).toBe(false);
  });
});

describe('nextStepOf', () => {
  it('is the first step with something not packed', () => {
    const tr = trip({ title: 't', entries: [{ itemId: 'a', packed: true }, { itemId: 'b' }, { itemId: 'c' }] });
    expect(nextStepOf(tr, items)).toBe('food');
    expect(nextStepOf(tr, items, ['bike'])).toBe('bike');
    expect(nextStepOf({ entries: [{ itemId: 'a', packed: true }] }, items)).toBe(null);
  });
});

describe('packCards', () => {
  const trips = [
    trip({ title: 'Later', startDate: '2026-12-20', entries: [{ itemId: 'a', packed: true }, { itemId: 'b', packed: true }] }),
    trip({ title: 'Soon', startDate: '2026-11-25', entries: [{ itemId: 'a', packed: true }, { itemId: 'b' }] }),
    trip({ title: 'Empty', startDate: '2026-11-30' }),
    trip({ title: 'Old', startDate: '2026-10-01', entries: [{ itemId: 'a' }] }),
  ];
  it('lists the nearest start first, without past trips', () => {
    expect(packCards({ trips, items, today }).map((c) => c.title)).toEqual(['Soon', 'Empty', 'Later']);
  });
  it('tells the progress and what the button says', () => {
    const [soon, empty, later] = packCards({ trips, items, today });
    expect(soon).toMatchObject({ pct: 50, kind: 'continue', step: 'food', days: 2 });
    expect(empty).toMatchObject({ pct: 0, kind: 'start', step: null });
    expect(later).toMatchObject({ pct: 100, kind: 'done', step: null });
  });
  it('shows at most three', () => {
    const many = Array.from({ length: 5 }, (_, i) => trip({ title: `T${i}`, startDate: `2026-12-0${i + 1}` }));
    expect(packCards({ trips: many, items, today })).toHaveLength(3);
  });
});
