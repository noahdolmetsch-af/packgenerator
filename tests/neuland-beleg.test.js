import { describe, it, expect } from 'vitest';
import { proofOf, nearestOnLine, candidateTracks, reachOf, mapOf } from '../src/lib/neuland/beleg.js';
import { tracksOf } from '../src/lib/neuland/neuland.js';

// a fictional pass and two lines: one runs 100 m beside it, the other 520 m beside it
const PASS = { id: 'p-testpass', name: 'Testpass', lat: 46.8686, lon: 8.8546 };
const near = [[46.8686, 8.84], [46.8695, 8.8546], [46.8686, 8.87]]; // about 100 m north at the middle
const edge = [[46.873, 8.84], [46.8733, 8.8546], [46.873, 8.87]]; // about 520 m north
const asFound = (day, extra = {}) => ({ day, tripId: null, rideId: null, years: {}, ...extra });

describe('Warum zählt das? (beleg.js)', () => {
  it('finds the closest point of a line and its distance', () => {
    const n = nearestOnLine([PASS.lat, PASS.lon], near);
    expect(n.km * 1000).toBeGreaterThan(90);
    expect(n.km * 1000).toBeLessThan(110);
    expect(n.at[1]).toBeCloseTo(8.8546, 3);
    expect(nearestOnLine([0, 0], [])).toBeNull();
  });

  it('a clear hit: the ride of the day, distance in metres, piece of line for the map', () => {
    const tracks = tracksOf({ rides: [{ id: 'r1', date: '2026-07-04', tripId: 't1', line: near }], today: '2026-10-19' });
    const p = proofOf(asFound('2026-07-04', { tripId: 't1', rideId: 'r1' }), PASS, 0.6, tracks);
    expect(p).toMatchObject({ src: 'ride', day: '2026-07-04', tripId: 't1', rideId: 'r1', level: 'clear', reachM: 600, thin: false });
    expect(p.distM).toBeGreaterThan(90);
    expect(p.distM).toBeLessThan(110);
    expect(p.pieces.length).toBeGreaterThan(0);
    expect(p.pieces[0].length).toBeGreaterThan(1);
  });

  it('a close call at the edge of the zone', () => {
    const tracks = tracksOf({ rides: [{ id: 'r2', date: '2026-08-01', line: edge }], today: '2026-10-19' });
    const p = proofOf(asFound('2026-08-01', { rideId: 'r2' }), PASS, 0.6, tracks);
    expect(p.level).toBe('close');
    expect(p.distM).toBeGreaterThan(500);
    expect(p.distM).toBeLessThan(540);
  });

  it('picks the track of the day and the ride, not an other line', () => {
    const tracks = tracksOf({
      rides: [
        { id: 'a', date: '2026-07-04', line: edge },
        { id: 'b', date: '2026-07-04', line: near },
        { id: 'c', date: '2026-07-05', line: near },
      ],
      today: '2026-10-19',
    });
    expect(candidateTracks(asFound('2026-07-04', { rideId: 'a' }), tracks).map((t) => t.rideId)).toEqual(['a']);
    expect(candidateTracks(asFound('2026-07-04'), tracks).map((t) => t.rideId)).toEqual(['a', 'b']);
    // the day has no line any more: all lines are looked at
    expect(candidateTracks(asFound('2026-01-01'), tracks)).toHaveLength(3);
    expect(candidateTracks(null, tracks)).toEqual([]);
  });

  it('a trip with only a start place is thin', () => {
    const tracks = tracksOf({ trips: [{ id: 't', startDate: '2026-07-04', place: { lat: 46.869, lon: 8.855 } }], today: '2026-10-19' });
    const p = proofOf(asFound('2026-07-04', { tripId: 't' }), PASS, 0.6, tracks);
    expect(p.thin).toBe(true);
    expect(p.src).toBe('trip');
    expect(p.distM).toBeLessThan(100);
  });

  it('answers null without a place, without a finding or without a line', () => {
    const tracks = tracksOf({ rides: [{ id: 'r1', date: '2026-07-04', line: near }], today: '2026-10-19' });
    expect(proofOf(null, PASS, 0.6, tracks)).toBeNull();
    expect(proofOf(asFound('2026-07-04'), { id: 'x', name: 'Canton' }, 0.6, tracks)).toBeNull();
    expect(proofOf(asFound('2026-07-04'), PASS, 0.6, [])).toBeNull();
  });

  it('the zone is the radius of the collection plus the own radius of a lake point', () => {
    expect(reachOf({ id: 'passes', radius: 0.6 }, PASS)).toBeCloseTo(0.6);
    expect(reachOf({ id: 'lakes', radius: 0.3 }, { r: 0.2 })).toBeCloseTo(0.5);
    expect(reachOf({ id: 'u-own' }, PASS)).toBeCloseTo(0.2); // an own collection
    expect(reachOf({ id: 'passes' }, PASS)).toBeCloseTo(0.5); // a built-in one without a radius: an added item
  });

  it('draws the map inside its box with a round scale bar', () => {
    const tracks = tracksOf({ rides: [{ id: 'r1', date: '2026-07-04', line: near }], today: '2026-10-19' });
    const p = proofOf(asFound('2026-07-04', { rideId: 'r1' }), PASS, 0.6, tracks);
    const m = mapOf(p);
    expect(m.spot).toEqual([150, 100]);
    expect(m.at[1]).toBeLessThan(100); // the line passes north of the place: smaller y
    expect(m.zone).toBeGreaterThan(0);
    expect([50, 100, 200, 500, 1000, 2000, 5000, 10000]).toContain(m.bar.m);
    expect(m.bar.px).toBeLessThanOrEqual(120.5);
    expect(m.pieces[0].startsWith('M')).toBe(true);
  });
});
