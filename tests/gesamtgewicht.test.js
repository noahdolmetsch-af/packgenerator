// «Gesamtgewicht» (Noah 23.11.2026 «1a»): the weight of a trip in steps, without counting anything twice. Fictional data only.
import { describe, it, expect } from 'vitest';
import { totalRows } from '../src/lib/pack/gesamt.js';
import { tripStats } from '../src/lib/trips.js';

const stats = (f = {}) => ({ gearG: 4000, onMeG: 1500, wornBagsG: 300, bagsG: 900, bikeG: 12000, riderG: 70000, unweighed: 0, bagsMissing: 0, wornBagsMissing: 0, bikeKind: 'measured', ...f });

describe('totalRows', () => {
  it('goes in steps: items, bags, bike, rider; worn bags are taken out of the items and put back with the bags', () => {
    const r = totalRows(stats());
    expect(r.map((x) => x.key)).toEqual(['items', 'bags', 'bike', 'rider']);
    expect(r.map((x) => x.g)).toEqual([5200, 6400, 18400, 88400]);
    expect(r.map((x) => x.add)).toEqual([5200, 1200, 12000, 70000]);
  });
  it('a trip without a bike has no bike line', () => {
    expect(totalRows(stats(), { bike: false }).map((x) => x.key)).toEqual(['items', 'bags', 'rider']);
  });
  it('without a rider weight there is no rider line', () => {
    expect(totalRows(stats({ riderG: 0 })).map((x) => x.key)).toEqual(['items', 'bags', 'bike']);
  });
  it('missing weights carry on to the later rows', () => {
    const r = totalRows(stats({ unweighed: 2, bagsMissing: 1 }));
    expect(r.map((x) => x.missing)).toEqual([2, 3, 3, 3]);
  });
  it('a bike without a weight counts as missing, an estimated one is marked', () => {
    expect(totalRows(stats({ bikeG: 0 })).find((x) => x.key === 'bike').missing).toBe(1);
    expect(totalRows(stats({ bikeKind: 'estimate' })).find((x) => x.key === 'bike').estimate).toBe(true);
  });
  it('agrees with the system weight of tripStats', () => {
    const items = [{ id: 'a', weightG: 500 }, { id: 'b', weightG: 250 }];
    const bags = [{ id: 'bag1', name: 'Tasche', weightG: 200, volumeL: 6 }];
    const trip = { setup: { seat: 'bag1' }, entries: [{ itemId: 'a', slot: 'seat', qty: 1 }, { itemId: 'b', slot: 'body', qty: 2 }] };
    const s = tripStats(trip, items, bags, { weightG: 9000 }, 65000);
    const r = totalRows(s);
    expect(r.at(-1).g).toBe(s.systemG);
    expect(r[0].g).toBe(1000);
  });
});
