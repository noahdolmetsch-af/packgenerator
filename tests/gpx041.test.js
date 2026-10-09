// v0.41.0 "GPX → Learning": pauses, planned vs real and the learnings from an uploaded ride.
// The rides are synthetic (tests/test_data_gtp_gpx.js), nothing from a real ride.
import { describe, it, expect, afterEach } from 'vitest';
import { analyseRide, ridePoints, findPauses, plannedFor, compareRide, rideLearnings, learningFrom, addToPace, dropFromPace, tripsOn, tripFromRide, speedOf, hm, PAUSE_MIN } from '../src/lib/gpx.js';
import { lang } from '../src/lib/i18n.svelte.js';
import DE from '../src/lib/i18n/de/index.js';
import { makeGpx } from './test_data_gtp_gpx.js';

afterEach(() => (lang.v = 'en'));
const STD = { kmh: 16, climbMh: 600 };

describe('pauses: 5 minutes or more is a pause, shorter stops are moving time', () => {
  const gpx = makeGpx({
    legs: [{ km: 20, kmh: 20 }, { stopMin: 3 }, { km: 20, kmh: 20 }, { stopMin: 30 }, { km: 10, kmh: 20 }, { stopMin: PAUSE_MIN }, { km: 10, kmh: 20 }],
  });
  const r = analyseRide(gpx, 'test_data_gtp_ride.gpx');

  it('counts two pauses (30 and 5 min); the 3-minute stop is moving time', () => {
    expect(r.pauses.map((p) => p.min)).toEqual([30, 5]);
    expect(r.pauses[0].km).toBeCloseTo(40, 0);
    expect(r.pauses[1].km).toBeCloseTo(50, 0);
    expect(r.pauseH).toBeCloseTo(35 / 60, 2);
    // 60 km at 20 km/h = 3 h, plus the 3-minute stop
    expect(r.movingH).toBeCloseTo(3 + 3 / 60, 1);
    expect(r.totalH).toBeCloseTo(r.movingH + r.pauseH, 2);
    expect(r.km).toBeCloseTo(60, 0);
    expect(speedOf(r)).toBeCloseTo(60 / r.movingH, 0);
  });

  it('a stop at the start or the end (the watch running at home) is neither a pause nor riding time', () => {
    const x = analyseRide(makeGpx({ legs: [{ stopMin: 15 }, { km: 20, kmh: 20 }, { stopMin: 40 }] }));
    expect(x.pauses).toEqual([]);
    expect(x.totalH).toBeCloseTo(1, 1);
    expect(x.movingH).toBeCloseTo(1, 1);
  });

  it('a watch on auto-pause (a gap in time, same place) is a pause too', () => {
    const text = makeGpx({ legs: [{ km: 5, kmh: 20 }, { km: 5, kmh: 20 }] });
    const pts = ridePoints(text);
    // move the second half 12 minutes later, as if the watch had stopped recording
    const half = Math.floor(pts.length / 2);
    const shifted = pts.map((p, i) => ({ ...p, t: i > half ? p.t + 12 * 60000 : p.t }));
    // the point after the gap is only 10 s of riding away: 12 minutes for 55 m is standing
    const stops = findPauses(shifted);
    expect(stops.length).toBe(1);
    expect(Math.round(stops[0].ms / 60000)).toBe(12);
  });

  it('a planned route without times is refused with a plain message', () => {
    const plan = '<gpx><trk><trkseg><trkpt lat="46.5" lon="7.5"><ele>400</ele></trkpt><trkpt lat="46.5" lon="7.6"><ele>410</ele></trkpt></trkseg></trk></gpx>';
    expect(() => analyseRide(plan)).toThrow(/no times/);
    expect(() => analyseRide('hello')).toThrow(/not a GPX/);
  });

  it('reads a TCX file too', () => {
    const tcx = `<TrainingCenterDatabase><Activities><Activity><Lap><Track>
      <Trackpoint><Time>2026-06-01T06:00:00Z</Time><Position><LatitudeDegrees>46.5</LatitudeDegrees><LongitudeDegrees>7.5</LongitudeDegrees></Position><AltitudeMeters>400</AltitudeMeters></Trackpoint>
      <Trackpoint><Time>2026-06-01T06:30:00Z</Time><Position><LatitudeDegrees>46.5</LatitudeDegrees><LongitudeDegrees>7.63</LongitudeDegrees></Position><AltitudeMeters>420</AltitudeMeters></Trackpoint>
    </Track></Lap></Activity></Activities></TrainingCenterDatabase>`;
    const x = analyseRide(tcx, 'test_data_gtp_ride.tcx');
    expect(x.km).toBeGreaterThan(9);
    expect(x.movingH).toBeCloseTo(0.5, 2);
    expect(x.name).toBe('test_data_gtp_ride');
  });

  it('hours as h:mm', () => {
    expect(hm(3.05)).toBe('3:03');
    expect(hm(0.5)).toBe('0:30');
    expect(hm(null)).toBe('–');
  });
});

describe('planned vs real', () => {
  const ride = { km: 50, gainM: 600, movingH: 3.5 };

  it('from the route and the pace guess (unrounded)', () => {
    const trip = { startDate: '2026-06-01', days: 1, route: { km: 50, gainM: 600 } };
    const plan = plannedFor(trip, '2026-06-01', STD);
    expect(plan).toMatchObject({ km: 50, gainM: 600, hours: 4.13, source: 'guess' });
    expect(plan.kmh).toBeCloseTo(12.1, 1);
    const rows = compareRide(ride, plan);
    expect(rows.map((r) => r.key)).toEqual(['km', 'gain', 'moving', 'speed']);
    expect(rows.find((r) => r.key === 'moving').diff).toBeCloseTo(-0.63, 2);
    expect(rows.find((r) => r.key === 'speed').real).toBeCloseTo(14.3, 1);
  });

  it('the typed riding hours and the time plan win over the guess', () => {
    expect(plannedFor({ startDate: '2026-06-01', days: 1, hours: 3, route: { km: 48, gainM: 0 } }, '2026-06-01', STD)).toMatchObject({ hours: 3, kmh: 16, source: 'hours' });
    const plan = { schedule: [{ block: 'Ride', from: '08:00', to: '11:00' }, { block: 'Break', from: '11:00', to: '12:00' }, { block: 'Ride', from: '12:00', to: '14:00' }] };
    expect(plannedFor({ startDate: '2026-06-01', days: 1, nonstop: true, plan, route: { km: 100, gainM: 0 } }, '2026-06-01', STD)).toMatchObject({ hours: 5, kmh: 20, source: 'plan' });
  });

  it('a trip of more days: the share of the day of the ride', () => {
    const plan = plannedFor({ startDate: '2026-06-01', days: 2, route: { km: 160, gainM: 800 } }, '2026-06-02', STD);
    expect(plan.km).toBe(80);
    expect(plan.gainM).toBe(400);
  });

  it('nothing to compare without a route or hours', () => {
    expect(plannedFor({ startDate: '2026-06-01', days: 1 }, '2026-06-01', STD)).toBe(null);
    expect(plannedFor(null, '2026-06-01', STD)).toBe(null);
    expect(compareRide(ride, null)).toEqual([]);
  });

  it('which trips the ride may belong to: by date, not a trip called off', () => {
    const trips = [
      { id: 'a', startDate: '2026-05-31', days: 2 },
      { id: 'b', startDate: '2026-06-01', days: 1, skipped: true },
      { id: 'c', startDate: '2026-06-03', days: 1 },
    ];
    expect(tripsOn(trips, '2026-06-01').map((x) => x.id)).toEqual(['a']);
    expect(tripsOn(trips, '2026-06-02')).toEqual([]);
  });

  it('a past trip from a ride: one day, over at once, the ride as its route, no debrief', () => {
    const r = analyseRide(makeGpx({ name: 'test_data_gtp_ evening', legs: [{ km: 20, kmh: 20 }] }));
    const trip = tripFromRide(r, { id: 'bike-x', name: 'Test bike', setup: { seat: 'bag-1' } }, 1000);
    expect(trip).toMatchObject({ id: 'trip-rs', title: 'test_data_gtp_ evening', startDate: r.date, days: 1, bikeId: 'bike-x', entries: [], status: 'done', finished: r.date, fromRide: r.id });
    expect(trip.route.km).toBe(r.km);
    expect(tripFromRide(r, null).bikeId).toBe(null);
  });
});

describe('learnings from the ride: 1 to 3, nothing applied without a tap', () => {
  it('faster than planned and a long pause', () => {
    const r = analyseRide(makeGpx({ legs: [{ km: 40, kmh: 22 }, { stopMin: 45 }, { km: 40, kmh: 20 }] }));
    const plan = plannedFor({ startDate: r.date, days: 1, route: { km: 80, gainM: 0 } }, r.date, STD);
    const list = rideLearnings(r, plan, STD);
    expect(list.map((s) => s.id)).toEqual(['speed', 'pause']);
    expect(list[0].label).toBe('You ride faster than planned: 21 km/h instead of 16');
    expect(list[1].label).toBe('Long pause at km 40');
    expect(list[1].detail).toMatch(/^45 min/);
    // answered ones are left out
    expect(rideLearnings(r, plan, STD, ['speed']).map((s) => s.id)).toEqual(['pause']);
  });

  it('without a trip: against your pace guess', () => {
    const r = analyseRide(makeGpx({ legs: [{ km: 30, kmh: 12 }] }));
    expect(rideLearnings(r, null, STD)[0].label).toBe('You ride slower than your guess: 12 km/h instead of 16');
  });

  it('climbing slower than assumed, when the climbs are slow and the ride as a whole is not', () => {
    const r = analyseRide(makeGpx({ legs: [{ km: 30, kmh: 25 }, { km: 10, kmh: 4, gainM: 800 }] }));
    expect(r.parts.climb.km).toBeGreaterThan(9);
    expect(r.parts.climb.gainM).toBeGreaterThan(700);
    const list = rideLearnings(r, null, STD);
    const c = list.find((s) => s.id === 'climb');
    expect(c.label).toMatch(/^Climbing slower than assumed: \d+ m per hour instead of \d+$/);
    expect(list.length).toBeLessThanOrEqual(3);
  });

  it('a calm ride as planned says nothing', () => {
    const r = analyseRide(makeGpx({ legs: [{ km: 32, kmh: 16 }, { stopMin: 6 }] }));
    expect(rideLearnings(r, plannedFor({ startDate: r.date, days: 1, route: { km: 32, gainM: 0 } }, r.date, STD), STD)).toEqual([]);
  });

  it('German texts', () => {
    lang.v = 'de';
    const r = analyseRide(makeGpx({ legs: [{ km: 40, kmh: 22 }, { stopMin: 45 }, { km: 40, kmh: 20 }] }));
    const list = rideLearnings(r, plannedFor({ startDate: r.date, days: 1, route: { km: 80, gainM: 0 } }, r.date, STD), STD);
    expect(list[0].label).toBe('Du fährst schneller als geplant: 21 km/h statt 16');
    expect(list[1].label).toBe('Lange Pause bei km 40');
  });

  it('a confirmed learning has the shape of every learning, with the next number', () => {
    const l = learningFrom({ id: 'speed', rule: 'You ride faster than planned: 19 km/h instead of 16' }, [{ id: 4 }, { id: 'L-x' }], 'test_data_gtp_ trip', 'ride-1', '2026-06-02T10:00:00.000Z');
    expect(l).toEqual({ id: 5, topic: 'Pace', rule: 'You ride faster than planned: 19 km/h instead of 16', action: '', itemIds: [], source: 'test_data_gtp_ trip', appliesTo: ['all'], priority: 'medium', confirmed: 0, createdAt: '2026-06-02T10:00:00.000Z', rideId: 'ride-1', kind: 'speed' });
    expect(DE.Pace).toBeTruthy();
  });
});

describe('the ride feeds your pace', () => {
  it('adds the ride once and learns the pace again; taken out when deleted', () => {
    const r = analyseRide(makeGpx({ legs: [{ km: 60, kmh: 20 }] }));
    const s1 = addToPace(null, r, 'now');
    expect(s1.rides.length).toBe(1);
    expect(s1.kmh).toBeCloseTo(20, 0);
    expect(s1.n).toBe(1);
    expect(addToPace(s1, r, 'now').rides.length).toBe(1);
    const s2 = dropFromPace(s1, r.id, 'now');
    expect(s2.rides).toEqual([]);
    expect(s2.kmh).toBe(null);
  });
});
