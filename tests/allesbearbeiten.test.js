// «Alles selbst bearbeiten» (Noah 19.10.2026): a bike can always be deleted; its trips go to another bike
// or to none, what belongs to the bike alone goes with it, and Undo brings everything back. Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { bikeLinks, deleteBike, undoDeleteBike, moveTrip } from '../src/lib/bikedelete.js';
import { applyLists } from '../src/lib/lists.js';
import { DOMAINS, TRIP_DOMAINS, DOMAIN, domainOf } from '../src/lib/domains.js';
import { SLOT } from '../src/lib/bikes.js';
import { PART } from '../src/lib/care.js';
import { listFor } from '../src/lib/standard.js';

const fresh = async () => {
  const db = createDb(`alles-${Math.random().toString(36).slice(2)}`);
  await db.bikes.bulkPut([
    { id: 'blau', name: 'Testvelo Blau', slots: [], setup: {} },
    { id: 'rot', name: 'Testvelo Rot', slots: [], setup: {} },
  ]);
  await db.trips.bulkPut([
    { id: 'T1', title: 'Testtour Eins', bikeId: 'blau', bike: 'Testvelo Blau', setup: { seat: 'B1' } },
    { id: 'T2', title: 'Testtour Zwei', bikeId: 'rot', bike: 'Testvelo Rot' },
  ]);
  await db.kmBook.bulkPut([{ id: 'K1', bikeId: 'blau', date: '2026-10-01', state: 'counted', km: 40 }, { id: 'K2', bikeId: 'rot', date: '2026-10-02', state: 'counted', km: 20 }]);
  await db.visits.put({ id: 'V1', bikeId: 'blau', date: '2026-09-01', parts: [] });
  await db.photos.put({ id: 'P1', bikeId: 'blau', tripId: null });
  await db.maintenance.put({ id: 1, bikeId: 'blau', task: 'Kette prüfen', status: 'open' });
  return db;
};

describe('deleting a bike', () => {
  it('counts what is linked to it', async () => {
    const db = await fresh();
    expect(await bikeLinks(db, 'blau')).toEqual({ trips: 1, km: 1, visits: 1, photos: 1, tasks: 1 });
  });

  it('moves its trips to no bike by default and takes its own records with it', async () => {
    const db = await fresh();
    const snap = await deleteBike(db, 'blau');
    expect(await db.bikes.get('blau')).toBeUndefined();
    const t1 = await db.trips.get('T1');
    expect([t1.bikeId, t1.bike, t1.title]).toEqual([null, null, 'Testtour Eins']);
    expect(await db.kmBook.get('K1')).toBeUndefined();
    expect(await db.kmBook.get('K2')).toBeTruthy(); // the other bike keeps its km
    expect(await db.visits.count()).toBe(0);
    expect(await db.photos.count()).toBe(0);
    expect(await db.maintenance.count()).toBe(0);
    expect(snap.trips).toHaveLength(1);
  });

  it('gives its trips to the chosen bike', async () => {
    const db = await fresh();
    await deleteBike(db, 'blau', 'rot');
    const t1 = await db.trips.get('T1');
    expect([t1.bikeId, t1.bike]).toEqual(['rot', 'Testvelo Rot']);
    expect(t1.setup).toEqual({ seat: 'B1' }); // the trip keeps its own bags
  });

  it('Undo brings the bike and everything linked back as it was', async () => {
    const db = await fresh();
    const snap = await deleteBike(db, 'blau', 'rot');
    await undoDeleteBike(db, snap);
    expect((await db.bikes.get('blau')).name).toBe('Testvelo Blau');
    expect((await db.trips.get('T1')).bikeId).toBe('blau');
    expect(await db.kmBook.get('K1')).toBeTruthy();
    expect(await db.visits.count()).toBe(1);
    expect(await db.photos.count()).toBe(1);
    expect(await db.maintenance.count()).toBe(1);
  });

  it('a missing bike changes nothing', async () => {
    const db = await fresh();
    expect(await deleteBike(db, 'gibtsnicht')).toBeNull();
    expect(await db.trips.count()).toBe(2);
  });

  it('moveTrip is pure', () => {
    const trip = { id: 'X', bikeId: 'a', bike: 'A' };
    expect(moveTrip(trip, { id: 'b', name: 'B' })).toEqual({ id: 'X', bikeId: 'b', bike: 'B' });
    expect(moveTrip(trip, null)).toEqual({ id: 'X', bikeId: null, bike: null });
    expect(trip.bikeId).toBe('a');
  });
});

// Sports, places on the bike and care parts (Ich › Listen und Typen): the person's list reaches the app.

describe('own lists: sports, places, care parts', () => {
  const all = {
    domains: { names: { ski: 'Testskitour' }, hidden: ['weekend'], deleted: ['travel'], own: [{ id: 'own-tennis', name: 'Testtennis' }], order: ['hiking'] },
    bikeSlots: { names: { seat: 'Testsattel' } },
    careParts: { names: { chain: 'Testkette' } },
  };
  it('renames, hides, deletes, adds and orders the sports', () => {
    applyLists(all);
    expect(DOMAINS[0].key).toBe('hiking');
    expect(DOMAIN.ski.name).toBe('Testskitour');
    expect(TRIP_DOMAINS.some((d) => d.key === 'weekend')).toBe(false);
    expect(TRIP_DOMAINS.some((d) => d.key === 'travel')).toBe(false);
    expect(TRIP_DOMAINS.find((d) => d.key === 'own-tennis')?.packs).toHaveLength(1);
    // an old trip of a deleted or hidden sport keeps it
    expect(domainOf({ domain: 'travel' })).toBe('travel');
    expect(domainOf({ domain: 'weekend' })).toBe('weekend');
    // the Standard list itself never changes
    expect(listFor('domains', {}).find((e) => e.id === 'ski').name).toBe('Ski touring');
  });
  it('renames places and parts, and «Back to Standard» brings the names back', () => {
    applyLists(all);
    expect(SLOT.seat.name).toBe('Testsattel');
    expect(PART.chain.name).toBe('Testkette');
    applyLists({});
    expect(SLOT.seat.name).toBe('Seat pack');
    expect(PART.chain.name).toBe('Chain');
    expect(DOMAIN.ski.name).toBe('Ski touring');
    expect(TRIP_DOMAINS.some((d) => d.key === 'weekend')).toBe(true);
  });
});
