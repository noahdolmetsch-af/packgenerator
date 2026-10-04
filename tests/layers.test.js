import { describe, it, expect } from 'vitest';
import { layerSuggest, layerDone, applyLayers, layerOf, waterOn } from '../src/lib/layers.js';
import { swapInTrip } from '../src/lib/replace.js';

const own = (id, extra) => ({ id, name: id, ownership: 'owned', defaultBag: 'seat', ...extra });
const items = [
  own('BASE', { role: 'worn', defaultBag: 'body' }),
  own('WIND', { ride: 'daily' }),
  own('GEL', { role: 'standard', perHours: 3, defaultBag: 'pouchR' }),
  own('BOTTLE', { ride: 'training', perHours: 3, waterL: 1, defaultBag: 'mounted' }),
  own('LEGS', { coldBelow: 10 }),
  own('JERSEY', { coldBelow: 5 }),
  own('RAINJ', { rain: 'yes' }),
  own('OVERSHOES', { rain: 'optional' }),
  { ...own('OLD', { coldBelow: 10 }), ownership: 'gone' },
];
const ids = (rows) => rows.map((r) => r.id);

describe('layers', () => {
  it('adds the daily layer to a training ride and scales food by hours', () => {
    const rows = layerSuggest({ ride: 'training', hours: 7, entries: [] }, items);
    expect(ids(rows)).toEqual(['WIND', 'BOTTLE', 'GEL']);
    expect(rows.find((r) => r.id === 'GEL').qty).toBe(3);
    expect(ids(layerSuggest({ ride: 'daily', entries: [] }, items))).toEqual(['WIND']);
  });

  it('wears cold layers when it stays cold, packs them when it warms up, and takes rain gear', () => {
    const rows = layerSuggest({ wx: { min: 3, max: 8, rain: 'showers' }, entries: [] }, items);
    expect(rows.map((r) => `${r.id}:${r.place}`)).toEqual(['LEGS:wear', 'JERSEY:pack', 'RAINJ:pack', 'OVERSHOES:pack']);
    expect(rows.find((r) => r.id === 'OVERSHOES').optional).toBe(true);
    expect(ids(layerSuggest({ wx: { min: 12, max: 20, rain: 'none' }, entries: [] }, items))).toEqual([]);
  });

  it('applies suggestions without taking anything off', () => {
    const trip = { entries: [{ itemId: 'GEL', slot: 'pouchR', qty: 1 }, { itemId: 'LEGS', slot: 'seat', qty: 1 }] };
    const rows = [{ id: 'GEL', place: 'pack', qty: 2 }, { id: 'LEGS', place: 'wear', qty: 1 }, { id: 'WIND', place: 'pack', qty: 1 }];
    expect(layerDone(rows[0], trip)).toBe(false);
    const entries = applyLayers(trip.entries, rows, () => 'seat');
    expect(entries).toEqual([
      { itemId: 'GEL', slot: 'pouchR', qty: 2 },
      { itemId: 'LEGS', slot: 'body', qty: 1 },
      { itemId: 'WIND', slot: 'seat', qty: 1, packed: false },
    ]);
    expect(rows.every((r) => layerDone(r, { entries }))).toBe(true);
  });

  it('orders the inventory check layer by layer and counts water', () => {
    const order = [...items].sort((a, b) => layerOf(a).rank - layerOf(b).rank).map((i) => i.id);
    expect(order.slice(0, 4)).toEqual(['BASE', 'GEL', 'WIND', 'BOTTLE']);
    expect(order.indexOf('LEGS')).toBeLessThan(order.indexOf('JERSEY'));
    expect(waterOn({ entries: [{ itemId: 'BOTTLE', qty: 2 }] }, { BOTTLE: items[3] })).toBe(2);
  });

  it('moves a replaced item to its successor on a trip', () => {
    const trip = { entries: [{ itemId: 'A', slot: 'seat', packed: true }], ready: [{ id: 'r', itemId: 'A' }] };
    expect(swapInTrip(trip, 'A', 'B')).toEqual({ entries: [{ itemId: 'B', slot: 'seat', packed: false }], ready: [{ id: 'r', itemId: 'B' }] });
    const both = { entries: [{ itemId: 'A' }, { itemId: 'B' }], ready: [] };
    expect(swapInTrip(both, 'A', 'B').entries).toEqual([{ itemId: 'B' }]);
  });
});
