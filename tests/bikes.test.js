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

  it('completes a bike once and keeps what is already set', () => {
    const c = startContainers(items);
    const b = completeBike({ id: 'scott-hardtail', name: 'Scott' }, c, { bikeWeightG: 13000 });
    expect(b.weightG).toBe(13000);
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
