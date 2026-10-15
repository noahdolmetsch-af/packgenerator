import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { startContainers, completeBike, ensureBikeSetup, bikeSetup, containerWeight } from '../src/lib/bikes.js';

const bag = (id, extra) => ({ id, name: id, category: 'bags', weightG: null, qty: 1, ownership: 'owned', ...extra });
const items = [
  bag('TA02', { name: 'Seat pack', volumeL: 16.5 }),
  bag('TA03', { name: 'Side bags', volumeL: 15, weightG: 450, qty: 2 }),
  bag('TA06', { name: 'Top tube bag', volumeL: 1, weightG: 200 }),
  bag('TA08', { name: 'Food pouches', volumeL: 1, weightG: 50, qty: 2 }),
];

describe('bikes and bags', () => {
  it('builds the bag list from the gear that exists', () => {
    const c = startContainers(items);
    const ids = c.map((b) => b.id);
    expect(ids).toEqual(['bag-TA02', 'bag-TA03', 'bag-TA06', 'bag-TA08-L', 'bag-TA08-R', 'bag-cargo', 'bag-mini']);
    expect(c.find((b) => b.id === 'bag-TA03')).toMatchObject({ slot: 'side', volumeL: 30, pieces: 2 });
    expect(containerWeight(c.find((b) => b.id === 'bag-TA03'), Object.fromEntries(items.map((i) => [i.id, i])))).toBe(900);
  });

  it('an empty app or other gear gets no start bags (no cargo cage, no mini bag)', async () => {
    expect(startContainers([])).toEqual([]);
    expect(startContainers([bag('X1', { name: 'Some bag' })])).toEqual([]);
    const db = createDb('bikes-empty');
    await ensureBikeSetup(db);
    expect(await db.containers.count()).toBe(0);
  });

  it('completes a bike once and keeps what is already set', () => {
    const c = startContainers(items);
    // Data cleanup 14.10.2026: no weight from the logbook for one bike ID any more; the weight stays open.
    const b = completeBike({ id: 'scott-hardtail', name: 'Scott' }, c);
    expect(b.weightG).toBe(null);
    expect(b.setup).toEqual({ seat: 'bag-TA02', top: 'bag-TA06', pouchL: 'bag-TA08-L', pouchR: 'bag-TA08-R' });
    expect(completeBike({ id: 'gravel', name: 'Gravel' }, c).weightG).toBe(null);
    const mine = { id: 'gravel', weightG: 9000, slots: ['seat'], setup: { seat: null } };
    expect(completeBike(mine, c)).toEqual(mine);
  });

  it('sums the bags on a bike', () => {
    const c = startContainers(items);
    const bike = completeBike({ id: 'x' }, c);
    const s = bikeSetup(bike, c, items);
    expect(s.bagCount).toBe(4);
    expect(s.volumeL).toBe(19.5);
    expect(s.bagsG).toBe(300);
    expect(s.unweighed).toBe(1);
  });

  it('sets up an imported database once, then changes nothing', async () => {
    const db = createDb('bikes-test');
    await db.items.bulkPut(items);
    await db.bikes.bulkPut([{ id: 'fully', name: 'Fully' }]);
    expect(await ensureBikeSetup(db)).toBe(1);
    expect(await db.containers.count()).toBe(7);
    await db.bikes.update('fully', { weightG: 14500 });
    expect(await ensureBikeSetup(db)).toBe(0);
    expect((await db.bikes.get('fully')).weightG).toBe(14500);
  });
});

import { parseBikesHash, bikesHash, editHash, withBack } from '../src/lib/bikes.js';

describe('Bikes page address (v0.21.0)', () => {
  it('reads the tab and the bike, the old #/care lands on Care', () => {
    expect(parseBikesHash('#/bikes')).toEqual({ tab: 'setup', bike: null, open: false });
    expect(parseBikesHash('#/care')).toEqual({ tab: 'care', bike: null, open: false });
    expect(parseBikesHash('#/bikes?tab=care&bike=factor-ls&open=1')).toEqual({ tab: 'care', bike: 'factor-ls', open: true });
    expect(parseBikesHash('#/bikes?bike=fully')).toEqual({ tab: 'setup', bike: 'fully', open: false });
  });
  it('writes the address back the same way', () => {
    expect(bikesHash()).toBe('#/bikes');
    expect(bikesHash({ tab: 'care' })).toBe('#/bikes?tab=care');
    expect(bikesHash({ tab: 'care', bike: 'factor-ls', open: true })).toBe('#/bikes?tab=care&bike=factor-ls&open=1');
    expect(parseBikesHash(bikesHash({ tab: 'care', bike: 'x y' })).bike).toBe('x y');
  });
});

describe('Bugfix Dateneingabe: one value of a bike opened for typing, then back to the sheet', () => {
  it('reads and writes edit, back and from on «Compare bikes»', () => {
    const href = editHash('b1', 'fit:seatHeight');
    expect(href).toBe('#/bikes?tab=compare&view=all&bike=b1&edit=fit%3AseatHeight');
    expect(parseBikesHash(href)).toEqual({ tab: 'compare', bike: 'b1', open: false, view: 'all', edit: 'fit:seatHeight' });
    const there = withBack(href, 'pickup', 'shop');
    expect(parseBikesHash(there)).toEqual({ tab: 'compare', bike: 'b1', open: false, view: 'all', edit: 'fit:seatHeight', back: 'pickup', from: 'shop' });
    expect(bikesHash(parseBikesHash(there))).toBe(there);
  });
  it('leaves other addresses alone and ignores a strange value', () => {
    expect(withBack('#/bikes?bike=b1&open=1', 'pass')).toBe('#/bikes?bike=b1&open=1');
    expect(parseBikesHash('#/bikes?tab=compare&view=all&bike=b1&edit=<x>').edit).toBeUndefined();
    expect(parseBikesHash('#/bikes?tab=compare&view=all&edit=fit:seatHeight').edit).toBeUndefined();
  });
});
