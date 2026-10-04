import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { slotFor, standardEntries, newTrip, tripStats, readyDone, whenLabel, ensureTrips } from '../src/lib/trips.js';

const it_ = (id, extra) => ({ id, name: id, category: 'elec', weightG: 100, qty: 1, ownership: 'owned', role: null, sets: [], defaultBag: 'top', ...extra });
const items = [
  it_('KL01', { role: 'worn', weightG: 200 }),
  it_('EL07', { role: 'standard', defaultBag: 'mounted' }),
  it_('EL13', { role: 'standard', defaultBag: 'top', weightG: null }),
  it_('SL01', { sets: ['base'], defaultBag: 'side', weightG: 500 }),
  it_('XX01', { role: 'optional' }),
  it_('WISH', { role: 'standard', ownership: 'wishlist' }),
  it_('TA06', { category: 'bags', weightG: 200 }),
];
const bags = [{ id: 'bag-TA06', name: 'Top tube bag', slot: 'top', itemId: 'TA06', pieces: 1, volumeL: 1 }, { id: 'bag-seat', name: 'Seat pack', slot: 'seat', itemId: null, pieces: 1, volumeL: 16 }];
const bike = { id: 'scott', name: 'Scott', weightG: 13000, setup: { top: 'bag-TA06', seat: 'bag-seat' } };

describe('trips', () => {
  it('puts items in their bag, or the seat pack when that bag is not on the bike', () => {
    expect(slotFor('top', bike.setup)).toBe('top');
    expect(slotFor('side', bike.setup)).toBe('seat');
    expect(slotFor('body', {})).toBe('body');
    expect(slotFor('frame', {})).toBe('body');
  });

  it('builds the standard set from roles and the base set', () => {
    const e = standardEntries(items, bike.setup);
    expect(e.map((x) => [x.itemId, x.slot])).toEqual([['KL01', 'body'], ['EL07', 'mounted'], ['EL13', 'top'], ['SL01', 'seat']]);
  });

  it('copies the last trip on the same bike, unticked', () => {
    const old = { id: 'trip-a', bikeId: 'scott', startDate: '2026-09-01', entries: [{ itemId: 'XX01', slot: 'top', qty: 2, packed: true }, { itemId: 'GONE', slot: 'top', qty: 1, packed: true }] };
    const other = { id: 'trip-b', bikeId: 'gravel', startDate: '2026-09-20', entries: [] };
    const t = newTrip({ title: ' Next ', startDate: '2026-11-01', days: 2, bike }, [old, other], items, 1000);
    expect(t).toMatchObject({ title: 'Next', bikeId: 'scott', copiedFrom: 'trip-a', days: 2 });
    expect(t.entries).toEqual([{ itemId: 'XX01', slot: 'top', qty: 2, packed: false }]);
    expect(t.ready.every((r) => !r.done)).toBe(true);
    const fresh = newTrip({ title: 'First', startDate: '2026-11-01', days: 1, bike: { ...bike, id: 'fully' } }, [old], items);
    expect(fresh.copiedFrom).toBe(null);
    expect(fresh.entries.length).toBe(4);
  });

  it('adds up gear, bags, bike and rider into the system weight', () => {
    const trip = newTrip({ title: 'T', startDate: '2026-11-01', days: 1, bike }, [], items);
    const s = tripStats(trip, items, bags, bike, 64000);
    expect(s.onMeG).toBe(200);
    expect(s.gearG).toBe(100 + 500); // EL07 + SL01; EL13 not weighed
    expect(s.bagsG).toBe(200);
    expect(s.systemG).toBe(200 + 600 + 200 + 13000 + 64000);
    expect(s.unweighed).toBe(1);
    expect(s.zones.map((z) => z.key)).toEqual(['body', 'mounted', 'seat', 'top']);
  });

  it('ticks "always with me" rows when the item is on the trip', () => {
    const trip = { entries: [{ itemId: 'EL13' }] };
    expect(readyDone({ itemId: 'EL13' }, trip)).toBe(true);
    expect(readyDone({ itemId: 'EL07' }, trip)).toBe(false);
    expect(readyDone({ done: true }, trip)).toBe(true);
    expect(whenLabel('2026-10-15', new Date(2026, 9, 4))).toBe('In 11 days');
  });

  it('completes an imported trip once', async () => {
    const db = createDb('trips-test');
    await db.bikes.put(bike);
    await db.trips.put({ id: 'trip-303', bike: 'Scott', entries: [{ itemId: 'EL13', container: 'top', qty: 1, packed: false }] });
    expect(await ensureTrips(db)).toBe(1);
    const t = await db.trips.get('trip-303');
    expect(t).toMatchObject({ bikeId: 'scott', setup: bike.setup });
    expect(t.entries).toEqual([{ itemId: 'EL13', slot: 'top', qty: 1, packed: false }]);
    expect(await ensureTrips(db)).toBe(0);
  });
});

describe('bags packed as items', () => {
  it('move into the bag setup and leave the packing list', async () => {
    const { absorbBags } = await import('../src/lib/trips.js');
    const t = absorbBags({ setup: { top: 'bag-TA06' }, entries: [{ itemId: 'TA06', slot: 'seat' }, { itemId: 'TA10', slot: 'seat' }, { itemId: 'EL01', slot: 'top' }] }, [
      { id: 'bag-TA06', itemId: 'TA06', slot: 'top' },
      { id: 'bag-TA10', itemId: 'TA10', slot: 'carry' },
    ]);
    expect(t.entries).toEqual([{ itemId: 'EL01', slot: 'top' }]);
    expect(t.setup).toEqual({ top: 'bag-TA06', carry: 'bag-TA10' });
  });
});
