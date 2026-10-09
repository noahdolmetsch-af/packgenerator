import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { slotFor, standardEntries, newTrip, packAll, tickReady, packAndReady, isDayTrip, addEntries, tripStats, readyDone, whenLabel, ensureTrips, heavyHigh, setQty, togglePacked } from '../src/lib/trips.js';

const it_ = (id, extra) => ({ id, name: id, category: 'elec', weightG: 100, qty: 1, ownership: 'owned', role: null, sets: [], defaultBag: 'top', ...extra });
const items = [
  it_('KL01', { role: 'worn', weightG: 200 }),
  it_('EL07', { role: 'standard', defaultBag: 'mounted' }),
  it_('EL13', { role: 'standard', defaultBag: 'top', weightG: null }),
  it_('SL01', { sets: ['base', 'bivy'], defaultBag: 'side', weightG: 500 }), // v0.64.0: the base set is Bivouac
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
    // v0.33.0 (Noah 11a): Standard comes into every new trip, also a copy: EL07 and EL13 (role
    // standard) join in their usual place; the worn KL01 does not (worn keeps its own logic).
    expect(t.entries).toEqual([{ itemId: 'XX01', slot: 'top', qty: 2, packed: false }, { itemId: 'EL07', slot: 'mounted', qty: 1, packed: false }, { itemId: 'EL13', slot: 'top', qty: 1, packed: false }]);
    expect(t.ready.every((r) => !r.done)).toBe(true);
    const fresh = newTrip({ title: 'First', startDate: '2026-11-01', days: 2, bike: { ...bike, id: 'fully' } }, [old], items);
    expect(fresh.copiedFrom).toBe(null);
    expect(fresh.entries.length).toBe(4);
  });

  it('v0.24.0: a day ride starts without the overnight base set', () => {
    const day = newTrip({ title: 'Day', startDate: '2026-11-01', days: 1, bike: { ...bike, id: 'fully' } }, [], items);
    expect(day.entries.map((e) => e.itemId)).toEqual(['KL01', 'EL07', 'EL13']);
    expect(standardEntries(items, bike.setup, { overnight: false }).some((e) => e.itemId === 'SL01')).toBe(false);
  });

  it('v0.24.0: packAll ticks the given items, or all of them', () => {
    const es = [{ itemId: 'A', packed: false }, { itemId: 'B', packed: false }, { itemId: 'C', packed: true }];
    expect(packAll(es, ['A']).map((e) => e.packed)).toEqual([true, false, true]);
    expect(packAll(es).every((e) => e.packed)).toBe(true);
  });

  it('v0.24.1: tickReady ticks every check, "always with me" rows stay', () => {
    const ready = [{ id: 'a', label: 'Tyres', done: false }, { id: 'b', label: 'Phone', itemId: 'EL07' }, { id: 'c', label: 'Lights', done: true }];
    expect(tickReady(ready)).toEqual([{ id: 'a', label: 'Tyres', done: true }, { id: 'b', label: 'Phone', itemId: 'EL07' }, { id: 'c', label: 'Lights', done: true }]);
    expect(tickReady()).toEqual([]);
  });

  it('v0.24.1: packAndReady packs every item and the whole ready check at once', () => {
    const trip = { entries: [{ itemId: 'A', packed: false }, { itemId: 'B', packed: true }], ready: [{ id: 'r', label: 'Tyres', done: false }] };
    const patch = packAndReady(trip);
    expect(patch.entries.every((e) => e.packed)).toBe(true);
    expect(patch.ready[0].done).toBe(true);
    expect(trip.entries[0].packed).toBe(false); // the trip itself is not changed
  });

  it('v0.24.1: a day trip is 1 day or no days set', () => {
    expect(isDayTrip({ days: 1 })).toBe(true);
    expect(isDayTrip({})).toBe(true);
    expect(isDayTrip({ days: 0 })).toBe(true);
    expect(isDayTrip({ days: 2 })).toBe(false);
  });

  it('v0.24.1: addEntries adds several items in one go, never twice', () => {
    const es = [{ itemId: 'A', slot: 'seat', qty: 2, packed: true }];
    const out = addEntries(es, ['B', 'A', 'C', 'B', ''], 'frame', { packed: false });
    expect(out).toEqual([
      { itemId: 'A', slot: 'seat', qty: 2, packed: true },
      { itemId: 'B', slot: 'frame', qty: 1, packed: false },
      { itemId: 'C', slot: 'frame', qty: 1, packed: false },
    ]);
    expect(addEntries(es, ['A'], 'frame')).toBe(es); // nothing new: the same list
    expect(addEntries([], ['X'], 'body')).toEqual([{ itemId: 'X', slot: 'body', qty: 1 }]); // a template has no "packed"
  });

  it('adds up gear, bags, bike and rider into the system weight', () => {
    const trip = newTrip({ title: 'T', startDate: '2026-11-01', days: 2, bike }, [], items);
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

describe('v0.45.1 (G002): past and finished trips are history', () => {
  it('keeps mounts (fixtures) and bags on past and finished trips; a planned trip still loses them', async () => {
    const db = createDb('trips-g002');
    await db.bikes.put({ id: 'bk-gtp', name: 'test_data_gtp_Velo', setup: { seat: 'bag-gtp' }, fixtures: ['test_data_gtp_BK002'] });
    await db.containers.put({ id: 'bag-gtp', itemId: 'test_data_gtp_TA01', slot: 'seat' });
    const entries = [
      { itemId: 'test_data_gtp_BK002', slot: 'bar', qty: 1, packed: true },
      { itemId: 'test_data_gtp_TA01', slot: 'seat', qty: 1, packed: true },
      { itemId: 'test_data_gtp_EL01', slot: 'top', qty: 1, packed: true },
    ];
    const base = { bikeId: 'bk-gtp', setup: { seat: 'bag-gtp' }, ready: [], entries };
    await db.trips.bulkPut([
      { ...base, id: 'past', startDate: '2026-09-01', days: 3 },
      { ...base, id: 'ended', startDate: '2026-10-08', days: 3, finished: true },
      { ...base, id: 'planned', startDate: '2026-10-20', days: 2, entries: entries.map((e) => ({ ...e, packed: false })) },
    ]);
    const before = await db.trips.get('past');
    expect(await ensureTrips(db, '2026-10-09')).toBe(1);
    expect(await db.trips.get('past')).toEqual(before);
    expect((await db.trips.get('ended')).entries).toEqual(entries);
    expect((await db.trips.get('planned')).entries.map((e) => e.itemId)).toEqual(['test_data_gtp_EL01']);
    // a start-up later changes nothing
    expect(await ensureTrips(db, '2026-10-09')).toBe(0);
    expect(await ensureTrips(db, '2027-01-01')).toBe(0);
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
      { id: 'W1', ownership: 'owned', sets: ['lights'], defaultBag: 'seat' },
      { id: 'W2', ownership: 'owned', sets: ['lights', 'bivy'], defaultBag: 'seat' },
      { id: 'S1', ownership: 'owned', sets: ['lights'], role: 'standard', defaultBag: 'top' },
      { id: 'R1', ownership: 'owned', sets: ['lights', 'repair'], defaultBag: 'seat' },
    ];
    const trip = { setup: { seat: 'b', top: 'c' }, sets: { bivy: true }, entries: [{ itemId: 'S1', slot: 'top' }] };
    const on = toggleSet(trip, its, 'lights', true);
    expect(on.entries.map((e) => e.itemId)).toEqual(['S1', 'W1', 'W2', 'R1']);
    const off = toggleSet({ ...trip, ...on }, its, 'lights', false);
    expect(off.entries.map((e) => e.itemId)).toEqual(['S1', 'W2']); // W2 stays for "bivy", S1 is standard
    // v0.64.0: a block the context brings (active) keeps its items too; false takes a suggested block off
    const off2 = toggleSet({ ...trip, ...on }, its, 'lights', false, { active: ['repair'] });
    expect(off2.entries.map((e) => e.itemId)).toEqual(['S1', 'W2', 'R1']);
    expect(off2.sets.lights).toBe(false);
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
    expect(axleLoad({ zones }, {})).toEqual({ front: 1200, rear: 1200, missing: 0, estimate: false });
    // A bottle cage is weighed with the bike, so it adds nothing here.
    const cage = { key: 'cage1', grams: 0, bag: { slot: 'cage1', itemId: 'BK04', pieces: 1 }, zone: { box: { x: 100, w: 100 } } };
    expect(axleLoad({ zones: [cage] }, { BK04: { weightG: 40 } })).toEqual({ front: 0, rear: 0, missing: 0, estimate: false });
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

// v0.26.1 (AP19, Noah 18b): packing day checks.
describe('packed and ready (v0.26.1)', () => {
  const items = [{ id: 'A', weightG: 100 }, { id: 'B', weightG: 50 }, { id: 'C', weightG: null }];
  const trip = () => ({
    id: 'test_data_gtp_ap19', setup: { seat: 'bag-seat' },
    entries: [{ itemId: 'A', slot: 'seat', qty: 1, packed: true }, { itemId: 'B', slot: 'seat', qty: 1, packed: false }],
    ready: [{ id: 'kit', label: 'Helmet', done: false }, { id: 'route', label: 'Route', done: true }],
  });
  it('a raised amount stays packed, without a question; a lowered one too', () => {
    const up = setQty(trip().entries, 'A', 3);
    expect(up[0]).toEqual({ itemId: 'A', slot: 'seat', qty: 3, packed: true, qtyManual: true });
    expect(setQty(up, 'A', 2)[0].packed).toBe(true);
    expect(setQty(up, 'A', 99)[0].qty).toBe(20);
    expect(setQty(up, 'A', 0)[0].qty).toBe(1);
    expect(setQty(up, 'A', 3)[1]).toBe(up[1]); // other entries stay as they are
  });
  it('counts packed items and the ready check separately', () => {
    const t = trip();
    const stats = tripStats(t, items, [], null, null);
    expect([stats.packed, stats.count, stats.toPack]).toEqual([1, 2, 1]);
    expect(t.ready.filter((r) => readyDone(r, t)).length).toBe(1);
    // Every item packed does not tick the ready check.
    const all = { ...t, entries: packAll(t.entries) };
    expect(tripStats(all, items, [], null, null).toPack).toBe(0);
    expect(all.ready.filter((r) => readyDone(r, all)).length).toBe(1);
    // A tick on one item changes only that item.
    expect(togglePacked(t.entries, 'B').map((e) => e.packed)).toEqual([true, true]);
  });
  it('an item added after packing is open', () => {
    const t = { ...trip(), entries: packAll(trip().entries) };
    const next = addEntries(t.entries, ['C'], 'seat', { packed: false });
    expect(next.find((e) => e.itemId === 'C').packed).toBe(false);
    expect(tripStats({ ...t, entries: next }, items, [], null, null).toPack).toBe(1);
  });
});
