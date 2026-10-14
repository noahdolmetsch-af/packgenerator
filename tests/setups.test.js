// Taschen-Setups TS0–TS5 (Noah 14.10.2026 «TS0–TS5 freigegeben»): several bag setups per bike.
// Fictional data only.
import { describe, it, expect } from 'vitest';
import { STD, setupsOf, setupOf, usageOf, lastUsedId, saveSetup, copySetup, freeName, withoutSetup, copyToBike, moveItem, setBag, removeItem, placeBySetup, applySetup, movesOf, tripDiffers, takeFromTrip, fromTrip, setupCalc, compareTwo, tablePlaces, stdItemsOf } from '../src/lib/setups.js';
import { newTrip, switchBike, tooFull } from '../src/lib/trips.js';
import { litreWarning } from '../src/lib/backpacks.js';

const items = [
  { id: 'zelt', name: 'Zelt', weightG: 1000, volumeL: 6 },
  { id: 'quilt', name: 'Quilt', weightG: 600, volumeL: 7 },
  { id: 'riegel', name: 'Riegel', weightG: 240, volumeL: 0.5, category: 'food' },
  { id: 'wasser', name: 'Wasser 0.75 L', weightG: 750, volumeL: 0.75, waterL: 0.75 },
  { id: 'regen', name: 'Regenjacke', weightG: 250, volumeL: 1.5, category: 'rain' },
  { id: 'b-seat', name: 'Satteltasche', weightG: 400 },
  { id: 'b-frame', name: 'Rahmentasche', weightG: 200 },
];
const containers = [
  { id: 'seat13', name: 'Satteltasche 13 L', slot: 'seat', volumeL: 13, itemId: 'b-seat' },
  { id: 'frame', name: 'Rahmentasche', slot: 'frame', volumeL: 5, itemId: 'b-frame' },
  { id: 'bar', name: 'Lenkerrolle', slot: 'bar', volumeL: 14, itemId: null, weightG: 300 },
  { id: 'cage', name: 'Flaschenhalter', slot: 'cage1', volumeL: 0.75, itemId: null, weightG: 40 },
];
const bike = {
  id: 'test_data_gtp_gravel',
  name: 'Gravel Test',
  weightG: 9400,
  slots: ['seat', 'frame', 'bar', 'cage1', 'top'],
  setup: { seat: 'seat13', frame: 'frame', cage1: 'cage' },
  setups: [{ id: 'bp', name: 'Bikepacking', bags: { seat: 'seat13', frame: 'frame', bar: 'bar', cage1: 'cage' }, items: [{ itemId: 'zelt', slot: 'seat', qty: 1 }, { itemId: 'quilt', slot: 'bar', qty: 1 }, { itemId: 'riegel', slot: 'frame', qty: 1 }, { itemId: 'wasser', slot: 'cage1', qty: 1 }] }],
};
const trip = (id, startDate, setupId, entries = [{ itemId: 'regen', slot: 'seat', qty: 1 }]) => ({ id, bikeId: bike.id, startDate, setupId, setup: { ...bike.setup }, entries });

describe('the setups of a bike', () => {
  it('lists «Standard» first, from the bike\'s bags, then the others', () => {
    const list = setupsOf(bike);
    expect(list.map((s) => s.id)).toEqual([STD, 'bp']);
    expect(list[0]).toMatchObject({ std: true, name: 'Standard', bags: bike.setup });
    expect(setupOf(bike, 'nope').id).toBe(STD);
  });

  it('takes the places of «Standard» from the last trip that used it, until the bike stores its own', () => {
    const trips = [trip('a', '2026-09-01', undefined, [{ itemId: 'regen', slot: 'seat', qty: 1 }, { itemId: 'riegel', slot: 'body', qty: 1 }])];
    expect(stdItemsOf(bike, trips)).toEqual([{ itemId: 'regen', slot: 'seat', qty: 1 }]);
    expect(stdItemsOf({ ...bike, stdItems: [] }, trips)).toEqual([]);
  });

  it('counts the trips per setup and suggests the one of the last trip', () => {
    const trips = [trip('a', '2026-08-01'), trip('b', '2026-10-10', 'bp'), trip('c', '2026-09-01', 'bp')];
    const use = usageOf(bike, trips);
    expect(use.bp.n).toBe(2);
    expect(use.bp.last.id).toBe('b');
    expect(use[STD].n).toBe(1);
    expect(lastUsedId(bike, trips)).toBe('bp');
    expect(lastUsedId(bike, [trip('x', '2026-10-11', 'deleted')])).toBe(STD);
  });

  it('saves «Standard» on the bike itself and the others in bike.setups', () => {
    expect(saveSetup(bike, { id: STD, bags: { seat: 'seat13' }, items: [] })).toEqual({ setup: { seat: 'seat13' }, stdItems: [] });
    const renamed = saveSetup(bike, { ...bike.setups[0], name: 'BP 3 Tage' });
    expect(renamed.setups[0].name).toBe('BP 3 Tage');
    const added = saveSetup(bike, copySetup(bike.setups[0], { id: 'win', name: 'Winter', now: 0 }));
    expect(added.setups.map((s) => s.id)).toEqual(['bp', 'win']);
    expect(withoutSetup(bike, 'bp')).toEqual([]);
    expect(withoutSetup(bike, STD)).toEqual(bike.setups);
  });

  it('gives a copy a free name', () => {
    expect(freeName('Winter', [{ name: 'Bikepacking' }])).toBe('Winter');
    expect(freeName('Bikepacking', [{ name: 'Bikepacking' }], 'Kopie')).toBe('Bikepacking (Kopie)');
    expect(freeName('Bikepacking', [{ name: 'Bikepacking' }, { name: 'Bikepacking (Kopie)' }], 'Kopie')).toBe('Bikepacking (Kopie 2)');
  });

  it('copies a setup to another bike: places that bike lacks lose their bag, their items become loose', () => {
    const other = { id: 'test_data_gtp_mtb', slots: ['seat', 'frame'] };
    const c = copyToBike(bike.setups[0], other, { id: 'n', name: 'Bikepacking', now: 0 });
    expect(c.bags).toEqual({ seat: 'seat13', frame: 'frame' });
    expect(c.items.find((x) => x.itemId === 'quilt').slot).toBe(null);
    expect(c.items.find((x) => x.itemId === 'zelt').slot).toBe('seat');
  });

  it('moves, adds and removes items, and changes a bag', () => {
    const s = bike.setups[0];
    expect(moveItem(s, 'zelt', 'frame').items.find((x) => x.itemId === 'zelt').slot).toBe('frame');
    expect(moveItem(s, 'regen', 'seat').items.at(-1)).toEqual({ itemId: 'regen', slot: 'seat', qty: 1 });
    expect(removeItem(s, 'zelt').items.some((x) => x.itemId === 'zelt')).toBe(false);
    const noBar = setBag(s, 'bar', null);
    expect(noBar.bags.bar).toBeUndefined();
    expect(noBar.items.find((x) => x.itemId === 'quilt').slot).toBe(null);
  });
});

describe('a setup and a trip', () => {
  const tr = { id: 't', bikeId: bike.id, setup: { seat: 'seat13', carry: 'pack' }, entries: [{ itemId: 'quilt', slot: 'seat', qty: 1, packed: true }, { itemId: 'regen', slot: 'top', qty: 1 }, { itemId: 'riegel', slot: 'body', qty: 1 }] };

  it('takes the bags and puts the items the setup knows into their places', () => {
    const out = applySetup(tr, bike.setups[0]);
    expect(out.setupId).toBe('bp');
    expect(out.setup).toEqual({ ...bike.setups[0].bags, carry: 'pack' });
    expect(out.entries[0]).toMatchObject({ itemId: 'quilt', slot: 'bar', packed: false });
    expect(out.entries[1].slot).toBe('seat'); // no top tube bag in the setup: the usual fallback
    expect(out.entries[2].slot).toBe('body');
    expect(movesOf(tr, bike.setups[0])).toBe(2);
  });

  it('places entries without touching the ones already right', () => {
    const e = [{ itemId: 'zelt', slot: 'seat', qty: 1, packed: true }];
    expect(placeBySetup(e, bike.setups[0])[0]).toBe(e[0]);
  });

  it('knows when a trip differs from its setup, and takes the trip over into it', () => {
    const t1 = { ...applySetup({ entries: [{ itemId: 'zelt', slot: 'seat', qty: 1 }] }, bike.setups[0]) };
    expect(tripDiffers(t1, bike.setups[0])).toBe(false);
    // a thing the setup does not know is the template's part: no difference
    expect(tripDiffers({ ...t1, entries: [...t1.entries, { itemId: 'regen', slot: 'seat', qty: 1 }] }, bike.setups[0])).toBe(false);
    const moved = { ...t1, entries: [{ itemId: 'zelt', slot: 'frame', qty: 1 }] };
    expect(tripDiffers(moved, bike.setups[0])).toBe(true);
    const taken = takeFromTrip(bike.setups[0], moved);
    expect(taken.items).toEqual([{ itemId: 'zelt', slot: 'frame', qty: 1 }]);
    expect(taken.name).toBe('Bikepacking');
    expect(fromTrip({ setup: { seat: 'seat13', carry: 'p' }, entries: [{ itemId: 'x', slot: 'carry' }] })).toEqual({ bags: { seat: 'seat13' }, items: [] });
  });

  it('a new trip starts with the setup of the last trip on the bike', () => {
    const last = trip('old', '2026-10-01', 'bp', [{ itemId: 'quilt', slot: 'seat', qty: 1 }]);
    const t = newTrip({ title: 'Jura', startDate: '2026-10-17', days: 3, bike }, [last], items, 0);
    expect(t.setupId).toBe('bp');
    expect(t.setup.bar).toBe('bar');
    expect(t.entries.find((e) => e.itemId === 'quilt').slot).toBe('bar');
    const plain = newTrip({ title: 'Erste', startDate: '2026-10-17', days: 1, bike }, [], items, 0);
    expect(plain.setupId).toBe(STD);
  });

  it('another bike brings its suggested setup', () => {
    const t = switchBike({ entries: [{ itemId: 'quilt', slot: 'seat', qty: 1 }], setup: {} }, bike, [trip('o', '2026-10-01', 'bp')]);
    expect(t.setupId).toBe('bp');
    expect(t.entries[0].slot).toBe('bar');
    expect(switchBike({ entries: [], setup: {} }, bike).setupId).toBe(STD);
  });
});

describe('the numbers of a setup', () => {
  const calc = setupCalc(bike.setups[0], bike, items, containers);

  it('counts per bag empty weight, contents and water, front to back', () => {
    expect(calc.list.map((b) => b.key)).toEqual(['bar', 'frame', 'cage1', 'seat']);
    expect(calc.list.map((b) => b.n)).toEqual([1, 2, 3, 4]);
    const seat = calc.list.find((b) => b.key === 'seat');
    expect(seat).toMatchObject({ emptyG: 400, contentG: 1000, waterG: 0, sumG: 1400 });
    const cage = calc.list.find((b) => b.key === 'cage1');
    expect(cage).toMatchObject({ emptyG: 0, contentG: 0, waterG: 750 }); // cages are weighed with the bike
  });

  it('adds up bike, empty bags, gear, food and water and splits front / middle / rear', () => {
    // Noah «3a»: base weight = bike + empty bags + gear; food (the bars) and water only in the total.
    expect(calc).toMatchObject({ bikeG: 9400, bagsG: 900, contentG: 1600, foodG: 240, waterG: 750, baseG: 9400 + 900 + 1600, totalG: 9400 + 900 + 1600 + 240 + 750, missing: 0 });
    expect(calc.sides).toEqual({ front: 900, middle: 440 + 750, rear: 1400 });
    expect(calc.shares.front + calc.shares.middle + calc.shares.rear).toBe(100);
  });

  it('compares two setups place by place and lists what only one has', () => {
    const std = setupCalc({ ...setupsOf(bike)[0], items: [{ itemId: 'regen', slot: 'seat', qty: 1 }] }, bike, items, containers);
    const cmp = compareTwo(calc, std);
    expect(cmp.rows.map((r) => r.key)).toEqual(['bar', 'frame', 'cage1', 'seat']);
    expect(cmp.rows[0]).toMatchObject({ key: 'bar', b: null, diff: -900 });
    expect(cmp.totals.find((x) => x.key === 'totalG').diff).toBe(std.totalG - calc.totalG);
    expect(cmp.onlyA.sort()).toEqual(['quilt', 'riegel', 'wasser', 'zelt']);
    expect(cmp.onlyB).toEqual(['regen']);
    expect(tablePlaces([calc, std])).toEqual(['bar', 'frame', 'cage1', 'seat']);
  });
});

describe('bottles (Noah «3a»)', () => {
  it('an empty bottle is gear in the base weight, the water in it is not', () => {
    const its = [...items, { id: 'flasche', name: 'Flasche leer', weightG: 80, volumeL: 0.75, category: 'bike' }];
    const c = setupCalc({ id: 'x', bags: { cage1: 'cage' }, items: [{ itemId: 'flasche', slot: 'cage1', qty: 1 }, { itemId: 'wasser', slot: 'cage1', qty: 1 }] }, bike, its, containers);
    expect(c).toMatchObject({ contentG: 80, waterG: 750, baseG: 9400 + c.bagsG + 80, totalG: 9400 + c.bagsG + 80 + 750 });
  });
});

describe('a full bottle cage is not «too full» (fix seen in TS5)', () => {
  it('warns from 80 % in a bag, but a cage only above its litres', () => {
    expect(tooFull({ key: 'seat', bag: { volumeL: 10, slot: 'seat' }, vol: 8.5 })).toBe(true);
    expect(tooFull({ key: 'cage1', bag: { volumeL: 0.75, slot: 'cage1' }, vol: 0.75 })).toBe(false);
    expect(tooFull({ key: 'cage1', bag: { volumeL: 0.75, slot: 'cage1' }, vol: 1.5 })).toBe(true);
  });

  it('a 0.75 L bottle in a 0.75 L cage is not «over 0.75 L»', () => {
    const byId = { wasser: { volumeL: 0.75 } };
    expect(litreWarning({ bag: { volumeL: 0.75 }, entries: [{ itemId: 'wasser', qty: 1 }] }, byId)).toBe(null);
    expect(litreWarning({ bag: { volumeL: 0.75 }, entries: [{ itemId: 'wasser', qty: 2 }] }, byId)).toMatchObject({ need: 1.5, cap: 0.75 });
  });
});
