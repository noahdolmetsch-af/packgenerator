import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { slotFor, standardEntries, newTrip, tripStats, readyDone, whenLabel, ensureTrips, heavyHigh } from '../src/lib/trips.js';

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

  it('v0.21.0: base, worn and food and water add up to gear plus on me', () => {
    const more = [
      ...items,
      it_('FO01', { category: 'food', weightG: 300 }),
      it_('FO02', { category: 'food', weightG: 50 }),
      it_('BOT1', { category: 'bike', weightG: 800, waterL: 0.75 }),
    ];
    const trip = {
      setup: bike.setup,
      entries: [
        { itemId: 'KL01', slot: 'body', qty: 1 },
        { itemId: 'FO02', slot: 'body', qty: 2 }, // gels in the jersey pocket: food, not worn
        { itemId: 'EL07', slot: 'mounted', qty: 1 },
        { itemId: 'BOT1', slot: 'mounted', qty: 2 },
        { itemId: 'SL01', slot: 'seat', qty: 1 },
        { itemId: 'FO01', slot: 'seat', qty: 1 },
        { itemId: 'EL13', slot: 'top', qty: 1 }, // not weighed
      ],
    };
    const s = tripStats(trip, more, bags, bike, 64000);
    expect(s.wornG).toBe(200);
    expect(s.consumablesG).toBe(100 + 1600 + 300);
    expect(s.baseG).toBe(100 + 500);
    expect(s.baseG + s.wornG + s.consumablesG).toBe(s.gearG + s.onMeG);
    expect(s.systemG).toBe(s.baseG + s.wornG + s.consumablesG + s.bagsG + s.bikeG + s.riderG);
  });

  it('v0.21.0: finds heavy items on the handlebar or seat post, not in the frame bag', () => {
    const byId = { A: { weightG: 650 }, B: { weightG: 500 }, C: { weightG: null }, D: { weightG: 900 } };
    const zone = (key, ids) => ({ key, entries: ids.map((itemId) => ({ itemId, qty: 1 })) });
    expect(heavyHigh(zone('seat', ['A', 'B', 'C']), byId)).toEqual(['A']);
    expect(heavyHigh(zone('bar', ['D']), byId)).toEqual(['D']);
    expect(heavyHigh(zone('pouchL', ['B']), byId)).toEqual([]); // exactly 500 g is fine
    expect(heavyHigh(zone('frame', ['A', 'D']), byId)).toEqual([]);
    expect(heavyHigh(zone('body', ['D']), byId)).toEqual([]);
    expect(heavyHigh(null, byId)).toEqual([]);
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

describe('pack extras', () => {
  it('switches an overnight set on and off', async () => {
    const { toggleSet } = await import('../src/lib/trips.js');
    const its = [
      { id: 'W1', ownership: 'owned', sets: ['warm'], defaultBag: 'seat' },
      { id: 'W2', ownership: 'owned', sets: ['warm', 'sleep'], defaultBag: 'seat' },
      { id: 'S1', ownership: 'owned', sets: ['warm'], role: 'standard', defaultBag: 'top' },
    ];
    const trip = { setup: { seat: 'b', top: 'c' }, sets: { sleep: true }, entries: [{ itemId: 'S1', slot: 'top' }] };
    const on = toggleSet(trip, its, 'warm', true);
    expect(on.entries.map((e) => e.itemId)).toEqual(['S1', 'W1', 'W2']);
    const off = toggleSet({ ...trip, ...on }, its, 'warm', false);
    expect(off.entries.map((e) => e.itemId)).toEqual(['S1', 'W2']); // W2 stays for "sleep", S1 is standard
  });

  it('hints above 80 % and offers a bag that keeps 20 % free', async () => {
    const { biggerBag, tooFull } = await import('../src/lib/trips.js');
    const zone = { key: 'seat', vol: 14, bag: { id: 'a', volumeL: 16.5 } };
    expect(tooFull(zone)).toBe(true); // 14 L is 85 % of 16.5 L
    expect(tooFull({ ...zone, vol: 13 })).toBe(false);
    const bags = [{ id: 'a', slot: 'seat', volumeL: 16.5 }, { id: 's', slot: 'seat', volumeL: 17 }, { id: 't', slot: 'seat', volumeL: 18 }];
    expect(biggerBag(zone, bags)?.id).toBe('t'); // 17 L would be 82 % full
    expect(biggerBag({ ...zone, vol: 10 }, bags)).toBe(null);
  });

  it('splits the luggage between the wheels', async () => {
    const { axleLoad } = await import('../src/lib/trips.js');
    const zones = [
      { key: 'body', grams: 5000, zone: { box: null } },
      { key: 'seat', grams: 1000, bag: null, zone: { box: { x: 100, w: 100 } } }, // centre 150 = rear hub
      { key: 'bar', grams: 1000, bag: null, zone: { box: { x: 540, w: 100 } } }, // centre 590 = front hub
      { key: 'mounted', grams: 400, bag: null, zone: { box: { x: 0, w: 10 } } },
    ];
    expect(axleLoad({ zones }, {})).toEqual({ front: 1200, rear: 1200 });
    // A bottle cage is weighed with the bike, so it adds nothing here.
    const cage = { key: 'cage1', grams: 0, bag: { slot: 'cage1', itemId: 'BK04', pieces: 1 }, zone: { box: { x: 100, w: 100 } } };
    expect(axleLoad({ zones: [cage] }, { BK04: { weightG: 40 } })).toEqual({ front: 0, rear: 0 });
  });
});

describe('packing day (answer 2a)', () => {
  it('goes bag by bag, then mounted, then what you wear', async () => {
    const { packSteps, togglePacked } = await import('../src/lib/trips.js');
    const stats = {
      zones: [
        { key: 'body', zone: { name: 'On me' }, bag: null, entries: [{ itemId: 'A', packed: false }] },
        { key: 'mounted', zone: { name: 'Mounted' }, bag: null, entries: [{ itemId: 'B', packed: true }] },
        { key: 'seat', zone: { name: 'Seat pack' }, bag: { name: 'Tailfin' }, entries: [{ itemId: 'C', packed: true }, { itemId: 'D', packed: false }] },
        { key: 'frame', zone: { name: 'Frame bag' }, bag: { name: 'Frame bag' }, entries: [] },
      ],
    };
    const steps = packSteps(stats, { seat: 'Sleep' });
    expect(steps.map((s) => s.key)).toEqual(['seat', 'mounted', 'body']);
    expect(steps[0]).toMatchObject({ title: 'Sleep', sub: 'Tailfin', done: 1 });
    expect(steps[2].title).toBe('Wear and carry');
    expect(togglePacked(stats.zones[2].entries, 'D').map((e) => e.packed)).toEqual([true, true]);
  });
});
