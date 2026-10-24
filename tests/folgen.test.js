import { describe, it, expect } from 'vitest';
import { blockEffect, blockHistory, historyLine } from '../src/lib/folgen/folgen.js';

const it1 = (id, extra = {}) => ({ id, name: id, ownership: 'owned', weightG: 100, sets: ['rain'], defaultBag: 'seat', ...extra });
const items = [it1('jacket', { weightG: 250 }), it1('pants', { weightG: 180, defaultBag: 'frame' }), it1('cover', { weightG: null }), { id: 'tent', name: 'Tent', ownership: 'owned', weightG: 900, sets: ['tent'] }];
const block = { key: 'rain', label: 'Regen' };

describe('Folgen vorher sehen', () => {
  it('shows things, grams, bags, a missing bag and a packed bag to check again', () => {
    const trip = { id: 't', setup: { seat: 'bag-1' }, entries: [{ itemId: 'tent', slot: 'seat', qty: 1, packed: true }] };
    const e = blockEffect(trip, items, block, { slotOf: () => 'seat' });
    expect(e.added.map((x) => x.itemId)).toEqual(['jacket', 'pants', 'cover']);
    expect(e.g).toBe(430);
    expect(e.unknown).toBe(1);
    expect(e.bags).toEqual([{ slot: 'seat', n: 3, g: 430 }]);
    expect(e.missingBag).toEqual(['pants']);
    expect(e.recheck).toEqual(['seat']);
    // nothing changed on the trip
    expect(trip.entries).toHaveLength(1);
  });
  it('asks earlier trips: missing and unused', () => {
    const trips = [{ id: 'a', entries: [{ itemId: 'jacket' }] }, { id: 'b', entries: [] }, { id: 'c', entries: [] }, { id: 'now', entries: [] }];
    const debriefs = [
      { tripId: 'a', status: 'done', items: { jacket: 'unused' }, missing: [] },
      { tripId: 'b', status: 'done', items: {}, missing: [{ id: 'm', name: 'pants', itemId: null }] },
      { tripId: 'c', status: 'open', items: {}, missing: [{ itemId: 'jacket', name: 'jacket' }] },
    ];
    const h = blockHistory(block, items, trips, debriefs, 'now');
    expect(h).toEqual({ trips: 2, along: 1, missed: 1, unused: 1, missedNames: ['pants'] });
    expect(historyLine(h).key).toMatch(/missing.*unused/);
    expect(historyLine({ trips: 0 }).key).toMatch(/No finished debrief/);
  });
});
