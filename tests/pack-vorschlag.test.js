// «Dein Vorschlag» (Warteliste 4; Noah 22.11.2026 «1b», «5a»): the offer, what was left out, the gaps, and «Like last time?».
import { describe, it, expect } from 'vitest';
import { offerOf, leftOutRows, gapRows, likeLast, compareLists, tripForOffer } from '../src/lib/pack/vorschlag.js';

const items = [
  { id: 'a', name: 'Tent', category: 'sleep', weightG: 1200 },
  { id: 'b', name: 'Mat', category: 'sleep', weightG: 400 },
  { id: 'c', name: 'Stove', category: 'cook', weightG: 150 },
  { id: 'd', name: 'Jacket', category: 'rain', weightG: 300 },
  { id: 'e', name: 'Lamp', category: 'light' },
  { id: 'f', name: 'Poncho', category: 'rain', weightG: 200 },
  { id: 'g', name: 'Old', category: 'rain', weightG: 100, ownership: 'gone' },
];
const trip = { id: 't', domain: 'bikepacking', startDate: '2026-12-05', entries: ['a', 'b', 'c', 'd', 'e'].map((itemId) => ({ itemId, qty: itemId === 'b' ? 2 : 1 })) };

describe('offerOf', () => {
  it('counts pieces and weight per step, in the order of the steps', () => {
    const o = offerOf(trip, items);
    expect(o.n).toBe(5);
    expect(o.g).toBe(1200 + 800 + 150 + 300);
    expect(o.unknown).toBe(1);
    expect(o.steps.map((s) => s.key)).toEqual(['clothes', 'sleep', 'food', 'tech']);
    expect(o.steps.find((s) => s.key === 'sleep')).toMatchObject({ n: 2, g: 2000, ids: ['a', 'b'] });
  });
  it('follows the order the person chose and leaves unknown items out', () => {
    expect(offerOf(trip, items, ['tech', 'food']).steps.map((s) => s.key)).toEqual(['tech', 'food', 'clothes', 'sleep']);
    expect(offerOf({ entries: [{ itemId: 'zz' }] }, items).n).toBe(0);
  });
});

describe('leftOutRows', () => {
  it('lists what was left out and is still yours, newest first, not the ones that came back', () => {
    const tr = { ...trip, leftOut: [{ itemId: 'f', at: '1' }, { itemId: 'g', at: '2' }, { itemId: 'a', at: '3' }, { itemId: 'f', at: '4' }] };
    expect(leftOutRows(tr, items).map((r) => r.item.id)).toEqual(['f']);
    expect(leftOutRows({ ...trip }, items)).toEqual([]);
  });
});

describe('gapRows', () => {
  it('takes only the rows that are not ok', () => {
    const check = { rows: [{ key: 'hands', name: 'Hands', ok: false, fix: { id: 'x' }, rain: false }, { key: 'head', name: 'Head', ok: true }] };
    expect(gapRows(check)).toEqual([{ key: 'hands', name: 'Hands', fix: { id: 'x' }, rain: false }]);
    expect(gapRows(null)).toEqual([]);
  });
});

describe('likeLast and compareLists', () => {
  const old = { id: 'o', domain: 'bikepacking', startDate: '2026-10-01', entries: ['a', 'b', 'c', 'f'].map((itemId) => ({ itemId })) };
  const far = { id: 'x', domain: 'bikepacking', startDate: '2026-09-01', entries: [{ itemId: 'g' }] };
  it('finds the earlier trip with the most alike list, with its share', () => {
    expect(likeLast(trip, [old, far, trip])).toMatchObject({ trip: { id: 'o' }, share: 50 });
  });
  it('skips later trips, test trips, other areas and lists with less than 30 % alike', () => {
    expect(likeLast(trip, [{ ...old, startDate: '2026-12-20' }])).toBe(null);
    expect(likeLast(trip, [{ ...old, testTrip: true }])).toBe(null);
    expect(likeLast(trip, [{ ...old, domain: 'ski' }])).toBe(null);
    expect(likeLast(trip, [far])).toBe(null);
    expect(likeLast({ id: 'n', entries: [] }, [old])).toBe(null);
  });
  it('compares: only now, only before, and the same', () => {
    const c = compareLists(trip, old, items);
    expect(c.now.map((i) => i.id)).toEqual(['d', 'e']);
    expect(c.before.map((i) => i.id)).toEqual(['f']);
    expect(c.same).toBe(3);
  });
});

describe('tripForOffer', () => {
  const trips = [{ id: 'p', startDate: '2026-11-01' }, { id: 'n', startDate: '2026-12-05' }, { id: 'm', startDate: '2026-12-01' }, { id: 'i', startDate: '2026-11-25', idea: true }];
  it('the open trip, else the nearest one to come', () => {
    expect(tripForOffer(trips, 'p', '2026-11-23').id).toBe('p');
    expect(tripForOffer(trips, null, '2026-11-23').id).toBe('m');
    expect(tripForOffer([], null, '2026-11-23')).toBe(null);
  });
});
