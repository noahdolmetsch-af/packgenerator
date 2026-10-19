// Paket U3 «Live-Karte»: where «Start a ride» leads, the ride afterwards (summary, debrief row, bike km),
// the evening line of a day and the live point of the family link. Fictional data only.
import { describe, it, expect } from 'vitest';
import { todayTrip, liveHref, liveToday } from '../src/lib/live/start.js';
import { fixesOf, hmOf, rideSummary, rideRowOf, rideIdOf, countedRides, bikeKmPlan, bikeEntryOf, daySum, durText, GUESS_KMH } from '../src/lib/live/after.js';
import { withLive, liveOf, liveFresh, homeOf, refreshFamilyLink, LIVE_MAX_MIN } from '../src/lib/live/familylive.js';
import { readPayload, LINK_V } from '../src/lib/spur/link.js';
import { TILE, READY } from '../src/lib/home/tiles.js';

// 10:00 in Zurich on a Saturday in summer (08:00 UTC)
const T0 = Date.UTC(2027, 6, 10, 8, 0);
const LAT = 47.0;
const LON = 8.0;
const KM_LAT = 1 / 111.2; // one km north in degrees

/** A made-up recording: 10 km north in 30 min, a 10 min stop, 5 km more in 15 min; a point every 30 s. */
function ride({ id = 'rec-test', tripId = 'test_trip', bikeId } = {}) {
  const pts = [];
  let s = 0;
  for (let i = 0; i <= 60; i++, s += 30) pts.push([LAT + (10 * KM_LAT * i) / 60, LON, s]);
  const stopLat = pts.at(-1)[0];
  for (let i = 1; i <= 20; i++, s += 30) pts.push([stopLat, LON, s]);
  for (let i = 1; i <= 30; i++, s += 30) pts.push([stopLat + (5 * KM_LAT * i) / 30, LON, s]);
  return { id, kind: 'rec', tripId, day: '2027-07-10', startAt: T0, endAt: T0 + pts.at(-1)[2] * 1000, pts, km: 15, ...(bikeId ? { bikeId } : {}) };
}

describe('start a ride', () => {
  const trips = [
    { id: 'test_a', title: 'test_ Seerunde', startDate: '2027-07-09', days: 3 },
    { id: 'test_b', title: 'test_ Wanderung', startDate: '2027-07-10', days: 1, packs: [] },
    { id: 'test_c', title: 'test_ Vorbei', startDate: '2027-07-01', days: 2 },
    { id: 'test_d', title: 'test_ Abgesagt', startDate: '2027-07-10', days: 1, skipped: true },
  ];
  it('leads to the trip of today, a bike trip first', () => {
    expect(todayTrip(trips, '2027-07-10').id).toBe('test_a');
    expect(liveToday(trips, '2027-07-10')).toBe('#/live/test_a');
    expect(todayTrip(trips.slice(1), '2027-07-10').id).toBe('test_b');
  });
  it('without a trip today: a free ride', () => {
    expect(todayTrip(trips, '2027-08-01')).toBeNull();
    expect(liveToday(trips, '2027-08-01')).toBe('#/live');
    expect(liveHref(null)).toBe('#/live');
    expect(todayTrip([{ ...trips[0], finished: '2027-07-10' }], '2027-07-10')).toBeNull();
  });
  it('the tile is in the catalog, small or wide, but not on the ready wall (HN4 stays)', () => {
    expect(TILE.liveride).toMatchObject({ area: 'trips', sizes: ['s', 'w'], since: '0.159.0', label: 'Start a ride' });
    expect(READY.some((x) => x.id === 'liveride')).toBe(false);
  });
});

describe('after the ride: the summary', () => {
  it('km, riding against stopped time and the pause with its km', () => {
    const s = rideSummary(ride());
    expect(s.km).toBe(15);
    expect(s.stops).toHaveLength(1);
    expect(s.stoppedS).toBe(600);
    expect(s.movingS).toBe(45 * 60);
    expect(s.totalS).toBe(55 * 60);
    expect(s.stops[0].km).toBeCloseTo(10, 0);
    expect(s.hm).toBeNull();
  });
  it('Hm only from a route with a profile that the ride follows', () => {
    const line = [[LAT, LON], [LAT + 20 * KM_LAT, LON]];
    const trip = { id: 'test_trip', route: { km: 20, line, profile: [[0, 400], [10, 700], [15, 650], [20, 900]] } };
    expect(hmOf(ride(), trip)).toBe(300);
    expect(rideSummary(ride(), trip).hm).toBe(300);
    // far off the route: no guess
    const off = { ...trip, route: { ...trip.route, line: [[LAT + 1, LON + 1], [LAT + 1.2, LON + 1]] } };
    expect(hmOf(ride(), off)).toBeNull();
    expect(hmOf(ride(), { route: { km: 20, line } })).toBeNull();
  });
  it('fixes carry the time from the start', () => {
    const f = fixesOf(ride());
    expect(f[1].at - f[0].at).toBe(30_000);
    expect(fixesOf(null)).toEqual([]);
  });
  it('durations read short', () => {
    expect(durText(35 * 60)).toBe('35 min');
    expect(durText(125 * 60)).toBe('2:05 h');
  });
});

describe('after the ride: the debrief row', () => {
  it('looks like an uploaded GPX ride, one per recording', () => {
    const r = rideRowOf(ride(), { trip: { id: 'test_trip', title: 'test_ Seerunde' }, now: new Date(T0) });
    expect(r.id).toBe(rideIdOf(ride()));
    expect(r).toMatchObject({ name: 'test_ Seerunde', date: '2027-07-10', km: 15, tripId: 'test_trip', source: 'live', pace: false, pauseH: 0.17, movingH: 0.75, totalH: 0.92 });
    expect(r.pauses).toEqual([{ km: 10, at: new Date(T0 + 30 * 60_000).toISOString(), min: 10 }]);
    expect(r.line.length).toBeGreaterThan(10);
    expect(r.line.length).toBeLessThanOrEqual(200);
    expect(r.startAt).toBe(new Date(T0).toISOString());
  });
});

describe('after the ride: bike km, not twice', () => {
  const at = (ms) => new Date(ms).toISOString();
  const act = (start, min, id = 's1') => ({ id, kind: 'bike', start: at(start), elapsedS: min * 60, movingS: min * 50 });
  it('counts when nothing overlaps', () => {
    expect(bikeKmPlan(ride(), 'test_bike', { acts: [act(T0 - 5 * 36e5, 60)], entries: [] })).toEqual({ count: true, why: '' });
  });
  it('a Strava ride of the same bike at the same time counts already', () => {
    const entries = [{ id: 'km1', kind: 'ride', state: 'counted', source: 'strava', stravaId: 's1', bikeId: 'test_bike', km: 15 }];
    expect(bikeKmPlan(ride(), 'test_bike', { acts: [act(T0 + 10 * 60_000, 60)], entries }).why).toBe('overlap');
    // another bike: the live km count
    expect(bikeKmPlan(ride(), 'test_other', { acts: [act(T0 + 10 * 60_000, 60)], entries }).count).toBe(true);
    // an activity with no bike in the ledger: better not twice
    expect(bikeKmPlan(ride(), 'test_bike', { acts: [act(T0, 60, 's9')], entries: [] }).why).toBe('overlap');
    // a run does not count
    expect(bikeKmPlan(ride(), 'test_bike', { acts: [{ ...act(T0, 60, 's9'), kind: 'run' }], entries: [] }).count).toBe(true);
  });
  it('a ledger ride from a file without an activity counts with a guessed duration', () => {
    const e = { id: 'km2', kind: 'ride', state: 'counted', source: 'fit', bikeId: 'test_bike', km: GUESS_KMH, time: at(T0 - 30 * 60_000) };
    expect(countedRides([], [e])).toEqual([{ start: T0 - 30 * 60_000, end: T0 + 30 * 60_000, bikeId: 'test_bike' }]);
    expect(bikeKmPlan(ride(), 'test_bike', { entries: [e] }).why).toBe('overlap');
    expect(countedRides([], [{ ...e, source: 'hand' }])).toEqual([]);
  });
  it('added once; no km, nothing to add', () => {
    const r = { ...ride(), kmId: 'km-live' };
    expect(bikeKmPlan(r, 'test_bike', { entries: [{ id: 'km-live', kind: 'ride', state: 'counted' }] }).why).toBe('added');
    expect(bikeKmPlan(r, 'test_bike', { entries: [] }).count).toBe(true);
    expect(bikeKmPlan({ ...ride(), km: 0 }, 'test_bike').why).toBe('none');
  });
  it('the ledger entry: the day, the km, by hand from the user', () => {
    expect(bikeEntryOf(ride(), 'test_bike', { name: 'test_ Seerunde', note: 'Live map' })).toMatchObject({ bikeId: 'test_bike', date: '2027-07-10', km: 15, kind: 'ride', source: 'hand', sure: 'user', tripId: 'test_trip', note: 'Live map' });
  });
});

describe('Reise-Spur: the evening line of a day', () => {
  it('sums the closed recordings of that day', () => {
    const a = ride();
    const b = { ...ride({ id: 'rec-2' }), km: 5 };
    const open = { ...ride({ id: 'rec-3' }), open: true };
    const s = daySum([a, b, open, { kind: 'place', day: '2027-07-10' }], '2027-07-10');
    expect(s).toEqual({ km: 20, movingS: 90 * 60, stoppedS: 1200, n: 2 });
    expect(daySum([a], '2027-07-11')).toBeNull();
  });
});

describe('family link: the live point', () => {
  const payload = { v: LINK_V, t: 'test_ Seerunde', d: '2027-07-09', n: 1, km: 15, at: new Date(T0).toISOString(), days: [{ d: '2027-07-10', km: 15, l: [], p: [], x: [] }] };
  it('goes into the payload and back out of it', () => {
    const p = withLive(payload, { lat: 47.123456789, lon: 8.1, at: T0 }, { home: [LAT, LON] });
    expect(p.live).toEqual({ lat: 47.12346, lon: 8.1, at: new Date(T0).toISOString() });
    const back = readPayload(p);
    expect(liveOf(back)).toEqual({ pos: [47.12346, 8.1], at: new Date(T0).toISOString() });
    expect(liveOf(readPayload(payload))).toBeNull();
  });
  it('never near home when the 500 m are left out', () => {
    expect(withLive(payload, { lat: LAT + 0.001, lon: LON }, { home: [LAT, LON], now: T0 }).live).toBeUndefined();
    expect(withLive(payload, { lat: LAT + 0.001, lon: LON }, { home: [LAT, LON], now: T0, cut: false }).live).toBeTruthy();
    // an old point goes when there is no place now
    expect(withLive({ ...payload, live: { lat: 1, lon: 1, at: 'x' } }, null).live).toBeUndefined();
  });
  it('shows only while it is younger than 30 minutes', () => {
    const l = { pos: [47, 8], at: new Date(T0).toISOString() };
    expect(liveFresh(l, T0 + 10 * 60_000)).toBe(true);
    expect(liveFresh(l, T0 + (LIVE_MAX_MIN + 1) * 60_000)).toBe(false);
    expect(liveFresh(null, T0)).toBe(false);
  });
  it('the tour start is the first shown point', () => {
    expect(homeOf({ days: [{ lines: [{ hidden: true, pts: [[1, 1], [2, 2]] }, { pts: [[3, 3], [4, 4]] }] }] })).toEqual([3, 3]);
    expect(homeOf(null)).toBeNull();
  });
  it('without a link nothing is sent', async () => {
    let sent = 0;
    const db = { trips: { get: async () => ({ id: 'test_trip', spurLink: null }) } };
    expect(await refreshFamilyLink({ id: 'test_trip' }, { lat: 47, lon: 8 }, { db, put: async () => sent++ })).toBe('no-link');
    expect(sent).toBe(0);
    expect(await refreshFamilyLink(null, null, { db })).toBe('no-link');
  });
});
