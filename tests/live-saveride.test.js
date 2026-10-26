// Live Navigation M9/M10 (Noah 26.10.2026): «Fahrt beenden» keeps every ride as its own entry in Touren,
// labelled «Live Navigation», and books the bike km by themselves. Fictional data only.
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { createDb } from '../src/lib/db.js';
import { saveLiveRide, bookBikeKm, bikeFor, rememberBike, isLiveRide, LIVE_BIKE_KEY, LIVE_LABEL } from '../src/lib/live/saveride.js';
import { rideIdOf } from '../src/lib/live/after.js';
import { tripFacts } from '../src/lib/review/rueckblick.js';
import { kindOf, KINDS } from '../src/lib/touren/filter.js';
import DE from '../src/lib/i18n/de/index.js';

const T0 = Date.UTC(2027, 6, 10, 8, 0);
const KM_LAT = 1 / 111.2;
function rec(id = 'rec-test-1') {
  const pts = [];
  for (let i = 0; i <= 40; i++) pts.push([47 + (10 * KM_LAT * i) / 40, 8, i * 45]);
  return { id, kind: 'rec', tripId: null, day: '2027-07-10', startAt: T0, endAt: T0 + 40 * 45 * 1000, pts, km: 10, open: false };
}

let db;
beforeEach(async () => {
  db = createDb(`saveride-${Math.random()}`);
  await db.open();
});

describe('saving a live ride', () => {
  it('makes one ride row per recording, labelled live', async () => {
    const r = rec();
    await db.tracks.put(r);
    const row = await saveLiveRide(db, r, { name: 'test_ Fahrt' });
    expect(row.id).toBe(rideIdOf(r));
    expect(isLiveRide(row)).toBe(true);
    expect(row.km).toBe(10);
    // a second ride is a second entry
    const r2 = rec('rec-test-2');
    await saveLiveRide(db, r2, { name: 'test_ Fahrt 2' });
    expect(await db.rides.count()).toBe(2);
  });
  it('a second save keeps the same row, its answers and its name', async () => {
    const r = rec();
    await saveLiveRide(db, r, { name: 'test_ Erst' });
    await db.rides.update(rideIdOf(r), { answers: { felt: 'good' }, name: 'test_ Umbenannt' });
    await saveLiveRide(db, r, { name: 'test_ Erst' });
    const all = await db.rides.toArray();
    expect(all).toHaveLength(1);
    expect(all[0].answers).toEqual({ felt: 'good' });
    expect(all[0].name).toBe('test_ Umbenannt');
  });
  it('shows up in Touren as its own row of the kind «Live Navigation»', async () => {
    const row = await saveLiveRide(db, rec(), { name: 'test_ Fahrt' });
    const facts = tripFacts({ rides: [row], today: '2027-07-11' });
    expect(facts).toHaveLength(1);
    expect(facts[0].live).toBe(true);
    expect(kindOf(facts[0])).toBe('live');
    expect(KINDS.map((k) => k.key)).toContain('live');
    expect(LIVE_LABEL).toBe('Live Navigation');
    // an uploaded GPX ride stays «Fahrt aus GPX»
    expect(kindOf({ kind: 'ride', live: false })).toBe('ride');
  });
});

describe('the bike km', () => {
  const bikes = [
    { id: 'test_b1', name: 'test_ Gravel', kind: 'gravel' },
    { id: 'test_b2', name: 'test_ Renner', kind: 'road' },
  ];
  it('takes the trip bike, else the last one used, else the first', () => {
    expect(bikeFor({ bikeId: 'test_b2' }, bikes).id).toBe('test_b2');
    expect(bikeFor(null, bikes, 'test_b2').id).toBe('test_b2');
    expect(bikeFor(null, bikes, 'gone')).not.toBeNull();
    expect(bikeFor(null, [])).toBeNull();
  });
  it('books them once, and the recording knows the entry', async () => {
    await db.bikes.bulkPut(bikes);
    await rememberBike(db, 'test_b2');
    expect((await db.settings.get(LIVE_BIKE_KEY)).value).toBe('test_b2');
    const r = rec();
    await db.tracks.put(r);
    const b = await bookBikeKm(db, r, { name: 'test_ Fahrt' });
    expect(b.bike.id).toBe('test_b2');
    expect(b.entry.km).toBe(10);
    const kept = await db.tracks.get(r.id);
    expect(kept.kmId).toBe(b.entry.id);
    // not twice
    expect(await bookBikeKm(db, kept, { name: 'test_ Fahrt' })).toBeNull();
  });
  it('books nothing without a bike', async () => {
    const r = rec();
    await db.tracks.put(r);
    expect(await bookBikeKm(db, r)).toBeNull();
  });
});

describe('German words', () => {
  it('every new text has its German entry', () => {
    for (const k of ['End the ride?', 'End and save', 'Ride {date}', 'Saved in Trips. {km} km added to {bike}.', 'Saved in Trips as «Live Navigation».', 'Saved as its own entry in Trips.', 'Open Trips', 'Wrong bike? Take the km back', 'Live Navigation']) expect(DE[k], k).toBeTruthy();
  });
});
