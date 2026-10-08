// v0.26.1 (AP17, Noah 14a/15b): suggested places on an outdoor trip, and litres only when all are known.
import { describe, it, expect } from 'vitest';
import { suggestPlaces, applyPlaces, dismissPlace, poorPlace, bagVolumes } from '../src/lib/bagsuggest.js';
import { tripStats } from '../src/lib/trips.js';

const bike = { id: 'gravel', name: 'Gravel', slots: ['seat', 'frame', 'top', 'fork'], setup: { seat: 'bag-seat', frame: 'bag-frame', top: 'bag-top', fork: null } };
const bags = [
  { id: 'bag-seat', name: 'Seat pack 10 L', slot: 'seat', volumeL: 10 },
  { id: 'bag-frame', name: 'Frame bag', slot: 'frame', volumeL: 4 },
  { id: 'bag-top', name: 'Top tube bag', slot: 'top', volumeL: 1 },
  { id: 'bag-cargo', name: 'Cargo cage', slot: 'fork', volumeL: 3 },
];
const items = [
  { id: 'SL01', name: 'Sleeping bag', sets: ['sleep'], defaultBag: 'seat', volumeL: 6 },
  { id: 'SL02', name: 'Sleeping mat', sets: ['sleep'], defaultBag: 'bar', volumeL: 3 },
  { id: 'CO01', name: 'Stove', sets: ['cook'], defaultBag: null, volumeL: 1 },
  { id: 'WA01', name: 'Down jacket', sets: ['warm'], defaultBag: 'seat' },
  { id: 'ON01', name: 'Jersey', role: 'worn', sets: [], defaultBag: 'body' },
  { id: 'SL03', name: 'Sleep shirt', role: 'worn', sets: ['sleep'], defaultBag: 'body' },
];
const trip = (over = {}) => ({
  id: 'test_data_gtp_bivvy', overnight: 'outdoor', cook: true, bikeId: 'gravel', setup: { ...bike.setup },
  entries: [
    { itemId: 'SL01', slot: 'body', qty: 1, packed: true }, // on the body, not worn: poor
    { itemId: 'SL02', slot: 'bar', qty: 1, packed: false }, // the trip has no bag at the handlebar: poor
    { itemId: 'CO01', slot: 'frame', qty: 1, packed: false }, // fine
    { itemId: 'WA01', slot: 'body', qty: 1, packed: false }, // warm set: not suggested
    { itemId: 'SL03', slot: 'body', qty: 1, packed: false }, // worn: fine on the body
  ],
  ...over,
});

describe('suggested places (14a)', () => {
  it('suggests a bag for sleep and cook items in a poor place, only outdoors', () => {
    const rows = suggestPlaces(trip(), items, bags, bike);
    expect(rows).toEqual([
      { itemId: 'SL01', from: 'body', to: 'seat', bagId: 'bag-seat', addBag: false }, // its usual bag
      { itemId: 'SL02', from: 'bar', to: 'seat', bagId: 'bag-seat', addBag: false }, // first sleep place with a bag
    ]);
    expect(suggestPlaces(trip({ overnight: 'lodging' }), items, bags, bike)).toEqual([]);
    expect(suggestPlaces(trip({ overnight: undefined }), items, bags, bike)).toEqual([]);
  });

  it('knows a poor place', () => {
    const t = trip();
    expect(poorPlace({ slot: 'body' }, items[0], t)).toBe(true);
    expect(poorPlace({ slot: 'body' }, items[5], t)).toBe(false);
    expect(poorPlace({ slot: 'bar' }, items[1], t)).toBe(true);
    expect(poorPlace({ slot: 'seat' }, items[1], t)).toBe(false);
    expect(poorPlace({ slot: 'mounted' }, items[1], t)).toBe(false);
  });

  it('offers a free place of the bike as a bag for this trip only when no bag of the trip fits', () => {
    const t = trip({ setup: { seat: null, frame: null, top: null, fork: null }, entries: [{ itemId: 'CO01', slot: 'body', qty: 1, packed: false }] });
    const rows = suggestPlaces(t, items, bags, bike);
    expect(rows).toEqual([{ itemId: 'CO01', from: 'body', to: 'frame', bagId: 'bag-frame', addBag: true }]);
    const out = applyPlaces(t, rows);
    expect(out.setup).toEqual({ seat: null, frame: 'bag-frame', top: null, fork: null });
    expect(bike.setup.frame).toBe('bag-frame'); // the bike's standard setup is not touched
  });

  it('applies rows as one change (Undo in Pack) and keeps every other entry', () => {
    const t = trip();
    const out = applyPlaces(t, suggestPlaces(t, items, bags, bike));
    expect(out.entries.map((e) => [e.itemId, e.slot])).toEqual([['SL01', 'seat'], ['SL02', 'seat'], ['CO01', 'frame'], ['WA01', 'body'], ['SL03', 'body']]);
    expect(out.entries[0].packed).toBe(false); // in a new bag: open to pack again
    expect(out.entries[2]).toBe(t.entries[2]);
    expect(suggestPlaces({ ...t, ...out }, items, bags, bike)).toEqual([]);
  });

  it('a dismissed row stays away on this trip', () => {
    const t = trip();
    const next = { ...t, ...dismissPlace(t, 'SL01') };
    expect(suggestPlaces(next, items, bags, bike).map((r) => r.itemId)).toEqual(['SL02']);
    expect(dismissPlace(next, 'SL01')).toEqual({ placesDismissed: ['SL01'] });
  });
});

describe('bag volume only when every litre is known (15b)', () => {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const statsOf = (t, list = items) => tripStats(t, list, bags, bike, null);
  it('shows used of capacity per bag when every bag in use and every item in it has litres', () => {
    const t = { setup: bike.setup, entries: [{ itemId: 'SL01', slot: 'seat', qty: 1 }, { itemId: 'SL02', slot: 'seat', qty: 1 }, { itemId: 'CO01', slot: 'frame', qty: 2 }, { itemId: 'ON01', slot: 'body', qty: 1 }] };
    expect(bagVolumes(statsOf(t), byId)).toEqual({ seat: { used: 9, cap: 10 }, frame: { used: 2, cap: 4 } });
  });
  it('shows nothing when one item or one bag has no litres', () => {
    const t = { setup: bike.setup, entries: [{ itemId: 'SL01', slot: 'seat', qty: 1 }, { itemId: 'WA01', slot: 'seat', qty: 1 }] };
    expect(bagVolumes(statsOf(t), byId)).toBeNull();
    const noCap = bags.map((b) => (b.id === 'bag-frame' ? { ...b, volumeL: null } : b));
    const t2 = { setup: bike.setup, entries: [{ itemId: 'SL01', slot: 'seat', qty: 1 }, { itemId: 'CO01', slot: 'frame', qty: 1 }] };
    expect(bagVolumes(tripStats(t2, items, noCap, bike, null), byId)).toBeNull();
    expect(bagVolumes(statsOf({ setup: bike.setup, entries: [] }), byId)).toBeNull();
  });
});
